"use strict";
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
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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
                const emailKey = firebaseUser.email;

                if (!emailKey) {
                    await signOut(auth);
                    alert("Email tidak valid. Login dibatalkan.");
                    setUserProfile(null);
                    setLoading(false);
                    return;
                }

                // Strict Whitelist Mode: ID Document = Email
                const userRef = doc(db, "users", emailKey);
                try {
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const profile = userSnap.data() as UserProfile;

                        if (profile.is_active) {
                            // Access Granted

                            // Optional: Bind UID for reference if changed/missing
                            if (profile.uid !== firebaseUser.uid) {
                                await updateDoc(userRef, {
                                    uid: firebaseUser.uid,
                                    updatedAt: serverTimestamp()
                                });
                            }

                            setUserProfile({ ...profile, uid: firebaseUser.uid });
                        } else {
                            // Account Inactive
                            await signOut(auth);
                            alert("Akses Ditolak. Akun Anda dinonaktifkan oleh Admin.");
                            setUserProfile(null);
                        }
                    } else {
                        // Not in Whitelist. CHECK LEGACY UID (Migration)
                        const uidRef = doc(db, "users", firebaseUser.uid);
                        const uidSnap = await getDoc(uidRef);

                        if (uidSnap.exists()) {
                            const oldProfile = uidSnap.data() as UserProfile;

                            // Allow migration if active (or check for role admin)
                            // Legacy data might not have is_active, so default to true if undefined
                            if (oldProfile.is_active !== false) {
                                const newProfile: UserProfile = {
                                    ...oldProfile,
                                    email: emailKey, // Force email key
                                    uid: firebaseUser.uid,
                                    is_active: true, // Set explicit active
                                    updatedAt: serverTimestamp() as any
                                };

                                // Migrate
                                await setDoc(userRef, newProfile);
                                await deleteDoc(uidRef);

                                setUserProfile(newProfile);
                                // alert("Akun Anda telah dimigrasi ke sistem baru.");
                                return;
                            }
                        }

                        // Not in Whitelist and No Legacy Account -> REGISTER PENDING (Self-Service)
                        const newPendingProfile: UserProfile = {
                            email: emailKey,
                            nama: firebaseUser.displayName || "User",
                            role: 'guru', // Default role
                            is_active: false, // Pending Admin Approval
                            uid: firebaseUser.uid,
                            createdAt: serverTimestamp() as any,
                            updatedAt: serverTimestamp() as any
                        };

                        try {
                            await setDoc(userRef, newPendingProfile);
                            await signOut(auth);
                            alert("Pendaftaran Berhasil! Akun Anda sedang MENUNGGU KONFIRMASI Admin. Silakan hubungi Admin untuk aktivasi.");
                        } catch (regError) {
                            console.error("Registration Error", regError);
                            await signOut(auth);
                            alert("Gagal mendaftar. Silakan coba lagi.");
                        }

                        setUserProfile(null);
                    }
                } catch (err) {
                    console.error("Auth Error:", err);
                    setUserProfile(null);
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
