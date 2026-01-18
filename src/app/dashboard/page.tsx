"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { classService } from "@/services/classService";
import { masterDataService } from "@/services/masterDataService";
import { ClassSession, Rombel } from "@/types";
import { FiPlus, FiGrid, FiUsers, FiBook } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Class Form State
    const [rombels, setRombels] = useState<Rombel[]>([]);
    const [newClassData, setNewClassData] = useState({
        mapel: "",
        rombelId: ""
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchClasses();
        }
    }, [user]);

    const fetchClasses = async () => {
        if (!user) return;
        try {
            const data = await classService.getClassesByTeacher(user.uid);
            setClasses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = async () => {
        setIsCreateModalOpen(true);
        try {
            const data = await masterDataService.getAllRombels();
            setRombels(data);
        } catch (e) {
            alert("Gagal memuat data rombel");
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setCreating(true);
        try {
            await classService.createClassSession(
                user.uid,
                newClassData.mapel,
                newClassData.rombelId
            );
            setIsCreateModalOpen(false);
            setNewClassData({ mapel: "", rombelId: "" });
            fetchClasses(); // Refresh list
        } catch (e: any) {
            alert("Gagal membuat kelas: " + e.message);
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelas Saya</h1>
                    <p className="text-gray-500 text-sm">Kelola absensi harian kelas Anda</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <FiPlus size={18} /> Buat Kelas Baru
                </button>
            </div>

            {classes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    <p className="text-gray-500 mb-2">Belum ada kelas aktif.</p>
                    <button onClick={openCreateModal} className="text-blue-600 hover:underline text-sm">Buat kelas pertama Anda</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    {cls.rombel_id}
                                </div>
                                <div className="p-2 bg-gray-100 rounded-full text-gray-500">
                                    <FiBook size={14} />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{cls.mata_pelajaran}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <FiUsers size={14} />
                                <span>{cls.daftar_siswa?.length || 0} Siswa</span>
                            </div>
                            <Link
                                href={`/dashboard/kelas/${cls.id}`}
                                className="block w-full text-center bg-gray-50 hover:bg-blue-50 text-blue-600 font-medium py-2 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
                            >
                                Buka Presensi
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE CLASS MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Buat Kelas Baru</h2>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Contoh: Matematika Wajib"
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newClassData.mapel}
                                    onChange={e => setNewClassData({ ...newClassData, mapel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Rombel</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newClassData.rombelId}
                                    onChange={e => setNewClassData({ ...newClassData, rombelId: e.target.value })}
                                >
                                    <option value="">-- Pilih Rombel --</option>
                                    {rombels.map(r => (
                                        <option key={r.id} value={r.id}>{r.nama_rombel}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-2 bg-gray-100 font-medium rounded-lg text-gray-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                                >
                                    {creating ? "Membuat..." : "Buat Kelas"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
