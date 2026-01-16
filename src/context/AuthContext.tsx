"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    await handleUserSync(firebaseUser);
                } catch (error) {
                    console.error("Error syncing user:", error);
                    // Optionally handle error state
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUserSync = async (firebaseUser: User) => {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // Existing user: Load profile
            const data = userSnap.data();
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: data.nama || firebaseUser.displayName || "",
                photoURL: firebaseUser.photoURL || undefined,
                role: data.role as "admin" | "guru",
                program_keahlian: data.program_keahlian,
                is_kaprog: data.is_kaprog,
            });
        } else {
            // New user: Auto-register as 'guru' (default)
            const newUser: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || "User",
                photoURL: firebaseUser.photoURL || undefined,
                role: "guru",
                createdAt: new Date(),
            };

            await setDoc(userRef, {
                nama: newUser.displayName,
                email: newUser.email,
                role: newUser.role,
                createdAt: serverTimestamp(),
            });

            setUser(newUser);
        }
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle the rest
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
