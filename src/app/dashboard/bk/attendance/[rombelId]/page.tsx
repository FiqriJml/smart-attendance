"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { userService } from "@/services/userService";
import { attendanceService } from "@/services/attendanceService";
import { Card, Button } from "@/components/ui";
import { FiArrowLeft, FiSave, FiCheck } from "react-icons/fi";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { AttendanceRecord, AttendanceStatus } from "@/types";

export default function BKAttendancePage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const rombelId = params.rombelId as string;

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Assume current semester (you can make this dynamic later)
    const currentSemester = "2024-2025-genap";

    const { data: rombel, isLoading } = useSWR(
        rombelId ? `rombel-${rombelId}` : null,
        () => userService.getRombelById(rombelId)
    );

    const { data: existingAttendance, mutate } = useSWR(
        rombelId && selectedDate ? `attendance-${rombelId}-${selectedDate}` : null,
        () => attendanceService.getDailyAttendance(rombelId, currentSemester, selectedDate)
    );

    useEffect(() => {
        if (!loading && userProfile?.role !== 'bk') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);

    useEffect(() => {
        if (existingAttendance && existingAttendance.records) {
            // Convert AttendanceRecord[] to Record<nisn, status>
            const dataMap: Record<string, AttendanceStatus> = {};
            (rombel?.daftar_siswa_ref || []).forEach(siswa => {
                const record = existingAttendance.records.find(r => r.nisn === siswa.nisn);
                dataMap[siswa.nisn] = record ? record.status : 'hadir';
            });
            setAttendanceData(dataMap);
            setLastSaved(existingAttendance.updated_by || null);
        } else if (rombel) {
            // Initialize with all "hadir"
            const initialData: Record<string, AttendanceStatus> = {};
            (rombel.daftar_siswa_ref || []).forEach(siswa => {
                initialData[siswa.nisn] = 'hadir';
            });
            setAttendanceData(initialData);
            setLastSaved(null);
        }
    }, [existingAttendance, rombel, selectedDate]);

    const handleSave = async () => {
        if (!userProfile?.email || !rombelId) return;

        setIsSaving(true);
        try {
            // Convert Record<nisn, status> to AttendanceRecord[]
            const records: AttendanceRecord[] = Object.entries(attendanceData).map(([nisn, status]) => ({
                nisn,
                status
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

    if (loading || !userProfile || isLoading || !rombel) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
        </div>
    );

    const statusOptions: Array<{ value: AttendanceStatus; label: string; color: string }> = [
        { value: 'hadir', label: 'Hadir', color: 'bg-emerald-500' },
        { value: 'terlambat', label: 'Terlambat', color: 'bg-amber-500' },
        { value: 'sakit', label: 'Sakit', color: 'bg-blue-500' },
        { value: 'izin', label: 'Izin', color: 'bg-purple-500' },
        { value: 'alpha', label: 'Alpha', color: 'bg-red-500' }
    ];

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/bk">
                        <Button variant="secondary" className="flex items-center gap-2">
                            <FiArrowLeft />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{rombel.nama_rombel}</h1>
                        <p className="text-slate-500">{rombel.program_keahlian}</p>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Pilih Tanggal
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        {lastSaved && (
                            <div className="text-sm text-slate-600">
                                <FiCheck className="inline mr-1 text-emerald-600" />
                                Terakhir diisi oleh: {lastSaved}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 mb-6">
                        {(rombel.daftar_siswa_ref || []).map((siswa, idx) => (
                            <div
                                key={siswa.nisn}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-slate-500 w-8">
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium text-slate-800">
                                        {siswa.nama}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {statusOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setAttendanceData(prev => ({
                                                ...prev,
                                                [siswa.nisn]: option.value
                                            }))}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${attendanceData[siswa.nisn] === option.value
                                                    ? `${option.color} text-white`
                                                    : 'bg-white text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <FiSave />
                        {isSaving ? 'Menyimpan...' : 'Simpan Kehadiran'}
                    </Button>
                </Card>
            </div>
        </>
    );
}
