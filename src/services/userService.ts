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
    orderBy
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

    async createUser(userData: UserProfile): Promise<void> {
        try {
            // Strict Whitelist: ID is Email
            await setDoc(doc(db, "users", userData.email), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    async updateUser(email: string, data: Partial<UserProfile>): Promise<void> {
        try {
            await updateDoc(doc(db, "users", email), {
                ...data,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    async toggleUserStatus(email: string, isActive: boolean): Promise<void> {
        return this.updateUser(email, { is_active: isActive });
    },

    // === HELPER OPERATIONS ===

    async getAllRombels(): Promise<Rombel[]> {
        try {
            const snapshot = await getDocs(collection(db, "rombel"));
            const rombels = snapshot.docs.map(doc => {
                const data = doc.data();
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
