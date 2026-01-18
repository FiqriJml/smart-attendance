"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { ClassCard } from "@/features/classes/components/ClassCard";
import { CreateClassModal } from "@/features/classes/components/CreateClassModal";
import { Button, Card } from "@/components/ui";
import { FiPlus, FiGrid } from "react-icons/fi";

export default function DashboardPage() {
    const { user } = useAuth();
    const {
        classes,
        rombels,
        isLoading,
        createClass,
        isCreating,
        loadRombels,
        isLoadingRombels
    } = useClasses(user?.uid);

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
