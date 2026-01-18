"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/features/students/hooks/useStudents";
import { adminService, CSVStudentRow } from "@/services/adminService";
import { Student } from "@/types";
import { Button, Card, Input, Select, Modal, ModalFooter, Badge } from "@/components/ui";
import {
    FiSearch, FiPlus, FiUpload, FiDownload, FiEdit2, FiTrash2,
    FiShieldOff, FiChevronLeft, FiChevronRight, FiUsers
} from "react-icons/fi";

export default function StudentManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    // RBAC Check
    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (!userProfile || userProfile.role !== 'admin') {
        return (
            <Card className="text-center py-12">
                <FiShieldOff className="mx-auto text-5xl text-rose-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Akses Ditolak</h2>
                <p className="text-slate-500 mt-2">Halaman ini hanya untuk Admin.</p>
                <Button onClick={() => router.push("/dashboard")} variant="secondary" className="mt-4">
                    Kembali ke Dashboard
                </Button>
            </Card>
        );
    }

    return <StudentManagementContent />;
}

function StudentManagementContent() {
    // Use the custom hook for all student data logic
    const {
        paginatedStudents,
        isLoading,
        refresh,
        searchTerm,
        setSearchTerm,
        filterRombel,
        setFilterRombel,
        filterTingkat,
        setFilterTingkat,
        page,
        setPage,
        totalPages,
        totalFiltered
    } = useStudents(20);

    const [activeTab, setActiveTab] = useState<"list" | "csv" | "manual">("list");
    const [summary, setSummary] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [formData, setFormData] = useState({
        nisn: "", nama: "", jk: "L", rombel: "", tingkat: "10", program: "", kompetensi: ""
    });

    // Handlers
    const handleManualSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditMode && editingStudent) {
                const updatedStudent: Student = {
                    ...editingStudent,
                    nisn: formData.nisn,
                    nama: formData.nama,
                    jk: formData.jk as "L" | "P",
                    rombel_id: formData.rombel
                };
                await adminService.updateStudent(editingStudent, updatedStudent, {
                    tingkat: parseInt(formData.tingkat),
                    program: formData.program,
                    kompetensi: formData.kompetensi
                });
                setSummary("Siswa berhasil diperbarui.");
            } else {
                const row: CSVStudentRow = {
                    NISN: formData.nisn,
                    Nama: formData.nama,
                    JK: formData.jk,
                    Rombel: formData.rombel,
                    Tingkat: formData.tingkat,
                    "Program Keahlian": formData.program,
                    "Kompetensi Keahlian": formData.kompetensi
                };
                await adminService.processCSVData([row]);
                setSummary("Siswa berhasil ditambahkan.");
            }
            refresh();
            setActiveTab("list");
            resetForm();
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleDelete = async () => {
        if (!deletingStudent) return;
        try {
            await adminService.deleteStudent(deletingStudent, "Umum");
            setSummary("Siswa dihapus.");
            refresh();
            setDeletingStudent(null);
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const res = await adminService.processCSVData(results.data as CSVStudentRow[]);
                    setSummary(`Berhasil import ${res.studentsAdded} siswa.`);
                    refresh();
                    setActiveTab("list");
                } catch (e: any) {
                    alert("Error CSV: " + e.message);
                }
            }
        });
    };

    const startEdit = (student: Student) => {
        setIsEditMode(true);
        setEditingStudent(student);
        setActiveTab("manual");
        setFormData({
            nisn: student.nisn,
            nama: student.nama,
            jk: student.jk,
            rombel: student.rombel_id,
            tingkat: "10",
            program: "",
            kompetensi: ""
        });
    };

    const resetForm = () => {
        setFormData({ nisn: "", nama: "", jk: "L", rombel: "", tingkat: "10", program: "", kompetensi: "" });
        setIsEditMode(false);
        setEditingStudent(null);
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,NISN,Nama,JK,Rombel,Tingkat,Program Keahlian,Kompetensi Keahlian\n123456,Siswa Contoh,L,X-TE1,10,Mekatronika,Teknik Elektronika";
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "template_siswa_v2.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Siswa</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola data siswa sekolah</p>
                </div>

                {/* Tab Buttons */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "list"
                                ? "bg-white shadow text-indigo-600"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <FiUsers className="inline mr-2" size={16} />
                        Data Siswa
                    </button>
                    <button
                        onClick={() => { setActiveTab("manual"); resetForm(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "manual"
                                ? "bg-white shadow text-indigo-600"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <FiPlus className="inline mr-2" size={16} />
                        Tambah
                    </button>
                    <button
                        onClick={() => setActiveTab("csv")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "csv"
                                ? "bg-white shadow text-indigo-600"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <FiUpload className="inline mr-2" size={16} />
                        Import
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {summary && (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-200 flex justify-between items-center">
                    <span>{summary}</span>
                    <button onClick={() => setSummary(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
                </div>
            )}

            {/* CSV Import View */}
            {activeTab === "csv" && (
                <Card className="text-center space-y-6 py-12">
                    <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <FiUpload className="text-indigo-600" size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-slate-700">Import Data Siswa</h3>
                        <p className="text-sm text-slate-500 mt-1">Upload file CSV sesuai template</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <Button variant="outline" onClick={downloadTemplate}>
                            <FiDownload size={16} />
                            Download Template
                        </Button>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCSVUpload}
                            className="block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-indigo-50 file:text-indigo-700 file:border-0 hover:file:bg-indigo-100"
                        />
                    </div>
                </Card>
            )}

            {/* Manual Add/Edit Form */}
            {activeTab === "manual" && (
                <Card>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                        {isEditMode ? "Edit Siswa" : "Tambah Siswa Baru"}
                    </h3>
                    <form onSubmit={handleManualSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="NISN"
                                value={formData.nisn}
                                onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                                required
                                disabled={isEditMode}
                            />
                            <Input
                                label="Nama Lengkap"
                                value={formData.nama}
                                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                required
                            />
                            <Select
                                label="Jenis Kelamin"
                                value={formData.jk}
                                onChange={e => setFormData({ ...formData, jk: e.target.value })}
                            >
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </Select>
                            <Input
                                label="Rombel"
                                placeholder="X-TE1"
                                value={formData.rombel}
                                onChange={e => setFormData({ ...formData, rombel: e.target.value.toUpperCase() })}
                                required
                            />
                            <Select
                                label="Tingkat"
                                value={formData.tingkat}
                                onChange={e => setFormData({ ...formData, tingkat: e.target.value })}
                            >
                                <option value="10">Kelas 10</option>
                                <option value="11">Kelas 11</option>
                                <option value="12">Kelas 12</option>
                            </Select>
                            <Input
                                label="Program Keahlian"
                                value={formData.program}
                                onChange={e => setFormData({ ...formData, program: e.target.value })}
                            />
                            <Input
                                label="Kompetensi Keahlian"
                                value={formData.kompetensi}
                                onChange={e => setFormData({ ...formData, kompetensi: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { resetForm(); setActiveTab("list"); }}>
                                Batal
                            </Button>
                            <Button type="submit" variant="primary">
                                {isEditMode ? "Simpan Perubahan" : "Tambah Siswa"}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Student List */}
            {activeTab === "list" && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari siswa..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={filterTingkat}
                                onChange={e => setFilterTingkat(e.target.value)}
                            >
                                <option value="">Semua Tingkat</option>
                                <option value="10">Kelas 10</option>
                                <option value="11">Kelas 11</option>
                                <option value="12">Kelas 12</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Filter Rombel..."
                                className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-32"
                                value={filterRombel}
                                onChange={e => setFilterRombel(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <Card noPadding className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">NISN</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">L/P</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rombel</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {isLoading && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent mx-auto" />
                                            </td>
                                        </tr>
                                    )}
                                    {!isLoading && paginatedStudents.map((s) => (
                                        <tr key={s.nisn} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.nisn}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{s.nama}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <Badge variant={s.jk === 'L' ? 'info' : 'warning'}>{s.jk}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <Badge variant="default">{s.rombel_id}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => startEdit(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors mr-1">
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button onClick={() => { setDeletingStudent(s); setDeleteConfirmText(""); }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!isLoading && paginatedStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-slate-500">
                                                Tidak ada data siswa
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    <Card className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm text-slate-600">
                            Halaman {page} dari {totalPages} ({totalFiltered} siswa)
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                <FiChevronLeft size={16} />
                                Prev
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                Next
                                <FiChevronRight size={16} />
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                open={!!deletingStudent}
                onClose={() => setDeletingStudent(null)}
                title="Hapus Siswa?"
                size="sm"
            >
                <p className="text-slate-600 mb-4">
                    Ketik "<span className="font-bold text-rose-600">DELETE</span>" untuk menghapus <span className="font-medium">{deletingStudent?.nama}</span>.
                </p>
                <Input
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Ketik DELETE"
                />
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setDeletingStudent(null)} className="flex-1">
                        Batal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleteConfirmText !== "DELETE"}
                        className="flex-1"
                    >
                        Hapus
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
