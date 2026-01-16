export type UserRole = 'admin' | 'guru';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    program_keahlian?: string; // e.g., "Mekatronika", "Elektronika"
    is_kaprog?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
