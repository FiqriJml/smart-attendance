"use strict";
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { adminService } from "@/services/adminService";
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
    const [programs, setPrograms] = useState<{ id: string, name: string }[]>([]);

    // Form State
    const [formData, setFormData] = useState<{
        nama: string;
        email: string;
        role: UserRole;
        is_active: boolean;
        // Roles Specific
        wali_rombel_id: string;
        nama_wilayah: string;
        assigned_rombel_ids: string[];
        assigned_program_id: string;
    }>({
        nama: "", email: "", role: "guru", is_active: true,
        wali_rombel_id: "", nama_wilayah: "", assigned_rombel_ids: [],
        assigned_program_id: ""
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
        userService.getAllRombels().then(setRombels);
        adminService.getAllPrograms().then(setPrograms);
    }, []);

    // -- Handlers --
    const resetForm = () => {
        setFormData({
            nama: "", email: "", role: "guru", is_active: true,
            wali_rombel_id: "", nama_wilayah: "", assigned_rombel_ids: [],
            assigned_program_id: ""
        });
        setEditingUser(null);
    };

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setFormData({
            nama: user.nama,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            wali_rombel_id: user.wali_rombel_id || "",
            nama_wilayah: user.nama_wilayah || "",
            assigned_rombel_ids: user.assigned_rombel_ids || [],
            assigned_program_id: user.assigned_program_id || ""
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: UserProfile = {
                email: formData.email.toLowerCase().trim(), // Ensure lowercase ID
                nama: formData.nama,
                role: formData.role,
                is_active: formData.is_active,
                // Optional Fields
                wali_rombel_id: formData.role === 'wali_kelas' ? formData.wali_rombel_id : undefined,
                nama_wilayah: formData.role === 'bk' ? formData.nama_wilayah : undefined,
                assigned_rombel_ids: formData.role === 'bk' ? formData.assigned_rombel_ids : undefined,
                assigned_program_id: formData.role === 'admin' ? formData.assigned_program_id : undefined,
                // Preserve Metadata if editing
                uid: editingUser?.uid,
                createdAt: editingUser?.createdAt,
            };

            // Remove undefined keys to prevent Firestore error
            const cleanPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, v]) => v !== undefined)
            );

            if (editingUser) {
                // Update by Email
                await userService.updateUser(editingUser.email, cleanPayload);
            } else {
                // Create New (Email as ID)
                await userService.createUser(cleanPayload as UserProfile);
            }

            setIsModalOpen(false);
            resetForm();
            mutate();
        } catch (error: any) {
            alert("Error saving user: " + error.message);
        }
    };

    const toggleStatus = async (user: UserProfile) => {
        if (!confirm(`Ubah status aktif user ${user.nama}?`)) return;
        try {
            await userService.toggleUserStatus(user.email, !user.is_active);
            mutate();
        } catch (error: any) {
            alert("Error updating status: " + error.message);
        }
    };

    const handleMultiSelectToggle = (id: string) => {
        setFormData(prev => {
            const current = prev.assigned_rombel_ids;
            if (current.includes(id)) {
                return { ...prev, assigned_rombel_ids: current.filter(x => x !== id) };
            } else {
                return { ...prev, assigned_rombel_ids: [...current, id] };
            }
        });
    };

    // Filter
    const filteredUsers = (users || []).filter(u =>
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || !userProfile) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Akses User</h1>
                    <p className="text-slate-500">Whitelist email dan atur hak akses pengguna</p>
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
                            placeholder="Cari nama atau email..."
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User Info</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tanggung Jawab</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {filteredUsers.map(u => (
                                <tr key={u.email} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">{u.nama}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                        {u.uid && <div className="text-[10px] text-slate-400 mt-0.5">Linked</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'bk' ? 'info' : 'outline'}>
                                            {u.role === 'wali_kelas' ? 'GURU MAPEL & WALI' : u.role.toUpperCase().replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {u.role === 'wali_kelas' && (
                                            <div>
                                                <span className="text-xs font-semibold">Wali Kelas:</span>
                                                <div className="text-sm">{u.wali_rombel_id || "-"}</div>
                                            </div>
                                        )}
                                        {u.role === 'bk' && (
                                            <div>
                                                <div className="font-medium text-xs">{u.nama_wilayah}</div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {(u.assigned_rombel_ids || []).length} Rombel
                                                </div>
                                            </div>
                                        )}
                                        {u.role === 'guru' && <span className="text-slate-400">-</span>}
                                        {u.role === 'admin' && <span className="text-slate-400">All Access</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(u)}
                                            className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${u.is_active
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                }`}
                                        >
                                            {u.is_active ? 'Active' : 'Inactive'}
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

            {/* Modal */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? "Edit User" : "Tambah User Whitelist"}
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
                        label="Email Google"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={!!editingUser} // ID cannot be changed
                        helperText={!editingUser ? "Email ini akan menjadi ID user." : undefined}
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={['guru', 'wali_kelas'].includes(formData.role) ? 'guru' : formData.role}
                            onChange={e => {
                                const newRole = e.target.value as UserRole;
                                // Reset specific fields when changing main role
                                setFormData({ ...formData, role: newRole });
                            }}
                        >
                            <option value="guru">Guru Mapel</option>
                            <option value="bk">Guru BK</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Conditional Logic */}
                    {formData.role === 'admin' && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Assignment Program (Kaprog)
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.assigned_program_id}
                                onChange={e => setFormData({ ...formData, assigned_program_id: e.target.value })}
                            >
                                <option value="">None (Super Admin)</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">
                                Jika dipilih, admin hanya dapat memantau rombel dari program ini.
                            </p>
                        </div>
                    )}

                    {['guru', 'wali_kelas'].includes(formData.role) && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.role === 'wali_kelas'}
                                    onChange={e => {
                                        setFormData({
                                            ...formData,
                                            role: e.target.checked ? 'wali_kelas' : 'guru'
                                        });
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Tugas Tambahan: Wali Kelas
                            </label>

                            {formData.role === 'wali_kelas' && (
                                <Select
                                    label="Pilih Rombel Perwalian"
                                    value={formData.wali_rombel_id}
                                    onChange={e => setFormData({ ...formData, wali_rombel_id: e.target.value })}
                                    required
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
                                value={formData.nama_wilayah}
                                onChange={e => setFormData({ ...formData, nama_wilayah: e.target.value })}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Rombels</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2 bg-white">
                                    {rombels.map(r => (
                                        <label key={r.id} className="flex items-center gap-2 text-xs p-1 hover:bg-slate-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.assigned_rombel_ids.includes(r.id)}
                                                onChange={() => handleMultiSelectToggle(r.id)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            {r.nama_rombel}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <ModalFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="primary">
                            Simpan
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    );
}
