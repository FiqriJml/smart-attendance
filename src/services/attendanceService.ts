import { db } from "@/lib/firebase";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { AttendanceRecord, AttendanceMonthly, DailyAttendanceSemester, DailyAttendanceEntry } from "@/types";

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
    },

    // ==========================================
    // BK SEMESTER-BASED ATTENDANCE WITH AUDIT TRAIL
    // ==========================================

    getSemesterDocId(rombelId: string, semesterId: string) {
        return `${rombelId}_${semesterId}`;
    },

    async recordDailyAttendance(
        rombelId: string,
        semesterId: string,
        date: string, // "2024-03-01" full ISO date
        records: AttendanceRecord[],
        userEmail: string // For audit trail
    ) {
        const docId = this.getSemesterDocId(rombelId, semesterId);
        const ref = doc(db, "daily_attendance_semester", docId);

        const entry: DailyAttendanceEntry = {
            records,
            updated_by: userEmail,
            updated_at: serverTimestamp()
        };

        const snap = await getDoc(ref);

        if (!snap.exists()) {
            // Create new semester doc
            const newDoc: DailyAttendanceSemester = {
                rombel_id: rombelId,
                semester_id: semesterId,
                history: {
                    [date]: entry
                }
            };
            await setDoc(ref, newDoc);
        } else {
            // Update using dot notation (preserves other dates)
            await updateDoc(ref, {
                [`history.${date}`]: entry
            });
        }
    },

    async getSemesterAttendance(rombelId: string, semesterId: string): Promise<DailyAttendanceSemester | null> {
        const docId = this.getSemesterDocId(rombelId, semesterId);
        const ref = doc(db, "daily_attendance_semester", docId);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as DailyAttendanceSemester) : null;
    },

    async getDailyAttendance(rombelId: string, semesterId: string, date: string): Promise<DailyAttendanceEntry | null> {
        const semester = await this.getSemesterAttendance(rombelId, semesterId);
        if (!semester || !semester.history[date]) return null;
        return semester.history[date];
    }
};

