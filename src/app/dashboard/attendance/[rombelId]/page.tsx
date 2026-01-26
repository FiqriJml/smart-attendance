"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { userService } from "@/services/userService";
import { attendanceService } from "@/services/attendanceService";
import { Card, Button } from "@/components/ui";
import { FiArrowLeft, FiSave, FiCalendar, FiCheck, FiRefreshCw, FiBarChart2 } from "react-icons/fi";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { AttendanceRecord, AttendanceStatus } from "@/types";
import { AttendanceToggle, StatsBar } from "@/features/attendance/components/AttendanceToggle";

export default function AttendancePage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const rombelId = typeof params?.rombelId === 'string' ? decodeURIComponent(params.rombelId) : "";

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    // Local state uses 'H' instead of 'hadir' to match AttendanceToggle component
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus | 'H'>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Assume current semester (you can make this dynamic later or helper)
    const currentSemester = "2024-2025-genap";

    const { data: rombel, isLoading: isLoadingRombel } = useSWR(
        rombelId ? `rombel-${rombelId}` : null,
        () => userService.getRombelById(rombelId)
    );

    const { data: existingAttendance, mutate } = useSWR(
        rombelId && selectedDate ? `attendance-${rombelId}-${selectedDate}` : null,
        () => attendanceService.getDailyAttendance(rombelId, currentSemester, selectedDate)
    );

    // Auth Protection
    useEffect(() => {
        if (!loading && userProfile?.role !== 'bk' && userProfile?.role !== 'admin' && userProfile?.role !== 'wali_kelas') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);

    // Initialize Data
    useEffect(() => {
        if (rombel) {
            const initialMap: Record<string, AttendanceStatus | 'H'> = {};

            // Default all to 'H'
            (rombel.daftar_siswa_ref || []).forEach(siswa => {
                initialMap[siswa.nisn] = 'H';
            });

            // Override with existing data if available
            if (existingAttendance && existingAttendance.records) {
                existingAttendance.records.forEach(r => {
                    // Map 'hadir' to 'H' for component compatibility
                    const status = r.status === 'hadir' ? 'H' : r.status;
                    initialMap[r.nisn] = status;
                });
                setLastSaved(existingAttendance.updated_by || null);
            } else {
                setLastSaved(null);
            }

            setAttendanceMap(initialMap);
        }
    }, [existingAttendance, rombel, selectedDate]);

    const handleSave = async () => {
        if (!userProfile?.email || !rombelId) return;

        setIsSaving(true);
        try {
            // Convert Map back to Records
            // 'H' -> 'hadir' for database consistency (or keep 'H' if allowed, but types say 'hadir')
            // The type definition says 'hadir'.
            const records: AttendanceRecord[] = Object.entries(attendanceMap).map(([nisn, status]) => ({
                nisn,
                status: status === 'H' ? 'hadir' : status as AttendanceStatus
            }));

            await attendanceService.recordDailyAttendance(
                rombelId,
                currentSemester,
                selectedDate,
                records,
                userProfile.email
            );

            setLastSaved(userProfile.email);
            await mutate(); // Refresh data
            toast.success('Kehadiran berhasil disimpan');
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Gagal menyimpan kehadiran');
        } finally {
            setIsSaving(false);
        }
    };

    const stats = useMemo(() => {
        const result = { H: 0, S: 0, I: 0, A: 0 };
        Object.values(attendanceMap).forEach(s => {
            // Map 'hadir' to 'H' for counting if needed, but our state is already 'H' or 'S'/'I'/'A'
            // If state has 'hadir' (from DB directly without conversion), handle it.
            // But we convert in useEffect.
            const key = s === 'hadir' ? 'H' : s;
            if (key in result) result[key as keyof typeof result]++;
        });
        return result;
    }, [attendanceMap]);

    const setStatus = (nisn: string, status: AttendanceStatus | 'H') => {
        setAttendanceMap(prev => ({
            ...prev,
            [nisn]: status
        }));
    };

    if (loading || isLoadingRombel) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (!rombel) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold text-slate-800">Rombel Tidak Ditemukan</h2>
                <p className="text-slate-500 mt-2">Data rombel tidak tersedia.</p>
                <Link href="/dashboard/bk" className="inline-block mt-4">
                    <Button variant="secondary">Kembali</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <Toaster position="top-right" />

            {/* Header */}
            <Card noPadding className="overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href={`/dashboard/bk/kelas/${rombel.tingkat}`}>
                            <Button variant="ghost" className="p-2 hover:bg-slate-100 rounded-lg transition-colors h-auto w-auto">
                                <FiArrowLeft className="text-slate-500" size={20} />
                            </Button>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-slate-800 truncate">
                                {rombel.nama_rombel}
                            </h1>
                            <p className="text-sm text-slate-500">{rombel.program_keahlian}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1 min-w-[180px]">
                            <FiCalendar className="text-indigo-600" size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium text-slate-700 flex-1"
                            />
                        </div>

                        <Link href={`/dashboard/attendance/${rombelId}/rekap`}>
                            <Button variant="secondary" className="flex items-center gap-2 whitespace-nowrap">
                                <FiBarChart2 size={16} />
                                Rekap
                            </Button>
                        </Link>

                        {lastSaved && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <FiCheck size={14} className="text-emerald-600" />
                                Updated by: {lastSaved.split('@')[0]}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="p-4 bg-slate-50">
                    <StatsBar stats={stats} />
                </div>
            </Card>

            {/* Student List */}
            <div className="space-y-2">
                <h2 className="text-sm font-medium text-slate-500 px-1">
                    Daftar Siswa ({rombel.daftar_siswa_ref?.length || 0})
                </h2>

                <div className="space-y-2">
                    {(rombel.daftar_siswa_ref || []).map((siswa) => (
                        <AttendanceToggle
                            key={siswa.nisn}
                            value={attendanceMap[siswa.nisn] || 'H'}
                            onChange={(status) => setStatus(siswa.nisn, status)}
                            studentName={siswa.nama}
                            nisn={siswa.nisn}
                            disabled={isSaving}
                        />
                    ))}
                </div>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4 md:px-6 z-30">
                <div className="max-w-7xl mx-auto">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSave}
                        disabled={isSaving}
                        className="shadow-lg flex items-center justifying-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <FiSave size={20} />
                                Simpan Kehadiran
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
