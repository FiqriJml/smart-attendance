/**
 * Custom hook for attendance management
 * @module features/attendance/hooks/useAttendance
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClassSession, AttendanceStatus, AttendanceRecord, AttendanceMonthly } from "@/types";
import { attendanceService } from "@/services/attendanceService";
import { classService } from "@/services/classService";
import { masterDataService } from "@/services/masterDataService";
import { getTodayDate } from "@/lib/utils";

interface UseAttendanceReturn {
    /** Class data including student list */
    classData: ClassSession | null;
    /** Attendance map: NISN -> Status */
    attendanceMap: Record<string, AttendanceStatus | 'H'>;
    /** Update a student's attendance status */
    setStatus: (nisn: string, status: AttendanceStatus | 'H') => void;
    /** Selected date for attendance */
    selectedDate: string;
    /** Set selected date */
    setSelectedDate: (date: string) => void;
    /** Loading state */
    isLoading: boolean;
    /** Save attendance records */
    saveAttendance: () => Promise<void>;
    /** Whether save is in progress */
    isSaving: boolean;
    /** Sync students from rombel */
    syncStudents: () => Promise<void>;
    /** Whether sync is in progress */
    isSyncing: boolean;
    /** Attendance statistics */
    stats: { H: number; S: number; I: number; A: number };
}

export function useAttendance(classId: string): UseAttendanceReturn {
    const [classData, setClassData] = useState<ClassSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus | 'H'>>({});

    // Fetch class data and existing attendance
    useEffect(() => {
        if (!classId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const ref = doc(db, "classes", classId);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    const data = snap.data() as ClassSession;
                    setClassData(data);

                    // Initialize all as 'H' (Hadir)
                    const initialMap: Record<string, AttendanceStatus | 'H'> = {};
                    (data.daftar_siswa || []).forEach(s => {
                        initialMap[s.nisn] = 'H';
                    });

                    // Fetch existing attendance for selected date
                    const [year, month, day] = selectedDate.split('-');
                    const existing = await attendanceService.getMonthlyReport(classId, year, month);

                    if (existing?.history?.[day]) {
                        existing.history[day].forEach(record => {
                            initialMap[record.nisn] = record.status;
                        });
                    }

                    setAttendanceMap(initialMap);
                }
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [classId, selectedDate]);

    // Set individual student status
    const setStatus = useCallback((nisn: string, status: AttendanceStatus | 'H') => {
        setAttendanceMap(prev => ({
            ...prev,
            [nisn]: status
        }));
    }, []);

    // Calculate stats
    const stats = useMemo(() => {
        const result = { H: 0, S: 0, I: 0, A: 0 };
        Object.values(attendanceMap).forEach(s => {
            if (s in result) result[s as keyof typeof result]++;
        });
        return result;
    }, [attendanceMap]);

    // Save attendance
    const saveAttendance = useCallback(async () => {
        if (!classData) return;

        setIsSaving(true);
        try {
            const [year, month, day] = selectedDate.split('-');

            // Only save absences (S, I, A)
            const absences: AttendanceRecord[] = [];
            Object.entries(attendanceMap).forEach(([nisn, status]) => {
                if (status !== 'H') {
                    absences.push({
                        nisn,
                        status: status as AttendanceStatus
                    });
                }
            });

            await attendanceService.recordAttendance(classId, year, month, day, absences);
        } finally {
            setIsSaving(false);
        }
    }, [classData, classId, selectedDate, attendanceMap]);

    // Sync students from rombel
    const syncStudents = useCallback(async () => {
        if (!classData) return;

        setIsSyncing(true);
        try {
            const students = await masterDataService.getStudentsByRombel(classData.rombel_id);
            await classService.syncClassStudents(classId, students);

            // Update local state
            setClassData(prev => prev ? { ...prev, daftar_siswa: students } : prev);

            // Update attendance map
            const newMap: Record<string, AttendanceStatus | 'H'> = {};
            students.forEach(s => {
                newMap[s.nisn] = attendanceMap[s.nisn] || 'H';
            });
            setAttendanceMap(newMap);
        } finally {
            setIsSyncing(false);
        }
    }, [classData, classId, attendanceMap]);

    return {
        classData,
        attendanceMap,
        setStatus,
        selectedDate,
        setSelectedDate,
        isLoading,
        saveAttendance,
        isSaving,
        syncStudents,
        isSyncing,
        stats
    };
}
