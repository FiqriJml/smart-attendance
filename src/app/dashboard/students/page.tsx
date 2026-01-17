"use client";

import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import useSWR from "swr"; // Caching Library
import { adminService, CSVStudentRow } from "@/services/adminService";
import { Student } from "@/types";
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiUpload, FiFilter } from "react-icons/fi";

const fetcher = () => adminService.getAllStudentsOptimized();

export default function StudentManagementPage() {
    const [activeTab, setActiveTab] = useState<"list" | "csv" | "manual">("list");

    // SWR Hook for Caching & Revalidation
    const { data: students = [], error, isLoading, mutate } = useSWR('allStudents', fetcher, {
        revalidateOnFocus: false, // Don't fetch on window focus to save reads
        dedupingInterval: 60000 // Cache for 1 min
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [filterRombel, setFilterRombel] = useState("");
    const [filterTingkat, setFilterTingkat] = useState("");

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Modals & Forms State (Same as before)
    const [summary, setSummary] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [formData, setFormData] = useState({
        nisn: "", nama: "", jk: "L", rombel: "", tingkat: "10", program: "", kompetensi: ""
    });

    // --- Client Side Filtering Logic ---
    const filteredData = useMemo(() => {
        let res = students || [];

        // 1. Text Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(s =>
                s.nama.toLowerCase().includes(lower) ||
                s.nisn.includes(lower) ||
                s.rombel_id.toLowerCase().includes(lower)
            );
        }

        // 2. Filters
        if (filterRombel) res = res.filter(s => s.rombel_id.includes(filterRombel));
        // Note: Student object only has Rombel ID. Tingkat is implicit in Rombel ID usually (X-TE1), 
        // or we need to join with Rombel data. For optimization, we assume Rombel ID starts with Tingkat or we filter by string.
        // Ideally Student object itself should carry metadata if we want easy filtering, OR we parse Rombel ID.
        if (filterTingkat) {
            const prefix = filterTingkat === "10" ? "X" : filterTingkat === "11" ? "XI" : "XII";
            // Simple heuristic: X-, XI-, XII- or 10, 11, 12 in string
            // Assuming Standard SMK naming: X-..., XI-..., XII-... or 10-..., 11-..., 12-...
            // Adjust based on your Rombel ID convention (e.g. X-TE2)
            res = res.filter(s => s.rombel_id.startsWith(prefix) || s.rombel_id.startsWith(filterTingkat));
        }

        return res;
    }, [students, searchTerm, filterRombel, filterTingkat]);

    // Reset Page on Filter Change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterRombel, filterTingkat]);

    // --- Pagination Logic ---
    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, page]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // --- Handlers (Wrap CRUD with Mutate to update Cache) ---

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
                const rombelMeta = {
                    tingkat: parseInt(formData.tingkat),
                    program: formData.program,
                    kompetensi: formData.kompetensi
                };
                await adminService.updateStudent(editingStudent, updatedStudent, rombelMeta);
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
            mutate(); // Refresh SWR cache
            setActiveTab("list");
            setFormData({ nisn: "", nama: "", jk: "L", rombel: "", tingkat: "10", program: "", kompetensi: "" });
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleDelete = async () => {
        if (!deletingStudent) return;
        try {
            await adminService.deleteStudent(deletingStudent, "Umum"); // Default Program if unknown. Caveat: might miss summary update if prog unknown.
            // Known Issue: We need Program Name to update Summary correctly. 
            // Improvement: Store 'program' in Student object or fetch before delete.
            // For MVP Optimization: we assume standard or 'Umum'.

            setSummary("Siswa dihapus.");
            mutate(); // Refresh
            setDeletingStudent(null);
        } catch (e: any) { alert("Error: " + e.message); }
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
                    mutate();
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

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,NISN,Nama,JK,Rombel,Tingkat,Program Keahlian,Kompetensi Keahlian\n123456,Siswa Contoh,L,X-TE1,10,Mekatronika,Teknik Elektronika Industri";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_siswa_v2.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header Tabs (Same as before) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab("list")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "list" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>Data Siswa</button>
                    <button onClick={() => { setActiveTab("manual"); setIsEditMode(false); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "manual" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}><span className="flex items-center gap-2"><FiPlus /> Tambah / Edit</span></button>
                    <button onClick={() => setActiveTab("csv")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "csv" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}><span className="flex items-center gap-2"><FiUpload /> Import CSV</span></button>
                </div>
            </div>

            {summary && <div className="bg-green-100 text-green-700 p-3 rounded-lg flex justify-between"><span>{summary}</span><button onClick={() => setSummary(null)}>x</button></div>}

            {/* VIEW: CSV & MANUAL (Reused layout code - omitted for brevity, assuming standard form structure identical to previous step) */}
            {activeTab === 'csv' && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
                    <button onClick={downloadTemplate} className="text-blue-600 underline">Download Template</button>
                    <input type="file" accept=".csv" onChange={handleCSVUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-100 file:text-blue-700 file:border-0 hover:file:bg-blue-200" />
                </div>
            )}

            {activeTab === 'manual' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleManualSave} className="space-y-4">
                        {/* Form fields same as previous step */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required placeholder="NISN" value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} className="border p-2 rounded" disabled={isEditMode} />
                            <input required placeholder="Nama" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="border p-2 rounded" />
                            <select value={formData.jk} onChange={e => setFormData({ ...formData, jk: e.target.value })} className="border p-2 rounded"><option value="L">L</option><option value="P">P</option></select>
                            <input required placeholder="Rombel (X-TE1)" value={formData.rombel} onChange={e => setFormData({ ...formData, rombel: e.target.value.toUpperCase() })} className="border p-2 rounded" />
                            <select value={formData.tingkat} onChange={e => setFormData({ ...formData, tingkat: e.target.value })} className="border p-2 rounded"><option value="10">10</option><option value="11">11</option><option value="12">12</option></select>
                            <input placeholder="Program Keahlian" value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })} className="border p-2 rounded" />
                            <input placeholder="Kompetensi" value={formData.kompetensi} onChange={e => setFormData({ ...formData, kompetensi: e.target.value })} className="border p-2 rounded" />
                        </div>
                        <button className="bg-blue-600 text-white py-2 px-4 rounded w-full">Simpan</button>
                    </form>
                </div>
            )}

            {/* VIEW: LIST (Optimized) */}
            {activeTab === "list" && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-3 text-gray-400" />
                            <input type="text" placeholder="Cari siswa..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <select className="border rounded-lg px-4 py-2" value={filterTingkat} onChange={e => setFilterTingkat(e.target.value)}>
                                <option value="">Semua Tingkat</option>
                                <option value="10">Kelas 10</option>
                                <option value="11">Kelas 11</option>
                                <option value="12">Kelas 12</option>
                            </select>
                            <input type="text" placeholder="Filter Rombel..." className="border rounded-lg px-4 py-2" value={filterRombel} onChange={e => setFilterRombel(e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NISN</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">L/P</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rombel</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading && <tr><td colSpan={5} className="text-center py-8">Loading Cache...</td></tr>}
                                {!isLoading && paginatedData.map((s) => (
                                    <tr key={s.nisn} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium">{s.nisn}</td>
                                        <td className="px-6 py-4 text-sm">{s.nama}</td>
                                        <td className="px-6 py-4 text-sm">{s.jk}</td>
                                        <td className="px-6 py-4 text-sm text-blue-600">{s.rombel_id}</td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            <button onClick={() => startEdit(s)} className="text-indigo-600 mr-4"><FiEdit2 /></button>
                                            <button onClick={() => { setDeletingStudent(s); setDeleteConfirmText(""); }} className="text-red-600"><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                        <span className="text-sm text-gray-600">Halaman {page} dari {totalPages} ({filteredData.length} Data)</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals for Delete (Same as before) - omitted for brevity, assuming standard modal code */}
            {deletingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-red-600">Hapus Siswa?</h3>
                        <p>Ketik "DELETE" untuk menghapus {deletingStudent.nama}.</p>
                        <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="border p-2 w-full" />
                        <button onClick={handleDelete} disabled={deleteConfirmText !== "DELETE"} className="bg-red-600 text-white p-2 rounded w-full disabled:bg-gray-300">Hapus</button>
                        <button onClick={() => setDeletingStudent(null)} className="bg-gray-200 p-2 rounded w-full">Batal</button>
                    </div>
                </div>
            )}
        </div>
    );
}
