"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClassSession, AttendanceMonthly } from "@/types";
import { attendanceService } from "@/services/attendanceService";
import { FiArrowLeft, FiDownload, FiCalendar } from "react-icons/fi";
import * as XLSX from "xlsx";

export default function RecapPage() {
    const router = useRouter();
    const params = useParams();
    const classId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : "";

    const [classData, setClassData] = useState<ClassSession | null>(null);
    const [loading, setLoading] = useState(true);

    // Default to current month
    const now = new Date();
    const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [year, setYear] = useState(String(now.getFullYear()));

    const [monthlyData, setMonthlyData] = useState<AttendanceMonthly | null>(null);

    // Fetch Class & Attendance
    useEffect(() => {
        if (!classId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Class Info (for Student List)
                const classRef = doc(db, "classes", classId);
                const classSnap = await getDoc(classRef);

                if (classSnap.exists()) {
                    setClassData(classSnap.data() as ClassSession);

                    // 2. Get Monthly Attendance
                    const report = await attendanceService.getMonthlyReport(classId, year, month);
                    setMonthlyData(report);
                } else {
                    alert("Kelas tidak ditemukan");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, month, year]);

    // Generate Dates Array (1..31 based on month)
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

    // Helper: Get formatted status for a student on a specific date
    const getStatus = (nisn: string, date: string) => {
        if (!monthlyData?.history?.[date]) return ""; // No record for this date at all

        const record = monthlyData.history[date].find(r => r.nisn === nisn);
        // If record found, return status (S/I/A). 
        // If date exists in history but student NOT in list, it means they were Present (H) 
        // assuming "Attendance by Exception".
        // HOWEVER, we only know if the date "exists" in history if *someone* was absent?
        // Actually, if the teacher clicked "Save" for a date, does it create a key?
        // Implementation detail: attendanceService updates `history.${date}`. 
        // If NO ONE was absent, the array is empty `[]`. Keys still exist? 
        // Yes, if we save `[]`. 
        // But if teacher never opened/saved that date, key is missing.

        if (record) return record.status;

        // If the date key exists in history, but student not in array -> Present
        if (monthlyData.history[date]) return "H";

        return "-"; // Not recorded / Hollyday
    };

    const handleExport = () => {
        if (!classData) return;

        // 1. Prepare Header
        const header = ["No", "NISN", "Nama", ...dates, "S", "I", "A", "H"];

        // 2. Prepare Rows
        const rows = classData.daftar_siswa.map((student, index) => {
            let sCount = 0, iCount = 0, aCount = 0, hCount = 0;

            const dateStatuses = dates.map(date => {
                const st = getStatus(student.nisn, date);
                if (st === 'S') sCount++;
                if (st === 'I') iCount++;
                if (st === 'A') aCount++;
                // If 'H' or '-'? Assuming '-' doesn't count as H for stats, or maybe it does?
                // Let's count explicit 'H' derived from (date exists && not absent).
                if (st === 'H') hCount++;
                return st;
            });

            return [
                index + 1,
                student.nisn,
                student.nama,
                ...dateStatuses,
                sCount, iCount, aCount, hCount
            ];
        });

        // 3. Create Sheet
        const wsData = [
            [`Rekap Absensi: ${classData.mata_pelajaran} (${classData.rombel_id})`],
            [`Periode: ${month}/${year}`],
            [],
            header,
            ...rows
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap");

        // 4. Download
        XLSX.writeFile(wb, `Rekap_${classData.rombel_id}_${month}-${year}.xlsx`);
    };

    if (loading) return <div className="p-8 text-center">Loading Rekap...</div>;
    if (!classData) return null;

    return (
        <div className="space-y-6 pb-20 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-blue-600">
                        <FiArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Rekap Bulanan</h1>
                        <p className="text-sm text-gray-500">{classData.mata_pelajaran} - {classData.rombel_id}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Period Picker */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <FiCalendar className="text-gray-500" />
                        <select value={month} onChange={e => setMonth(e.target.value)} className="bg-transparent outline-none text-sm">
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                                <option key={m} value={m}>{new Date(2024, parseInt(m) - 1, 1).toLocaleString('id-ID', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select value={year} onChange={e => setYear(e.target.value)} className="bg-transparent outline-none text-sm">
                            {(() => {
                                const currentYear = new Date().getFullYear();
                                return [currentYear - 1, currentYear, currentYear + 1].map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ));
                            })()}
                        </select>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                        <FiDownload />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <div className="min-w-max">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-3 border-b border-r sticky left-0 bg-gray-50 z-10 w-10">No</th>
                                <th className="p-3 border-b border-r sticky left-10 bg-gray-50 z-10 w-64">Nama Siswa</th>
                                {dates.map(d => (
                                    <th key={d} className="p-2 border-b text-center w-8">{d}</th>
                                ))}
                                <th className="p-2 border-b text-center bg-blue-50 text-blue-700">S</th>
                                <th className="p-2 border-b text-center bg-yellow-50 text-yellow-700">I</th>
                                <th className="p-2 border-b text-center bg-red-50 text-red-700">A</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {classData.daftar_siswa.map((student, idx) => {
                                let s = 0, i = 0, a = 0;
                                return (
                                    <tr key={student.nisn} className="hover:bg-gray-50">
                                        <td className="p-3 border-r sticky left-0 bg-white">{idx + 1}</td>
                                        <td className="p-3 border-r sticky left-10 bg-white font-medium text-gray-800">{student.nama}</td>
                                        {dates.map(d => {
                                            const status = getStatus(student.nisn, d);
                                            let colorClass = "text-gray-300"; // for '-'
                                            if (status === 'S') { s++; colorClass = "text-blue-600 font-bold bg-blue-50"; }
                                            if (status === 'I') { i++; colorClass = "text-yellow-600 font-bold bg-yellow-50"; }
                                            if (status === 'A') { a++; colorClass = "text-red-600 font-bold bg-red-50"; }
                                            if (status === 'H') { colorClass = "text-green-500 font-bold"; }

                                            // Render logic
                                            return (
                                                <td key={d} className={`p-2 text-center border-r border-gray-50 ${colorClass}`}>
                                                    {status === 'H' ? '•' : status}
                                                </td>
                                            );
                                        })}
                                        <td className="p-2 text-center font-bold text-gray-600 border-l">{s || '-'}</td>
                                        <td className="p-2 text-center font-bold text-gray-600">{i || '-'}</td>
                                        <td className="p-2 text-center font-bold text-gray-600">{a || '-'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
                Tanda (•) menunjukkan siswa Hadir. Tanda (-) belum ada data/libur.
            </p>
        </div>
    );
}
