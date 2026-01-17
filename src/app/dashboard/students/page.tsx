"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { adminService, CSVStudentRow } from "@/services/adminService";
import { Student } from "@/types";
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiUpload } from "react-icons/fi";

export default function StudentManagementPage() {
    const [activeTab, setActiveTab] = useState<"list" | "csv" | "manual">("list");
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [summary, setSummary] = useState<string | null>(null);

    // Edit/Add Modal State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Form State (Reuse for Add Manual / Edit)
    const [formData, setFormData] = useState({
        nisn: "",
        nama: "",
        jk: "L",
        rombel: "",
        tingkat: "10",
        program: "",
        kompetensi: ""
    });

    // Delete Modal State
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");


    // --- Data Fetching ---
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllStudents();
            setStudents(data);
            setFilteredStudents(data);
        } catch (e) {
            alert("Gagal mengambil data siswa");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "list") {
            fetchStudents();
        }
    }, [activeTab]);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredStudents(students);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredStudents(students.filter(s =>
                s.nama.toLowerCase().includes(lower) ||
                s.nisn.includes(lower) ||
                s.rombel_id.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, students]);


    // --- Handlers ---

    const handleManualSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode && editingStudent) {
                // Update
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
                setActiveTab("list");
            } else {
                // Create New (Manual)
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
                // Keep on manual tab or switch? Let's stay but clear form
                setFormData({
                    nisn: "", nama: "", jk: "L", rombel: "", tingkat: "10", program: "", kompetensi: ""
                });
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
            setIsEditMode(false);
            setEditingStudent(null);
        }
    };

    const startEdit = (student: Student) => {
        setIsEditMode(true);
        setEditingStudent(student);
        setActiveTab("manual"); // Interface re-use

        // Populate Form (Note: We don't store Tingkat/Prog in Student object directly in the efficient schema, 
        // so we might need to fetch it or asking user to re-input/verify if they want to change Rombel params.
        // For this version, we will populate what we have and let user fill rest or defaults)
        setFormData({
            nisn: student.nisn,
            nama: student.nama,
            jk: student.jk,
            rombel: student.rombel_id,
            tingkat: "10", // Default, user must check
            program: "", // User input required if creating new rombel
            kompetensi: ""
        });
    };

    const handleDelete = async () => {
        if (!deletingStudent) return;
        if (deleteConfirmText !== "DELETE") return;

        setLoading(true);
        try {
            await adminService.deleteStudent(deletingStudent);
            setSummary("Siswa berhasil dihapus.");
            fetchStudents();
            setDeletingStudent(null);
            setDeleteConfirmText("");
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    // CSV State - Simplified local vars as we need less robust state here
    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                setLoading(true);
                try {
                    const res = await adminService.processCSVData(results.data as CSVStudentRow[]);
                    setSummary(`Berhasil import ${res.studentsAdded} siswa.`);
                    fetchStudents();
                    setActiveTab("list");
                } catch (e: any) {
                    alert("Error CSV: " + e.message);
                } finally {
                    setLoading(false);
                }
            }
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "list" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
                    >
                        Data Siswa
                    </button>
                    <button
                        onClick={() => { setActiveTab("manual"); setIsEditMode(false); setFormData({ nisn: "", nama: "", jk: "L", rombel: "", tingkat: "10", program: "", kompetensi: "" }); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "manual" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
                    >
                        <span className="flex items-center gap-2"><FiPlus /> Tambah / Edit</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("csv")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "csv" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
                    >
                        <span className="flex items-center gap-2"><FiUpload /> Import CSV</span>
                    </button>
                </div>
            </div>

            {summary && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm flex justify-between">
                    <span>{summary}</span>
                    <button onClick={() => setSummary(null)} className="font-bold">x</button>
                </div>
            )}

            {/* VIEW: CSV UPLOAD */}
            {activeTab === "csv" && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
                    <button onClick={downloadTemplate} className="text-blue-600 underline text-sm mb-4">Download Template</button>
                    <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-10">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCSVUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-100 file:text-blue-700 file:border-0 hover:file:bg-blue-200 cursor-pointer"
                        />
                    </div>
                </div>
            )}

            {/* VIEW: MANUAL FORM (ADD/EDIT) */}
            {activeTab === "manual" && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">{isEditMode ? "Edit Siswa" : "Tambah Siswa Baru"}</h2>
                    <form onSubmit={handleManualSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">NISN {isEditMode && <span className="text-xs text-red-500">(Tidak dapat diubah)</span>}</label>
                                <input
                                    required type="text"
                                    disabled={isEditMode}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black bg-white disabled:bg-gray-100"
                                    value={formData.nisn}
                                    onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <input
                                    required type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                                <select
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                                    value={formData.jk}
                                    onChange={e => setFormData({ ...formData, jk: e.target.value })}
                                >
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kode Rombel (ex: X-TE1)</label>
                                <input
                                    required type="text" placeholder="X-TE1"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                                    value={formData.rombel}
                                    onChange={e => setFormData({ ...formData, rombel: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tingkat</label>
                                <select
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                                    value={formData.tingkat}
                                    onChange={e => setFormData({ ...formData, tingkat: e.target.value })}
                                >
                                    <option value="10">10</option>
                                    <option value="11">11</option>
                                    <option value="12">12</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Program Keahlian</label>
                                <input
                                    type="text" placeholder="Wajib jika Rombel Baru"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                                    value={formData.program}
                                    onChange={e => setFormData({ ...formData, program: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Kompetensi Keahlian</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                                    value={formData.kompetensi}
                                    onChange={e => setFormData({ ...formData, kompetensi: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab("list")}
                                className="flex-1 bg-gray-200 text-gray-800 font-medium py-2 rounded-lg"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
                            >
                                {loading ? "Menyimpan..." : "Simpan Data"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* VIEW: LIST */}
            {activeTab === "list" && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, NISN, atau rombel..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L/P</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rombel</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading data...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data siswa ditemukan.</td></tr>
                                ) : (
                                    filteredStudents.map((s) => (
                                        <tr key={s.nisn} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.nisn}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.nama}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.jk}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{s.rombel_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button onClick={() => startEdit(s)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                    <FiEdit2 size={18} />
                                                </button>
                                                <button onClick={() => setDeletingStudent(s)} className="text-red-600 hover:text-red-900">
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deletingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-red-600">Hapus Siswa?</h3>
                        <p className="text-gray-600">
                            Anda akan menghapus siswa <strong>{deletingStudent.nama}</strong> ({deletingStudent.nisn}).
                            Tindakan ini juga akan menghapus siswa dari Rombel <strong>{deletingStudent.rombel_id}</strong>.
                        </p>
                        <div className="bg-gray-100 p-3 rounded-md text-sm">
                            Ketik <strong>DELETE</strong> untuk konfirmasi.
                        </div>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            placeholder="Type DELETE"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                        />
                        <div className="flex gap-4 pt-2">
                            <button onClick={() => { setDeletingStudent(null); setDeleteConfirmText(""); }} className="flex-1 py-2 bg-gray-200 rounded">Batal</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== "DELETE" || loading}
                                className="flex-1 py-2 bg-red-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? "Menghapus..." : "Hapus Permanen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
