"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { userService } from "@/services/userService";
import { Card, Button } from "@/components/ui";
import { FiArrowLeft, FiUser, FiMapPin, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Link from "next/link";
import { UserProfile, Rombel } from "@/types";

export default function BKMonitoringPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const [expandedBK, setExpandedBK] = useState<string | null>(null);

    const { data: users, isLoading: usersLoading } = useSWR(
        userProfile?.role === 'admin' ? 'all-users' : null,
        () => userService.getAllUsers()
    );

    const { data: allRombels } = useSWR(
        'all-rombels',
        () => userService.getAllRombels()
    );

    useEffect(() => {
        if (!loading && userProfile?.role !== 'admin') {
            router.push('/dashboard/bk');
        }
    }, [userProfile, loading, router]);

    if (loading || !userProfile || usersLoading) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
        </div>
    );

    const bkUsers = (users || []).filter(u => u.role === 'bk');

    const toggleExpand = (email: string) => {
        setExpandedBK(expandedBK === email ? null : email);
    };

    const getRombelsForBK = (assignedIds?: string[]) => {
        if (!assignedIds || !allRombels) return [];
        return allRombels.filter(r => assignedIds.includes(r.id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/bk">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <FiArrowLeft />
                        Kembali
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Monitoring Wilayah BK</h1>
                    <p className="text-slate-500">Daftar Guru BK dan Wilayah Binaan</p>
                </div>
            </div>

            {bkUsers.length === 0 ? (
                <Card className="text-center py-12">
                    <FiUser className="mx-auto mb-4 text-slate-400" size={48} />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                        Tidak Ada Guru BK
                    </h3>
                    <p className="text-slate-500">
                        Belum ada user dengan role BK terdaftar
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {bkUsers.map(bk => {
                        const rombels = getRombelsForBK(bk.assigned_rombel_ids);
                        const isExpanded = expandedBK === bk.email;

                        return (
                            <Card key={bk.email} className="overflow-hidden">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                                    onClick={() => toggleExpand(bk.email)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {bk.nama.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{bk.nama}</h3>
                                            <p className="text-sm text-slate-500">
                                                {bk.nama_wilayah || "Belum ada nama wilayah"} • {rombels.length} Rombel
                                            </p>
                                        </div>
                                    </div>
                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </div>

                                {isExpanded && (
                                    <div className="p-4 border-t bg-slate-50">
                                        {rombels.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {rombels.map(rombel => (
                                                    <Link
                                                        key={rombel.id}
                                                        href={`/dashboard/attendance/${rombel.id}`}
                                                    >
                                                        <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:shadow-sm cursor-pointer transition">
                                                            <div className="font-medium text-slate-800 text-sm">{rombel.nama_rombel}</div>
                                                            <div className="text-xs text-slate-500">{rombel.program_keahlian}</div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">Belum ada rombel yang di-assign.</p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
