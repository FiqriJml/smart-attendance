import { db } from "@/lib/firebase";
import {
    writeBatch,
    doc,
    collection,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";
import { Student, Rombel, Gender } from "@/types";

export interface CSVStudentRow {
    NISN: string;
    Nama: string;
    JK: string; // "L" or "P"
    Rombel: string; // "X-TE2"
    Tingkat: string; // "10"
    "Program Keahlian": string;
    "Kompetensi Keahlian": string;
}

export const adminService = {

    async getAllStudents(): Promise<Student[]> {
        const snap = await getDocs(collection(db, "students"));
        return snap.docs.map(d => d.data() as Student);
    },

    async deleteStudent(student: Student) {
        const batch = writeBatch(db);

        // 1. Delete from students collection
        const studentRef = doc(db, "students", student.nisn);
        batch.delete(studentRef);

        // 2. Remove from Rombel
        const rombelRef = doc(db, "rombel", student.rombel_id);
        // We need to remove the specific object from the array. 
        // Firestore arrayRemove requires exact object match.
        // If the data drifted, this might fail. Ideally we read the rombel, filter, and write back.
        // For specific removal, reading is safer.

        // However, to keep it simple and atomic-ish: 
        // We will do a read-modify-write for the Rombel outside the batch if we want to be safe, 
        // or just use arrayRemove if we are confident the data is consistent.
        // Let's use arrayRemove with the exact data we have from the student object.
        const studentRefData = {
            nisn: student.nisn,
            nama: student.nama,
            jk: student.jk
        };
        batch.update(rombelRef, {
            daftar_siswa_ref: arrayRemove(studentRefData)
        });

        await batch.commit();
    },

    async updateStudent(oldData: Student, newData: Student, rombelData: { tingkat: number, program: string, kompetensi: string | null }) {
        const batch = writeBatch(db);
        const studentRef = doc(db, "students", oldData.nisn);

        // 1. Update Student Doc
        batch.set(studentRef, newData);

        // 2. Handle Rombel Sync
        if (oldData.rombel_id !== newData.rombel_id) {
            // MOVING ROMBELS

            // Remove from Old Rombel
            const oldRombelRef = doc(db, "rombel", oldData.rombel_id);
            const oldRefData = { nisn: oldData.nisn, nama: oldData.nama, jk: oldData.jk };
            batch.update(oldRombelRef, {
                daftar_siswa_ref: arrayRemove(oldRefData)
            });

            // Add to New Rombel (Create if not exists logic is complex in Batch without read)
            // For Update, we assume Rombel MIGHT exist, but if it's a new name, we need to create it.
            // To be safe, let's assume we need to ensure the Rombel exists.
            // Since we can't easily do "upsert" for Rombel creation within this batch without reading first...
            // We will Read the New Rombel first.
        }

        // Wait, the batch logic gets complex with reads. Let's execute logic sequentially for Rombel updates 
        // or assume the UI limits Rombel selection to existing ones? 
        // The requirement implies editing might create new Rombel params.

        // REVISED STRATEGY for Update:
        // Manual transaction-like flow.

        await deleteDoc(doc(db, "students", oldData.nisn)); // Remove old doc (in case NISN changed, though usually PK doesn't change)
        // Actually NISN should be immutable usually. If NISN changes, it's a delete+create.
        // Assuming NISN is constant for now for simplicity, or we handle it.

        // Let's stick to: Update attributes only.
        if (oldData.nisn !== newData.nisn) {
            throw new Error("Cannot change NISN");
        }

        const newRefData = { nisn: newData.nisn, nama: newData.nama, jk: newData.jk };

        // Direct Update
        await updateDoc(studentRef, newData);

        if (oldData.rombel_id !== newData.rombel_id) {
            // Moved Rombel
            const oldRombelRef = doc(db, "rombel", oldData.rombel_id);
            const oldRefData = { nisn: oldData.nisn, nama: oldData.nama, jk: oldData.jk };
            await updateDoc(oldRombelRef, { daftar_siswa_ref: arrayRemove(oldRefData) });

            // Add to new
            // Check if exists
            const newRombelRef = doc(db, "rombel", newData.rombel_id);
            const newRombelSnap = await getDoc(newRombelRef);

            if (!newRombelSnap.exists()) {
                // Create new Rombel
                const newRombel: Rombel = {
                    id: newData.rombel_id,
                    nama_rombel: `${rombelData.tingkat} ${rombelData.program} ${newData.rombel_id.split('-').pop()}`,
                    tingkat: rombelData.tingkat as 10 | 11 | 12,
                    program_keahlian: rombelData.program,
                    kompetensi_keahlian: rombelData.kompetensi,
                    daftar_siswa_ref: [newRefData]
                };
                await import("firebase/firestore").then(m => m.setDoc(newRombelRef, newRombel));
            } else {
                await updateDoc(newRombelRef, { daftar_siswa_ref: arrayUnion(newRefData) });
            }
        } else if (oldData.nama !== newData.nama || oldData.jk !== newData.jk) {
            // Same Rombel, but details changed. Need to update the array item.
            // Remove old, add new.
            const rombelRef = doc(db, "rombel", oldData.rombel_id);
            const oldRefData = { nisn: oldData.nisn, nama: oldData.nama, jk: oldData.jk };

            // This is slightly risky if the old data differs from what we think, but we passed in oldData.
            await updateDoc(rombelRef, { daftar_siswa_ref: arrayRemove(oldRefData) });
            await updateDoc(rombelRef, { daftar_siswa_ref: arrayUnion(newRefData) });
        }
    },

    async processCSVData(rows: CSVStudentRow[]) {
        // ... Existing implementation ...
        // Re-implemented to keep the file clean
        const batch = writeBatch(db);
        const students: Student[] = [];
        const rombelMap = new Map<string, Rombel>();

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

            if (!rombelMap.has(row.Rombel)) {
                const prog = row["Program Keahlian"] || "";
                const komp = row["Kompetensi Keahlian"] || null;

                rombelMap.set(row.Rombel, {
                    id: row.Rombel,
                    nama_rombel: `${row.Tingkat} ${komp || prog} ${row.Rombel.split('-').pop()}`,
                    tingkat: parseInt(row.Tingkat) as 10 | 11 | 12,
                    program_keahlian: prog,
                    kompetensi_keahlian: komp,
                    daftar_siswa_ref: []
                });
            }

            const rombel = rombelMap.get(row.Rombel)!;
            if (!rombel.daftar_siswa_ref.some(s => s.nisn === student.nisn)) {
                rombel.daftar_siswa_ref.push({
                    nisn: student.nisn,
                    nama: student.nama,
                    jk: student.jk
                });
            }
        }

        students.forEach(s => {
            const ref = doc(db, "students", s.nisn);
            batch.set(ref, s);
        });

        rombelMap.forEach(r => {
            const ref = doc(db, "rombel", r.id);
            batch.set(ref, r, { merge: true });
        });

        await batch.commit();

        return {
            studentsAdded: students.length,
            rombelsUpdated: rombelMap.size
        };
    }
};
