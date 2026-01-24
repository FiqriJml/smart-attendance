export type UserRole = 'admin' | 'bk' | 'wali_kelas' | 'guru';

export interface UserProfile {
    // Document ID = email
    email: string;
    nama: string;
    role: UserRole;
    is_active: boolean; // Security Gate

    // BK Specific
    nama_wilayah?: string;
    assigned_rombel_ids?: string[];

    // Wali Kelas Specific
    wali_rombel_id?: string;

    // Optional Metadata
    uid?: string; // Linked Google UID (set on login)
    program_keahlian?: string;
    is_kaprog?: boolean;
    assigned_program_id?: string; // For Admin/Kaprog: Slug of the Program Keahlian
    createdAt?: Date;
    updatedAt?: Date;
}

export type Gender = 'L' | 'P';

export interface Student {
    nisn: string; // Primary Key
    nama: string;
    jk: Gender;
    rombel_id: string; // e.g. "X-TE2" (or composite "2025-2026-genap-X-TE2")
    nama_rombel?: string; // Display Name e.g. "X TE2"
    program_keahlian?: string; // Injected at runtime or stored
    tingkat?: number; // 10, 11, 12
    tanggal_masuk: string; // YYYY-MM-DD
}

export interface Rombel {
    id: string; // KODE_ROMBEL e.g. "X-TE2"
    nama_rombel: string;
    tingkat: 10 | 11 | 12;
    program_keahlian: string;
    kompetensi_keahlian: string | null; // Null for grade 10
    period_id?: string; // e.g. "2025-2026-genap"
    daftar_siswa_ref: Array<{ nisn: string; nama: string; jk: Gender }>;
}

export interface ClassSession {
    id: string;
    guru_id: string;
    mata_pelajaran: string;
    rombel_id: string;
    daftar_siswa: Student[];
    active: boolean;
}

export type AttendanceStatus = 'S' | 'I' | 'A' | 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat';

export interface AttendanceRecord {
    nisn: string;
    status: AttendanceStatus;
    keterangan?: string;
}

export interface AttendanceMonthly {
    class_id: string;
    bulan: string; // "01", "02", etc.
    tahun: string; // "2024"
    history: Record<string, AttendanceRecord[]>; // Key: "01", "02" (date) -> List of absentee
}

// BK Semester-Based Attendance with Audit Trail
export interface DailyAttendanceEntry {
    records: AttendanceRecord[];
    updated_by: string; // Email of user who filled
    updated_at: any; // serverTimestamp
}

export interface DailyAttendanceSemester {
    rombel_id: string;
    semester_id: string; // e.g. "2024-2025-genap"
    history: Record<string, DailyAttendanceEntry>; // Key: "2024-03-01" -> Entry
}
