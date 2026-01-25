"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { ClassCard } from "@/features/classes/components/ClassCard";
import { CreateClassModal } from "@/features/classes/components/CreateClassModal";
import { Button, Card } from "@/components/ui";
import { FiPlus, FiGrid, FiClipboard } from "react-icons/fi";
import Link from "next/link";

export default function DashboardPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const {
        classes,
        rombels,
        isLoading,
        createClass,
        isCreating,
        loadRombels,
        isLoadingRombels
    } = useClasses(user?.uid);

    // Redirect BK users to their dedicated dashboard
    useEffect(() => {
        if (!authLoading && userProfile?.role === 'bk') {
            router.push('/dashboard/bk');
        }
    }, [userProfile, authLoading, router]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        await loadRombels();
    };

    const handleCreateClass = async (mapel: string, rombelId: string) => {
        await createClass(mapel, rombelId);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
                    <span className="text-sm text-slate-500">Memuat kelas...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Wali Kelas Logic */}
            {userProfile?.wali_rombel_id && (
                <div className="relative p-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl text-white shadow-xl mb-8 overflow-hidden">
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full mb-3 border border-white/30">
                                <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                                <span className="text-xs font-semibold text-cyan-50 tracking-wide">TANGGUNG JAWAB ANDA</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">Tugas Wali Kelas</h2>
                            <p className="text-blue-50/90 text-sm leading-relaxed">
                                Kelola absensi harian kelas binaan: <span className="font-bold text-cyan-200 text-base px-2 py-0.5 bg-white/10 rounded">{userProfile.wali_rombel_id}</span>
                            </p>
                        </div>
                        <Link href={`/dashboard/attendance/${userProfile.wali_rombel_id}`}>
                            <Button variant="ghost" className="bg-white !text-indigo-600 hover:bg-indigo-50 hover:!text-indigo-900 border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-bold px-6 py-3 text-base hover:scale-105">
                                <FiClipboard className="mr-2 text-lg" />
                                Input Absensi Kelas
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kelas Saya</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Kelola absensi harian kelas Anda
                    </p>
                </div>
                <Button onClick={handleOpenModal} variant="primary">
                    <FiPlus size={18} />
                    Buat Kelas Baru
                </Button>
            </div>

            {/* Class Grid or Empty State */}
            {classes.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <FiGrid className="text-slate-400" size={28} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                        Belum Ada Kelas
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                        Buat kelas pertama Anda untuk mulai mencatat kehadiran siswa.
                    </p>
                    <Button onClick={handleOpenModal} variant="primary">
                        <FiPlus size={18} />
                        Buat Kelas Pertama
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <ClassCard key={cls.id} classSession={cls} />
                    ))}
                </div>
            )}

            {/* Create Class Modal */}
            <CreateClassModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateClass}
                rombels={rombels}
                isSubmitting={isCreating || isLoadingRombels}
            />
        </div>
    );
}
