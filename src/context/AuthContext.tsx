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
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, deleteDoc } from "firebase/firestore";
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
                    // Check for pre-registered profile by email (created by Admin)
                    const q = query(collection(db, "users"), where("email", "==", firebaseUser.email));
                    const querySnapshot = await getDocs(q);

                    let newProfile: UserProfile;

                    if (!querySnapshot.empty) {
                        // Found pre-registered profile -> Migrate
                        const preRegDoc = querySnapshot.docs[0];
                        const preRegData = preRegDoc.data() as UserProfile;

                        newProfile = {
                            ...preRegData,
                            uid: firebaseUser.uid,
                            nama: firebaseUser.displayName || preRegData.nama, // Prefer Auth name or Pre-reg name? Auth name usually better.
                            email: firebaseUser.email || "",
                            // Role is preserved from preRegData
                            createdAt: new Date()
                        };

                        // Cleanup old doc
                        await deleteDoc(preRegDoc.ref);
                    } else {
                        // Default new profile
                        newProfile = {
                            uid: firebaseUser.uid,
                            nama: firebaseUser.displayName || "User",
                            email: firebaseUser.email || "",
                            role: "guru",
                            createdAt: new Date()
                        };
                    }

                    // Create UID-based doc
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
