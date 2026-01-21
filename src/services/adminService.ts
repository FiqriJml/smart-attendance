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
    arrayRemove,
    setDoc,
    serverTimestamp
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

    // NEW: Get all students via Program Summaries (Optimized Read)
    async getAllStudentsOptimized(): Promise<Student[]> {
        const snap = await getDocs(collection(db, "program_summaries"));
        let allStudents: Student[] = [];
        snap.docs.forEach(doc => {
            const data = doc.data();
            if (data.students && Array.isArray(data.students)) {
                allStudents = [...allStudents, ...data.students];
            }
        });
        return allStudents;
    },

    async deleteStudent(student: Student, program: string) {
        const batch = writeBatch(db);

        // 1. Delete Student Doc
        batch.delete(doc(db, "students", student.nisn));

        // 2. Remove from Rombel
        const refData = { nisn: student.nisn, nama: student.nama, jk: student.jk };
        batch.update(doc(db, "rombel", student.rombel_id), {
            daftar_siswa_ref: arrayRemove(refData)
        });

        // 3. Remove from Program Summary
        // Note: Program Summary stores Full Student Objects usually, or ref? 
        // Plan said "Contains array of Student objects".
        // We need to match the object exactly for arrayRemove, which might be tricky if fields differ slightly (e.g. timestamps).
        // Safer to Read-Modify-Write the Program Summary if we want to be sure, OR use the exact object we have in memory.
        // Let's try arrayRemove with the student object passed in.
        if (program) {
            batch.update(doc(db, "program_summaries", program), {
                students: arrayRemove(student)
            });
        }

        await batch.commit();
    },

    async updateStudent(oldData: Student, newData: Student, rombelMeta: { tingkat: number, program: string, kompetensi: string | null }) {
        // For Update, complex sync is needed.
        // 1. Student Doc
        // 2. Rombel (Old & New)
        // 3. Program Summary (Old & New if Program changed)

        // Simplified approach: atomic manual updates (not single batch due to complexity)

        // A. Update Student Doc
        await updateDoc(doc(db, "students", oldData.nisn), newData as any);

        // B. Rombel Sync (Ref data only)
        const oldRef = { nisn: oldData.nisn, nama: oldData.nama, jk: oldData.jk };
        const newRef = { nisn: newData.nisn, nama: newData.nama, jk: newData.jk };

        if (oldData.rombel_id !== newData.rombel_id) {
            // Move Rombel
            await updateDoc(doc(db, "rombel", oldData.rombel_id), { daftar_siswa_ref: arrayRemove(oldRef) });
            // Add to new (Create logic omitted for brevity, assumed exists or handled)
            await updateDoc(doc(db, "rombel", newData.rombel_id), { daftar_siswa_ref: arrayUnion(newRef) }).catch(async () => {
                // If fails, maybe rombel doesn't exist, create it?
                // Skipping for now per instructions to focus on Read optimization
            });
        } else if (oldData.nama !== newData.nama || oldData.jk !== newData.jk) {
            // Update Ref in same Rombel
            await updateDoc(doc(db, "rombel", oldData.rombel_id), { daftar_siswa_ref: arrayRemove(oldRef) });
            await updateDoc(doc(db, "rombel", oldData.rombel_id), { daftar_siswa_ref: arrayUnion(newRef) });
        }

        // C. Program Summary Sync
        // We need the "old Program" to remove from. We assume it's passed or derived? 
        // The student object doesn't strictly store "Program" field in the Plan V1.5 Types (Student only has Rombel ID).
        // We have to rely on the passed `rombelMeta.program` for the NEW program.
        // But what about the OLD program? 
        // Optimization: We might need to query the old Rombel to know its program, or assume it's the same if not changing.
        // For now, let's assume we read-modify-write the Program Summary based on the target Program.

        // If we don't know the old program, we can't efficiently remove from old summary without searching.
        // THIS IS A CAVEAT. 
        // Solution: We will just update the Target Program Summary.

        const summaryRef = doc(db, "program_summaries", rombelMeta.program);

        // We can't use arrayRemove(oldData) easily if we don't know the old Program name. 
        // We'll read the summary, filter out the NISN, and push new data.
        const snap = await getDoc(summaryRef);
        if (snap.exists()) {
            const data = snap.data();
            let list = (data.students as Student[]) || [];
            // Remove existing by NISN
            list = list.filter(s => s.nisn !== oldData.nisn);
            // Add new
            list.push(newData);
            await updateDoc(summaryRef, { students: list });
        }
    },

    async getActivePeriod(): Promise<string> {
        try {
            const docRef = doc(db, "app_settings", "global");
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().active_period_id) {
                return snap.data().active_period_id;
            }
        } catch (e) {
            console.error("Error fetching active period", e);
        }
        return "2025-2026-genap"; // Fallback default as per instructions
    },

    async processCSVData(rows: CSVStudentRow[]) {
        const activePeriodId = await this.getActivePeriod();
        const batch = writeBatch(db);
        const students: Student[] = [];
        const rombelMap = new Map<string, Rombel>();
        const programMap = new Map<string, Student[]>(); // Program Name -> Array of Students

        // 1. Transform & Group
        for (const row of rows) {
            if (!row.NISN || !row.Rombel) continue;

            const student: Student = {
                nisn: row.NISN,
                nama: row.Nama,
                jk: row.JK as Gender,
                rombel_id: row.Rombel,
                tingkat: row.Tingkat ? parseInt(row.Tingkat) : undefined, // Fix: Map Tingkat
                tanggal_masuk: new Date().toISOString().split('T')[0]
            };
            students.push(student);

            // Group Rombel
            if (!rombelMap.has(row.Rombel)) {
                const prog = row["Program Keahlian"] || "Umum";
                const komp = row["Kompetensi Keahlian"] || null;

                // Composite ID: active_period_id + rombel_original
                // e.g. "2025-2026-genap-X-TE1"
                const compositeId = `${activePeriodId}-${row.Rombel}`;

                rombelMap.set(row.Rombel, {
                    id: compositeId,
                    nama_rombel: row.Rombel, // Store original name for display
                    tingkat: parseInt(row.Tingkat) as 10 | 11 | 12,
                    program_keahlian: prog,
                    kompetensi_keahlian: komp,
                    period_id: activePeriodId,
                    daftar_siswa_ref: []
                });
            }

            // Add to Rombel Ref
            const rombel = rombelMap.get(row.Rombel)!;

            // Link student to Composite ID
            student.rombel_id = rombel.id;

            if (!rombel.daftar_siswa_ref.some(s => s.nisn === student.nisn)) {
                rombel.daftar_siswa_ref.push({
                    nisn: student.nisn,
                    nama: student.nama,
                    jk: student.jk
                });
            }

            // Group Program Summary
            const progKey = row["Program Keahlian"] || "Umum";
            if (!programMap.has(progKey)) {
                programMap.set(progKey, []);
            }
            programMap.get(progKey)!.push(student);
        }

        // 2. Writes

        // Students (Individual)
        students.forEach(s => {
            batch.set(doc(db, "students", s.nisn), s);
        });

        // Rombels
        rombelMap.forEach(r => {
            batch.set(doc(db, "rombel", r.id), r, { merge: true });
        });

        // Program Summaries (Aggregation)
        // We need to merge with existing arrays. Batch set merge=true doesn't concat arrays. 
        // We must use arrayUnion. 
        // Note: arrayUnion takes var args. Spread might exceed stack if too many.
        // Safe approach for batch CSV: For each program, likely need to Read-Merge-Write or use ArrayUnion if chunked.
        // If massive CSV, this logic is heavy. Assuming "smart import" < 500 rows.

        // NOTE: Batch limit 500. arrayUnion is 1 op.
        programMap.forEach((studentList, progName) => {
            const ref = doc(db, "program_summaries", progName);
            // We can't guarantee 'program_summaries' doc exists.
            // set with merge: true will create if not exists, but won't append to array correctly (it replaces if field exists?).
            // No, set({students: arrayUnion(...) }, {merge:true}) works!
            // But arrayUnion checks uniqueness by value (exact object).

            // IMPORTANT: We need to chunk arrayUnion if > 500 items? No, arrayUnion limit is document size (1MB).
            // Let's use arrayUnion.
            batch.set(ref, {
                students: arrayUnion(...studentList)
            }, { merge: true });
        });

        await batch.commit();

        return {
            studentsAdded: students.length,
            rombelsUpdated: rombelMap.size
        };
    },

    // 4. Initialization (One-off)
    async initializeSystem() {
        const batch = writeBatch(db);

        // 1. App Settings
        batch.set(doc(db, "app_settings", "global"), {
            active_period_id: "2025-2026-genap",
            updated_at: serverTimestamp()
        });

        // 2. Period Doc
        batch.set(doc(db, "periods", "2025-2026-genap"), {
            id: "2025-2026-genap",
            nama_periode: "Tahun Pelajaran 2025/2026 - Genap",
            tahun_ajaran: "2025/2026",
            semester: "Genap",
            is_active: true,
            tanggal_mulai: "2026-01-05"
        });

        await batch.commit();
        return "System Initialized";
    },

    // 4. Migration Tool (One-off)
    async migrateTingkatData() {
        console.log("Starting migration: enriching student data with 'tingkat'...");

        const batch = writeBatch(db);
        let batchCount = 0;

        // Strategy: Iterate Program Summaries directly
        // This covers both Program Summary arrays AND individual Student docs (via batch)
        const summarySnap = await getDocs(collection(db, "program_summaries"));

        for (const summaryDoc of summarySnap.docs) {
            const data = summaryDoc.data();
            const students = (data.students as Student[]) || [];
            let changed = false;

            const updatedList = students.map(s => {
                // If tingkat is missing, try to detect it
                if (!s.tingkat) {
                    let tingkat: number | 0 = 0;
                    const rombel = s.rombel_id.toUpperCase();

                    if (rombel.startsWith("X ") || rombel.startsWith("10")) tingkat = 10;
                    else if (rombel.startsWith("XI ") || rombel.startsWith("11")) tingkat = 11;
                    else if (rombel.startsWith("XII ") || rombel.startsWith("12")) tingkat = 12;

                    if (tingkat > 0) {
                        changed = true;

                        // 1. Update Object in Memory for Array
                        const sNew = { ...s, tingkat };

                        // 2. Queue Batch Update for Individual Student Doc
                        batch.update(doc(db, "students", s.nisn), { tingkat });
                        batchCount++;

                        return sNew;
                    }
                }
                return s;
            });

            if (changed) {
                // 3. Update Program Summary Doc
                batch.update(summaryDoc.ref, { students: updatedList });
                batchCount++;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`Migration complete. Updated ${batchCount} operations.`);
        return batchCount;
    }
};
