"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FiBook } from "react-icons/fi";
import { Button } from "@/components/ui";

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
                    <span className="text-sm text-slate-500">Memuat...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

            <div className="relative max-w-md w-full">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 mb-2">
                            <FiBook className="text-white" size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Smart Attendance</h1>
                        <p className="text-slate-500">Sistem Presensi Digital SMK</p>
                    </div>

                    {/* Illustration */}
                    <div className="flex justify-center py-4">
                        <div className="relative">
                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center">
                                <span className="text-6xl">🏫</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">✓</span>
                            </div>
                        </div>
                    </div>

                    {/* Login Button */}
                    <div className="space-y-4">
                        <button
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                        >
                            <FcGoogle className="text-2xl" />
                            <span>Masuk dengan Google</span>
                        </button>

                        <p className="text-center text-xs text-slate-400">
                            Gunakan akun <span className="font-medium">belajar.id</span> atau Gmail Anda
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    © 2026 Smart Attendance PWA • v1.0
                </p>
            </div>
        </div>
    );
}
