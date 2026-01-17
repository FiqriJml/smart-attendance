import { db } from "@/lib/firebase";
import {
    writeBatch,
    doc,
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import { Student, Rombel, Gender } from "@/types";

export interface CSVStudentRow {
    NISN: string;
    Nama: string;
    JK: string; // "L" or "P"
    Rombel: string; // "X-TE2"
    Tingkat: string; // "10"
    "Program Keahlian": string; // "Teknik Elektronika"
    "Kompetensi Keahlian": string; // "Teknik Audio Video" (bisa kosong untuk kelas 10)
}

export const adminService = {

    async processCSVData(rows: CSVStudentRow[]) {
        // We need to use batches (max 500 ops per batch).
        // We will update:
        // 1. users/students collection (1 write per student)
        // 2. rombel collection (1 write per rombel grouping)

        const batch = writeBatch(db);
        const students: Student[] = [];
        const rombelMap = new Map<string, Rombel>();

        // 1. Transform Rows into Objects
        for (const row of rows) {
            if (!row.NISN || !row.Rombel) continue;

            const student: Student = {
                nisn: row.NISN,
                nama: row.Nama,
                jk: row.JK as Gender,
                rombel_id: row.Rombel,
                tanggal_masuk: new Date().toISOString().split('T')[0]
            };
            students.push(student);

            // Group for Rombel
            if (!rombelMap.has(row.Rombel)) {
                // Use the raw keys from CSV (Papaparse preserves spaces if configured or we use quoted keys)
                // Accessing properties with spaces needs bracket notation or cleaner mapping
                const prog = row["Program Keahlian"] || "";
                const komp = row["Kompetensi Keahlian"] || null;

                rombelMap.set(row.Rombel, {
                    id: row.Rombel,
                    nama_rombel: `${row.Tingkat} ${komp || prog} ${row.Rombel.split('-').pop()}`, // Approximate naming
                    tingkat: parseInt(row.Tingkat) as 10 | 11 | 12,
                    program_keahlian: prog,
                    kompetensi_keahlian: komp,
                    daftar_siswa_ref: []
                });
            }

            const rombel = rombelMap.get(row.Rombel)!;
            // Avoid duplicates in local array
            if (!rombel.daftar_siswa_ref.some(s => s.nisn === student.nisn)) {
                rombel.daftar_siswa_ref.push({
                    nisn: student.nisn,
                    nama: student.nama,
                    jk: student.jk
                });
            }
        }

        // 2. Queue Student Writes
        students.forEach(s => {
            const ref = doc(db, "students", s.nisn);
            batch.set(ref, s);
        });

        // 3. Queue Rombel Writes
        rombelMap.forEach(r => {
            const ref = doc(db, "rombel", r.id);
            batch.set(ref, r, { merge: true }); // Merge to avoid losing other fields if exists
        });

        // 4. Commit
        await batch.commit();

        return {
            studentsAdded: students.length,
            rombelsUpdated: rombelMap.size
        };
    }
};
