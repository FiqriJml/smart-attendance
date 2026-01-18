"use client";

import { useRouter, useParams } from "next/navigation";
import { useAttendance } from "@/features/attendance/hooks/useAttendance";
import { AttendanceToggle, StatsBar } from "@/features/attendance/components/AttendanceToggle";
import { Button, Card } from "@/components/ui";
import { FiCalendar, FiSave, FiArrowLeft, FiRefreshCw, FiBarChart2 } from "react-icons/fi";

export default function AttendancePage() {
    const router = useRouter();
    const params = useParams();
    const classId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : "";

    const {
        classData,
        attendanceMap,
        setStatus,
        selectedDate,
        setSelectedDate,
        isLoading,
        saveAttendance,
        isSaving,
        syncStudents,
        isSyncing,
        stats
    } = useAttendance(classId);

    const handleSave = async () => {
        await saveAttendance();
        alert("Presensi berhasil disimpan!");
        router.push("/dashboard");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
                    <span className="text-sm text-slate-500">Memuat data kelas...</span>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <Card className="text-center py-12">
                <p className="text-slate-500">Kelas tidak ditemukan</p>
                <Button onClick={() => router.push("/dashboard")} variant="secondary" className="mt-4">
                    Kembali ke Dashboard
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <Card noPadding className="overflow-hidden">
                {/* Top Section */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <FiArrowLeft className="text-slate-500" size={20} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-slate-800 truncate">
                                {classData.mata_pelajaran}
                            </h1>
                            <p className="text-sm text-slate-500">{classData.rombel_id}</p>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Date Picker */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1 min-w-[180px]">
                            <FiCalendar className="text-indigo-600" size={18} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="bg-transparent outline-none text-sm font-medium text-slate-700 flex-1"
                            />
                        </div>

                        {/* Action Buttons */}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={syncStudents}
                            loading={isSyncing}
                            className="whitespace-nowrap"
                        >
                            <FiRefreshCw size={16} />
                            Sync
                        </Button>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/dashboard/kelas/${classId}/rekap`)}
                            className="whitespace-nowrap"
                        >
                            <FiBarChart2 size={16} />
                            Rekap
                        </Button>
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
                    Daftar Siswa ({classData.daftar_siswa?.length || 0})
                </h2>

                <div className="space-y-2">
                    {classData.daftar_siswa?.map((student) => (
                        <AttendanceToggle
                            key={student.nisn}
                            value={attendanceMap[student.nisn] || 'H'}
                            onChange={(status) => setStatus(student.nisn, status)}
                            studentName={student.nama}
                            nisn={student.nisn}
                            disabled={isSaving}
                        />
                    ))}
                </div>

                {(!classData.daftar_siswa || classData.daftar_siswa.length === 0) && (
                    <Card className="text-center py-8">
                        <p className="text-slate-500">Belum ada siswa di kelas ini</p>
                        <Button
                            onClick={syncStudents}
                            variant="secondary"
                            size="sm"
                            className="mt-3"
                        >
                            <FiRefreshCw size={16} />
                            Sync dari Rombel
                        </Button>
                    </Card>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4 md:px-6 z-30">
                <div className="max-w-7xl mx-auto">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleSave}
                        loading={isSaving}
                        className="shadow-lg"
                    >
                        <FiSave size={20} />
                        Simpan Presensi
                    </Button>
                </div>
            </div>
        </div>
    );
}
