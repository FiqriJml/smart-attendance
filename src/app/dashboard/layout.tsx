"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FiHome, FiUsers, FiLogOut, FiBook, FiSun, FiMoon, FiUserCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "@/components/ui";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userProfile, loading, logout } = useAuth();
    const { resolvedTheme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))]">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
                    <span className="text-sm text-slate-500">Memuat...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { href: "/dashboard", icon: FiHome, label: "Home" },
        { href: "/dashboard/students", icon: FiUsers, label: "Siswa" },
        { href: "/dashboard/users", icon: FiUserCheck, label: "Users", adminOnly: true },
    ];

    const isActive = (href: string) => pathname === href;


    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] pb-20 md:pb-0">
            {/* Desktop Top Navigation */}
            <nav className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <FiBook className="text-white" size={18} />
                            </div>
                            <span className="font-bold text-slate-800 hidden sm:block">Smart Attendance</span>
                        </Link>

                        {/* Desktop Nav Items */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                if ((item as any).adminOnly && userProfile?.role !== 'admin') return null;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            isActive(item.href)
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-slate-700">{user.displayName}</p>
                                <p className="text-xs text-slate-500">{userProfile?.role || "Guru"}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {user.displayName?.charAt(0).toUpperCase()}
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title={resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            >
                                {resolvedTheme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                            </button>
                            <button
                                onClick={() => logout()}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <FiLogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-pb">
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        if ((item as any).adminOnly && userProfile?.role !== 'admin') return null;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                                    isActive(item.href)
                                        ? "text-indigo-600"
                                        : "text-slate-500"
                                )}
                            >
                                <Icon size={22} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => logout()}
                        className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg text-slate-500 min-w-[64px]"
                    >
                        <FiLogOut size={22} />
                        <span className="text-xs font-medium">Logout</span>
                    </button>
                </div>
            </nav>

            {/* PWA Install Prompt */}
            <InstallPrompt />
        </div>
    );
}
