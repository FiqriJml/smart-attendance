"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Smart Attendance</h1>
                    <p className="text-gray-500 mt-2">Presensi Digital SMK</p>
                </div>

                <div className="py-8">
                    {/* Logo placeholder or illustration could go here */}
                    <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                        <span className="text-3xl">🏫</span>
                    </div>
                </div>

                <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all shadow-sm"
                >
                    <FcGoogle className="text-2xl" />
                    <span>Masuk dengan Google</span>
                </button>

                <p className="text-xs text-gray-400">
                    Gunakan akun belajar.id atau Gmail Anda.
                </p>
            </div>
        </div>
    );
}
