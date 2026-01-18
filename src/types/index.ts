export type UserRole = 'admin' | 'guru';

export interface UserProfile {
    uid: string;
    nama: string;
    email: string;
    role: UserRole;
    program_keahlian?: string;
    is_kaprog?: boolean;
    createdAt?: Date; // Local helper
    updatedAt?: Date; // Local helper
}

export type Gender = 'L' | 'P';

export interface Student {
    nisn: string; // Primary Key
    nama: string;
    jk: Gender;
    rombel_id: string; // e.g. "X-TE2"
    tanggal_masuk: string; // YYYY-MM-DD
}

export interface Rombel {
    id: string; // KODE_ROMBEL e.g. "X-TE2"
    nama_rombel: string;
    tingkat: 10 | 11 | 12;
    program_keahlian: string;
    kompetensi_keahlian: string | null; // Null for grade 10
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

export type AttendanceStatus = 'S' | 'I' | 'A';

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
