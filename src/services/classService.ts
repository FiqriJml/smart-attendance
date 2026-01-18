import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    getDoc,
    query,
    where,
    updateDoc
} from "firebase/firestore";
import { ClassSession, Student } from "@/types";

export const classService = {
    async createClassSession(
        guruId: string,
        mapel: string,
        rombelId: string
    ) {
        // 1. Fetch Rombel to get Student List
        const rombelRef = doc(db, "rombel", rombelId);
        const rombelSnap = await getDoc(rombelRef);

        if (!rombelSnap.exists()) {
            throw new Error("Rombel tidak ditemukan");
        }

        const rombelData = rombelSnap.data();
        const students = rombelData.daftar_siswa_ref || [];

        // 2. Create Class ID
        // Format: [guru_id]_[rombel]_[mapel]_[timestamp] to be unique
        const classId = `${mapel.replace(/\s+/g, '-')}_${rombelId}_${Date.now()}`;

        const newClass: ClassSession = {
            id: classId,
            guru_id: guruId,
            mata_pelajaran: mapel,
            rombel_id: rombelId,
            daftar_siswa: students as Student[],
            active: true
        };

        const ref = doc(db, "classes", classId);
        await setDoc(ref, newClass);

        return newClass;
    },

    async getClassesByTeacher(guruId: string): Promise<ClassSession[]> {
        const q = query(
            collection(db, "classes"),
            where("guru_id", "==", guruId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as ClassSession);
    },

    async syncClassStudents(classId: string, students: Student[]) {
        const ref = doc(db, "classes", classId);
        await updateDoc(ref, {
            daftar_siswa: students
        });
    }
};
