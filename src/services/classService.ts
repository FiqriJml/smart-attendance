import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    updateDoc
} from "firebase/firestore";
import { ClassSession, Student } from "@/types";

export const classService = {
    async createClassSession(data: ClassSession) {
        const ref = doc(db, "classes", data.id);
        await setDoc(ref, data);
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
        // "Push" logic: updates the operational class roster from master data
        const ref = doc(db, "classes", classId);
        await updateDoc(ref, {
            daftar_siswa: students
        });
    }
};
