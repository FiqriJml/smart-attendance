import { db } from "@/lib/firebase";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc
} from "firebase/firestore";
import { AttendanceRecord, AttendanceMonthly } from "@/types";

export const attendanceService = {

    // Helper to generate doc ID: e.g. "X-TE2-MATH-2024_01"
    getDocId(classId: string, year: string, month: string) {
        return `${classId}_${year}_${month}`;
    },

    async recordAttendance(
        classId: string,
        year: string,
        month: string,
        date: string, // "01", "02"
        absences: AttendanceRecord[]
    ) {
        const docId = this.getDocId(classId, year, month);
        const ref = doc(db, "attendance_monthly", docId);

        // Check if doc exists
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            // Create new monthly record
            const newRecord: AttendanceMonthly = {
                class_id: classId,
                bulan: month,
                tahun: year,
                history: {
                    [date]: absences
                }
            };
            await setDoc(ref, newRecord);
        } else {
            // Update existing record
            // Use dot notation to update specific date in the map
            await updateDoc(ref, {
                [`history.${date}`]: absences
            });
        }
    },

    async getMonthlyReport(classId: string, year: string, month: string): Promise<AttendanceMonthly | null> {
        const docId = this.getDocId(classId, year, month);
        const ref = doc(db, "attendance_monthly", docId);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as AttendanceMonthly) : null;
    }
};
