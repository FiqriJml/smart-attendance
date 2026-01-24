"use strict";
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { UserProfile, UserRole, Rombel } from "@/types";
import {
    Button, Card, Input, Select, Modal, ModalFooter, Badge
} from "@/components/ui";
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiShield, FiUserCheck, FiX
} from "react-icons/fi";

export default function UserManagementPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    // -- State --
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [rombels, setRombels] = useState<Rombel[]>([]);

    // Form State
    const [formData, setFormData] = useState<{
        nama: string;
        email: string;
        role: UserRole;
        is_active: boolean;
        // Guru
        is_wali_kelas: boolean;
        wali_kelas_rombel_id: string;
        // BK
        bk_wilayah: string;
        bk_rombels: string[];
    }>({
        nama: "", email: "", role: "guru", is_active: true,
        is_wali_kelas: false, wali_kelas_rombel_id: "",
        bk_wilayah: "", bk_rombels: []
    });

    // -- Data --
    const { data: users, mutate, error } = useSWR('users', userService.getAllUsers);

    // -- Effects --
    useEffect(() => {
        if (!loading && userProfile?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [userProfile, loading, router]);

    useEffect(() => {
        // Fetch Rombels for dropdowns
        userService.getAllRombels().then(setRombels);
    }, []);

    // -- Handlers --
    const resetForm = () => {
        setFormData({
            nama: "", email: "", role: "guru", is_active: true,
            is_wali_kelas: false, wali_kelas_rombel_id: "",
            bk_wilayah: "", bk_rombels: []
        });
        setEditingUser(null);
    };

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setFormData({
            nama: user.nama,
            email: user.email,
            role: user.role,
            is_active: user.is_active !== false, // default true
            is_wali_kelas: !!user.is_wali_kelas,
            wali_kelas_rombel_id: user.wali_kelas_rombel_id || "",
            bk_wilayah: user.bk_wilayah || "",
            bk_rombels: user.bk_rombels || []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                nama: formData.nama,
                email: formData.email, // Kept for reference or update
                role: formData.role,
                is_active: formData.is_active,
                // Clean up fields based on Role
                is_wali_kelas: formData.role === 'guru' ? formData.is_wali_kelas : false,
                wali_kelas_rombel_id: (formData.role === 'guru' && formData.is_wali_kelas) ? formData.wali_kelas_rombel_id : "",
                bk_wilayah: formData.role === 'bk' ? formData.bk_wilayah : "",
                bk_rombels: formData.role === 'bk' ? formData.bk_rombels : []
            };

            if (editingUser) {
                // Update
                await userService.updateUser(editingUser.uid, payload);
            } else {
                // Create Pending User
                await userService.createPendingUser(payload);
            }

            setIsModalOpen(false);
            resetForm();
            mutate(); // Refresh list
        } catch (error: any) {
            alert("Error saving user: " + error.message);
        }
    };

    const toggleStatus = async (user: UserProfile) => {
        if (!confirm(`Apakah Anda yakin ingin mengganti status aktif user ${user.nama}?`)) return;
        try {
            await userService.toggleUserStatus(user.uid, !user.is_active);
            mutate();
        } catch (error: any) {
            alert("Error updating status: " + error.message);
        }
    };

    const handleBKRombelToggle = (rombelId: string) => {
        setFormData(prev => {
            const current = prev.bk_rombels;
            if (current.includes(rombelId)) {
                return { ...prev, bk_rombels: current.filter(id => id !== rombelId) };
            } else {
                return { ...prev, bk_rombels: [...current, rombelId] };
            }
        });
    };

    // Filtered Users
    const filteredUsers = (users || []).filter(u =>
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || !userProfile) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>
                    <p className="text-slate-500">Kelola akses dan peran pengguna</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <FiPlus className="mr-2" />
                    Tambah User
                </Button>
            </div>

            <Card noPadding className="overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <div className="relative max-w-sm">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari user..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nama / Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Detail</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {filteredUsers.map(u => (
                                <tr key={u.uid} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">{u.nama}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'bk' ? 'info' : 'outline'}>
                                            {u.role.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {u.role === 'guru' && u.is_wali_kelas && (
                                            <div>
                                                <span className="font-semibold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Wali Kelas</span>
                                                <div className="text-xs mt-1">{u.wali_kelas_rombel_id}</div>
                                            </div>
                                        )}
                                        {u.role === 'bk' && (
                                            <div>
                                                <div className="font-medium text-xs">{u.bk_wilayah}</div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {u.bk_rombels?.length || 0} Rombel Binaan
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(u)}
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                                        >
                                            {u.is_active !== false ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 mx-2">
                                            <FiEdit2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Tidak ada user ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Add/Edit */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? "Edit User" : "Tambah User"}
                size="md"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <Input
                        label="Nama Lengkap"
                        value={formData.nama}
                        onChange={e => setFormData({ ...formData, nama: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={!!editingUser} // Disable email edit for now to keep ID sync sanity
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            <option value="guru">Guru Mapel</option>
                            <option value="bk">Guru BK</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Conditional Fields */}
                    {formData.role === 'guru' && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_wali_kelas}
                                    onChange={e => setFormData({ ...formData, is_wali_kelas: e.target.checked })}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Tugas Tambahan: Wali Kelas
                            </label>

                            {formData.is_wali_kelas && (
                                <Select
                                    label="Pilih Rombel Perwalian"
                                    value={formData.wali_kelas_rombel_id}
                                    onChange={e => setFormData({ ...formData, wali_kelas_rombel_id: e.target.value })}
                                >
                                    <option value="">-- Pilih Rombel --</option>
                                    {rombels.map(r => (
                                        <option key={r.id} value={r.id}>{r.nama_rombel}</option>
                                    ))}
                                </Select>
                            )}
                        </div>
                    )}

                    {formData.role === 'bk' && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                            <Input
                                label="Nama Wilayah (Cth: Wilayah Bu Ana)"
                                value={formData.bk_wilayah}
                                onChange={e => setFormData({ ...formData, bk_wilayah: e.target.value })}
                                placeholder="Masukkan nama wilayah..."
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Rombel Tanggung Jawab</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2 bg-white">
                                    {rombels.map(r => (
                                        <label key={r.id} className="flex items-center gap-2 text-xs p-1 hover:bg-slate-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.bk_rombels.includes(r.id)}
                                                onChange={() => handleBKRombelToggle(r.id)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            {r.nama_rombel}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{formData.bk_rombels.length} rombel dipilih.</p>
                            </div>
                        </div>
                    )}

                    <ModalFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="primary">
                            Simpan User
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    );
}
