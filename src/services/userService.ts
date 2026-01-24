import { db } from "@/lib/firebase";
import { UserProfile, Rombel, UserRole } from "@/types";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    orderBy,
    addDoc
} from "firebase/firestore";

export const userService = {
    // === USER OPERATIONS ===

    async getAllUsers(): Promise<UserProfile[]> {
        try {
            const q = query(collection(db, "users"), orderBy("nama"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as UserProfile);
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    },

    async createPendingUser(userData: Omit<UserProfile, 'uid'>): Promise<void> {
        try {
            await addDoc(collection(db, "users"), {
                ...userData,
                uid: "pending", // Placeholder
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error creating pending user:", error);
            throw error;
        }
    },

    async createUser(userData: UserProfile): Promise<void> {
        try {
            await setDoc(doc(db, "users", userData.uid), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    async updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
        try {
            await updateDoc(doc(db, "users", uid), {
                ...data,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    async toggleUserStatus(uid: string, isActive: boolean): Promise<void> {
        return this.updateUser(uid, { is_active: isActive });
    },

    // === HELPER OPERATIONS ===

    async getAllRombels(): Promise<Rombel[]> {
        try {
            // We fetch from 'rombel' collection or build distinct list from students/summaries
            // Since we have a 'rombel' collection being built in AdminService (partially), 
            // OR we can fetch unique rombels from students if 'rombel' collection isn't fully maintained.
            // Requirement V1.5 plan says "rombel" collection exists.

            // Assuming 'rombel' collection is authoritative for Rombel List
            const snapshot = await getDocs(collection(db, "rombel"));
            // If empty (legacy), might need fallback. But let's assume valid.
            const rombels = snapshot.docs.map(doc => {
                const data = doc.data();
                // Ensure ID and Nama are present
                return {
                    id: doc.id,
                    nama_rombel: data.nama_rombel || doc.id,
                    ...data
                } as Rombel;
            });
            return rombels.sort((a, b) => a.nama_rombel.localeCompare(b.nama_rombel));
        } catch (error) {
            console.error("Error fetching rombels:", error);
            return [];
        }
    }
};
