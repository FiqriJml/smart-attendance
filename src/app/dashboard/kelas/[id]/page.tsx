"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClassSession, Student, AttendanceStatus, AttendanceRecord } from "@/types";
import { attendanceService } from "@/services/attendanceService";
import { FiCalendar, FiSave, FiArrowLeft, FiUserCheck, FiUserX, FiActivity } from "react-icons/fi";

// Helper to format date YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function AttendancePage() {
    const router = useRouter();
    const params = useParams(); // Using hook is safer for Client Components
    // Ensure ID is string and decoded
    const classId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : "";

    const [classData, setClassData] = useState<ClassSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [submitting, setSubmitting] = useState(false);

    // Attendance State: Map<NISN, Status>
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus | 'H'>>({});

    useEffect(() => {
        if (classId) {
            console.log("Fetching class data for ID:", classId);
            fetchClassData(classId);
        }
    }, [classId]);

    const fetchClassData = async (id: string) => {
        try {
            const ref = doc(db, "classes", id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data() as ClassSession;
                setClassData(data);

                // Initialize Attendance Map (Default 'H')
                const initialMap: Record<string, AttendanceStatus | 'H'> = {};
                (data.daftar_siswa || []).forEach(s => {
                    initialMap[s.nisn] = 'H';
                });
                setAttendanceMap(initialMap);

                // Check existing
                const [year, month, _day] = selectedDate.split('-');
                const existing = await attendanceService.getMonthlyReport(id, year, month);
                if (existing && existing.history && existing.history[selectedDate.split('-')[2]]) {
                    const dayRecords = existing.history[selectedDate.split('-')[2]];
                    dayRecords.forEach(r => {
                        initialMap[r.nisn] = r.status;
                    });
                    setAttendanceMap({ ...initialMap });
                }

            } else {
                alert("Kelas tidak ditemukan");
                router.push("/dashboard");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch on date change
    useEffect(() => {
        if (classId && classData) {
            const [year, month, day] = selectedDate.split('-');
            attendanceService.getMonthlyReport(classId, year, month).then(existing => {
                const newMap: Record<string, AttendanceStatus | 'H'> = {};
                (classData.daftar_siswa || []).forEach(s => newMap[s.nisn] = 'H');

                if (existing && existing.history && existing.history[day]) {
                    existing.history[day].forEach(r => {
                        newMap[r.nisn] = r.status;
                    });
                }
                setAttendanceMap(newMap);
            });
        }
    }, [selectedDate, classId]);

    const handleStatusChange = (nisn: string, status: AttendanceStatus | 'H') => {
        setAttendanceMap(prev => ({
            ...prev,
            [nisn]: status
        }));
    };

    const handleSave = async () => {
        if (!classData || !classId) return;
        setSubmitting(true);
        try {
            const [year, month, day] = selectedDate.split('-');

            // Filter only absences (S, I, A)
            const absences: AttendanceRecord[] = [];
            Object.entries(attendanceMap).forEach(([nisn, status]) => {
                if (status !== 'H') {
                    absences.push({
                        nisn,
                        status: status as AttendanceStatus
                    });
                }
            });

            await attendanceService.recordAttendance(classId, year, month, day, absences);
            alert("Presensi berhasil disimpan!");
            router.push("/dashboard");
        } catch (e: any) {
            alert("Gagal menyimpan: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Counters
    const stats = { H: 0, S: 0, I: 0, A: 0 };
    Object.values(attendanceMap).forEach(s => stats[s]++);

    if (loading) return <div className="p-8 text-center">Loading Data Kelas...</div>;
    if (!classData) return null;

    return (
        <div className="space-y-6 pb-20">
            {/* Minimal Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-blue-600">
                        <FiArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">{classData.mata_pelajaran}</h1>
                        <p className="text-sm text-gray-500">{classData.rombel_id}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FiCalendar className="text-blue-600" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => router.push(`/dashboard/kelas/${classId}/rekap`)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                        Lihat Rekap
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                        <div className="text-xs text-green-600 font-bold">HADIR</div>
                        <div className="text-lg font-bold text-green-700">{stats.H}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-bold">SAKIT</div>
                        <div className="text-lg font-bold text-blue-700">{stats.S}</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                        <div className="text-xs text-yellow-600 font-bold">IZIN</div>
                        <div className="text-lg font-bold text-yellow-700">{stats.I}</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                        <div className="text-xs text-red-600 font-bold">ALPHA</div>
                        <div className="text-lg font-bold text-red-700">{stats.A}</div>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {classData.daftar_siswa && classData.daftar_siswa.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {classData.daftar_siswa.map((student) => (
                            <div key={student.nisn} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{student.nama}</div>
                                    <div className="text-xs text-gray-400">{student.nisn}</div>
                                </div>

                                {/* Attendance Toggles */}
                                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => handleStatusChange(student.nisn, 'H')}
                                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${attendanceMap[student.nisn] === 'H' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                                    >H</button>
                                    <button
                                        onClick={() => handleStatusChange(student.nisn, 'S')}
                                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${attendanceMap[student.nisn] === 'S' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                                    >S</button>
                                    <button
                                        onClick={() => handleStatusChange(student.nisn, 'I')}
                                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${attendanceMap[student.nisn] === 'I' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                                    >I</button>
                                    <button
                                        onClick={() => handleStatusChange(student.nisn, 'A')}
                                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${attendanceMap[student.nisn] === 'A' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                                    >A</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        Belum ada data siswa di kelas ini.
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-64">
                <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-gray-400"
                >
                    <FiSave size={20} />
                    {submitting ? "Menyimpan..." : "Simpan Presensi"}
                </button>
            </div>
        </div>
    );
}
