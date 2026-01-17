"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    User
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "@/types";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Sync user to Firestore
                const userRef = doc(db, "users", firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    // Create new user profile
                    const newProfile: UserProfile = {
                        uid: firebaseUser.uid,
                        nama: firebaseUser.displayName || "User",
                        email: firebaseUser.email || "",
                        role: "guru", // Default role, maybe change later
                        createdAt: new Date(), // Local object, will need to be careful with Firestore types vs JS Date
                        // We usually let Firestore serverTimestamp handle this, but for local state we use Date
                    };

                    // For Firestore write using serverTimestamp
                    await setDoc(userRef, {
                        ...newProfile,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });

                    setUserProfile(newProfile);
                } else {
                    setUserProfile(userSnap.data() as UserProfile);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
