"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui";
import { FiUsers, FiMapPin } from "react-icons/fi";
import Link from "next/link";

export default function BKDashboardPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userProfile?.role !== 'bk') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);

    if (loading || !userProfile) return null;

    const gradeCards = [
        { tingkat: 10, label: "Kelas X", color: "from-blue-500 to-blue-600" },
        { tingkat: 11, label: "Kelas XI", color: "from-emerald-500 to-emerald-600" },
        { tingkat: 12, label: "Kelas XII", color: "from-purple-500 to-purple-600" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard BK</h1>
                <p className="text-slate-500">
                    Selamat datang, {userProfile.nama}
                    {userProfile.nama_wilayah && ` - ${userProfile.nama_wilayah}`}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {gradeCards.map(grade => (
                    <Link
                        key={grade.tingkat}
                        href={`/dashboard/bk/kelas/${grade.tingkat}`}
                    >
                        <Card className={`bg-gradient-to-br ${grade.color} text-white p-6 hover:scale-[1.02] transition-transform cursor-pointer`}>
                            <FiUsers className="mb-3" size={28} />
                            <h3 className="text-lg font-bold">{grade.label}</h3>
                            <p className="text-sm opacity-80">Lihat semua rombel</p>
                        </Card>
                    </Link>
                ))}

                <Link href="/dashboard/bk/wilayah">
                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 hover:scale-[1.02] transition-transform cursor-pointer">
                        <FiMapPin className="mb-3" size={28} />
                        <h3 className="text-lg font-bold">Wilayah Saya</h3>
                        <p className="text-sm opacity-80">
                            {(userProfile.assigned_rombel_ids || []).length} Rombel Binaan
                        </p>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
