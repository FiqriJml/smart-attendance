import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc
} from "firebase/firestore";
import { Student, Rombel } from "@/types";

export const masterDataService = {
    // --- Students ---
    async createStudent(data: Student) {
        const ref = doc(db, "students", data.nisn);
        await setDoc(ref, data);
    },

    async getStudent(nisn: string): Promise<Student | null> {
        const ref = doc(db, "students", nisn);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as Student) : null;
    },

    async getStudentsByRombel(rombelId: string): Promise<Student[]> {
        const q = query(
            collection(db, "students"),
            where("rombel_id", "==", rombelId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Student);
    },

    // --- Rombel ---
    async createRombel(data: Rombel) {
        const ref = doc(db, "rombel", data.id);
        await setDoc(ref, data);
    },

    async updateRombelReference(rombelId: string, students: Student[]) {
        // Updates the lightweight reference list in Rombel
        const ref = doc(db, "rombel", rombelId);
        const studentRefs = students.map(s => ({
            nisn: s.nisn,
            nama: s.nama,
            jk: s.jk
        }));
        await updateDoc(ref, { daftar_siswa_ref: studentRefs });

        // TODO: Trigger sync to 'classes' collection here or via Cloud Function
    }
};
