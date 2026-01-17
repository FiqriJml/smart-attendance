"use client";

import { useState } from "react";
import { masterDataService } from "@/services/masterDataService";
import { classService } from "@/services/classService";
import { attendanceService } from "@/services/attendanceService";
import { Student, Rombel, ClassSession, AttendanceRecord } from "@/types";

export default function TestDBPage() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const handleCreateMasterData = async () => {
        try {
            addLog("Creating Dummy Student...");
            const student: Student = {
                nisn: "12345",
                nama: "Budi Santoso",
                jk: "L",
                rombel_id: "X-TE2",
                tanggal_masuk: "2024-07-15"
            };
            await masterDataService.createStudent(student);
            addLog("Student 'Budi Santoso' created.");

            addLog("Creating Rombel X-TE2...");
            const rombel: Rombel = {
                id: "X-TE2",
                nama_rombel: "X Teknik Elektronika 2",
                tingkat: 10,
                program_keahlian: "Teknik Elektronika",
                kompetensi_keahlian: null,
                daftar_siswa_ref: [{ nisn: "12345", nama: "Budi Santoso", jk: "L" }]
            };
            await masterDataService.createRombel(rombel);
            addLog("Rombel X-TE2 created.");
        } catch (e: any) {
            addLog(`Error Master Data: ${e.message}`);
        }
    };

    const handleCreateClass = async () => {
        try {
            addLog("Creating Class Session X-TE2-MATH-2024...");
            // Simulate sync from rombel first
            const students = await masterDataService.getStudentsByRombel("X-TE2");

            const session: ClassSession = {
                id: "X-TE2-MATH-2024",
                nama_mapel: "Matematika",
                guru_id: "guru-001",
                tingkat: 10,
                rombel_nama: "X Teknik Elektronika 2",
                daftar_siswa: students // Auto-synced initial data
            };

            await classService.createClassSession(session);
            addLog(`Class created with ${students.length} students.`);
        } catch (e: any) {
            addLog(`Error Class: ${e.message}`);
        }
    };

    const handleAttendance = async () => {
        try {
            addLog("Recording Absence for Budi (Sakit)...");
            const absences: AttendanceRecord[] = [
                { nisn: "12345", status: "S", keterangan: "Demam" }
            ];

            const today = new Date();
            const year = today.getFullYear().toString();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // 01-12
            const date = String(today.getDate()).padStart(2, '0'); // 01-31

            await attendanceService.recordAttendance("X-TE2-MATH-2024", year, month, date, absences);
            addLog(`Attendance recorded for ${year}-${month}-${date}.`);
        } catch (e: any) {
            addLog(`Error Attendance: ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Database Verification</h1>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Master Data (Admin)</h2>
                <button
                    onClick={handleCreateMasterData}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Generate Student & Rombel
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Classes (System/Admin)</h2>
                <button
                    onClick={handleCreateClass}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                    Create Class Session (Sync from Rombel)
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. Attendance (Guru)</h2>
                <button
                    onClick={handleAttendance}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Record Absence (Sakit)
                </button>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded min-h-[200px] font-mono text-sm">
                <h3 className="font-bold mb-2">Logs:</h3>
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>
        </div>
    );
}
