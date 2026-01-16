"use client";

import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
    const { loginWithGoogle } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Smart Attendance
                    </h1>
                    <p className="text-gray-500">
                        Aplikasi Presensi Digital SMK
                    </p>
                </div>

                <div className="flex justify-center">
                    {/* Placeholder for Logo if needed */}
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl">
                        🎓
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-gray-700 font-semibold group"
                    >
                        <FcGoogle className="text-2xl" />
                        <span>Masuk dengan Google</span>
                    </button>

                    <p className="text-xs text-gray-400 mt-4">
                        Gunakan akun <b>belajar.id</b> atau akun sekolah Anda.
                    </p>
                </div>
            </div>
        </div>
    );
}
