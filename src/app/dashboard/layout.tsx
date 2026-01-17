"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <div className="font-bold text-lg text-blue-600">Smart Attendance</div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Hi, {user.displayName}</span>
                    <button
                        onClick={() => logout()}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Logout
                    </button>
                </div>
            </nav>
            <main className="p-4">
                {children}
            </main>
        </div>
    );
}
