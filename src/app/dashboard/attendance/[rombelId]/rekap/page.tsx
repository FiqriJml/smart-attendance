"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Rombel, DailyAttendanceSemester } from "@/types";
import { attendanceService } from "@/services/attendanceService";
import { userService } from "@/services/userService";
import { FiArrowLeft, FiDownload, FiCalendar } from "react-icons/fi";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui";

export default function RecapPage() {
    const router = useRouter();
    const params = useParams();
    const rombelId = typeof params?.rombelId === 'string' ? decodeURIComponent(params.rombelId) : "";

    const [rombelData, setRombelData] = useState<Rombel | null>(null);
    const [loading, setLoading] = useState(true);

    // Default to current month
    const now = new Date();
    const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [year, setYear] = useState(String(now.getFullYear()));

    // Store Full Semester Data
    const [semesterData, setSemesterData] = useState<DailyAttendanceSemester | null>(null);

    // Hardcode semester for now, matching the filling page
    const currentSemester = "2024-2025-genap";

    // Fetch Class & Attendance
    useEffect(() => {
        if (!rombelId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get Rombel Info
                const rombel = await userService.getRombelById(rombelId);

                if (rombel) {
                    setRombelData(rombel);

                    // 2. Get Semester Attendance
                    // We fetch the WHOLE semester once, then filter locally by month/year for display
                    const report = await attendanceService.getSemesterAttendance(rombelId, currentSemester);
                    setSemesterData(report);
                } else {
                    // Handle not found
                    setRombelData(null);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rombelId]); // Only refetch if rombelId changes. Month/Year changes just filter existing data.

    // Generate Dates Array (1..31 based on month)
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

    // Helper: Get formatted status for a student on a specific date
    const getStatus = (nisn: string, day: string) => {
        if (!semesterData?.history) return "";

        // Construct Full Date Key: YYYY-MM-DD
        const dateKey = `${year}-${month}-${day}`;

        const entry = semesterData.history[dateKey];
        if (!entry) return ""; // No data for this date

        // Check records
        const record = entry.records.find(r => r.nisn === nisn);

        // If record exists, return status (S/I/A).
        if (record) return record.status;

        // If data exists for the date but student is not in the records list, they are Present (H)
        return "H";
    };

    const handleExport = () => {
        if (!rombelData) return;

        // 1. Prepare Header
        const header = ["No", "NISN", "Nama", ...dates, "S", "I", "A", "H"];

        // 2. Prepare Rows
        const rows = (rombelData.daftar_siswa_ref || []).map((student, index) => {
            let sCount = 0, iCount = 0, aCount = 0, hCount = 0;

            const dateStatuses = dates.map(day => {
                const st = getStatus(student.nisn, day);
                if (st === 'S' || st === 'sakit') { sCount++; return 'S'; }
                if (st === 'I' || st === 'izin') { iCount++; return 'I'; }
                if (st === 'A' || st === 'alpha') { aCount++; return 'A'; }
                if (st === 'H' || st === 'hadir') { hCount++; return 'H'; }
                return '-';
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
            [`Rekap Absensi: ${rombelData.nama_rombel}`],
            [`Periode: ${month}/${year}`],
            [],
            header,
            ...rows
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap");

        // 4. Download
        XLSX.writeFile(wb, `Rekap_${rombelData.id}_${month}-${year}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (!rombelData) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold text-slate-800">Rombel Tidak Ditemukan</h2>
                <Button onClick={() => router.back()} variant="secondary" className="mt-4">
                    Kembali
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/dashboard/attendance/${rombelId}`)} className="text-gray-500 hover:text-blue-600">
                        <FiArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Rekap Bulanan</h1>
                        <p className="text-sm text-gray-500">{rombelData.nama_rombel} - {rombelData.program_keahlian}</p>
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
                            {(rombelData.daftar_siswa_ref || []).map((student, idx) => {
                                let s = 0, i = 0, a = 0;

                                // Pre-calculate stats for this row to show in summary columns
                                const rowStatuses = dates.map(d => getStatus(student.nisn, d));
                                rowStatuses.forEach(st => {
                                    if (st === 'S' || st === 'sakit') s++;
                                    if (st === 'I' || st === 'izin') i++;
                                    if (st === 'A' || st === 'alpha') a++;
                                });

                                return (
                                    <tr key={student.nisn} className="hover:bg-gray-50">
                                        <td className="p-3 border-r sticky left-0 bg-white">{idx + 1}</td>
                                        <td className="p-3 border-r sticky left-10 bg-white font-medium text-gray-800">
                                            <div className="truncate max-w-[240px]" title={student.nama}>
                                                {student.nama}
                                            </div>
                                        </td>
                                        {dates.map((d, index) => {
                                            const status = rowStatuses[index]; // Use pre-calculated
                                            let colorClass = "text-gray-300"; // for '-'
                                            let display = "-";

                                            if (status === 'S' || status === 'sakit') { colorClass = "text-blue-600 font-bold bg-blue-50"; display = "S"; }
                                            else if (status === 'I' || status === 'izin') { colorClass = "text-yellow-600 font-bold bg-yellow-50"; display = "I"; }
                                            else if (status === 'A' || status === 'alpha') { colorClass = "text-red-600 font-bold bg-red-50"; display = "A"; }
                                            else if (status === 'H' || status === 'hadir') { colorClass = "text-green-500 font-bold"; display = "•"; }

                                            // Render logic
                                            return (
                                                <td key={d} className={`p-2 text-center border-r border-gray-50 ${colorClass}`}>
                                                    {display}
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
