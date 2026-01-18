"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiBook, FiCheck, FiSmartphone, FiWifi } from "react-icons/fi";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Auto-redirect based on auth status
  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Show loading/splash screen while checking auth
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

      <div className="relative text-center space-y-8">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-200">
          <FiBook className="text-white" size={36} />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">Smart Attendance</h1>
          <p className="text-slate-500">Sistem Presensi Digital SMK</p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <FiSmartphone size={14} />
            <span>PWA Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiWifi size={14} />
            <span>Offline Mode</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiCheck size={14} />
            <span>Fast & Secure</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-slate-400">
        © 2026 Smart Attendance PWA • v1.0
      </p>
    </div>
  );
}
