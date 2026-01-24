"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { userService } from "@/services/userService";
import { Card, Button } from "@/components/ui";
import { FiArrowLeft, FiUsers } from "react-icons/fi";
import Link from "next/link";
import { Rombel } from "@/types";

export default function BKKelasPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tingkat = parseInt(params.tingkat as string, 10);

    const { data: rombels, isLoading } = useSWR(
        userProfile ? 'all-rombels' : null,
        () => userService.getAllRombels()
    );

    useEffect(() => {
        if (!loading && userProfile?.role !== 'bk') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);

    if (loading || !userProfile || isLoading) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
        </div>
    );

    const gradeRombels = (rombels || []).filter(r => r.tingkat === tingkat);
    const gradeLabel = tingkat === 10 ? "X" : tingkat === 11 ? "XI" : "XII";

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
                    <h1 className="text-2xl font-bold text-slate-800">Kelas {gradeLabel}</h1>
                    <p className="text-slate-500">Pilih rombel untuk mengisi kehadiran</p>
                </div>
            </div>

            {gradeRombels.length === 0 ? (
                <Card className="text-center py-12">
                    <FiUsers className="mx-auto mb-4 text-slate-400" size={48} />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                        Tidak Ada Rombel
                    </h3>
                    <p className="text-slate-500">
                        Belum ada rombel untuk Kelas {gradeLabel}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gradeRombels.map(rombel => (
                        <Link
                            key={rombel.id}
                            href={`/dashboard/attendance/${rombel.id}`}
                        >
                            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-500">
                                <h3 className="font-bold text-lg text-slate-800 mb-1">
                                    {rombel.nama_rombel}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {rombel.program_keahlian}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    {rombel.daftar_siswa_ref?.length || 0} Siswa
                                </p>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
