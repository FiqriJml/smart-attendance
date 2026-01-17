"use client";

import { useState } from "react";
import Papa from "papaparse";
import { adminService, CSVStudentRow } from "@/services/adminService";

export default function StudentManagementPage() {
    const [data, setData] = useState<CSVStudentRow[]>([]);
    const [uploading, setUploading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setData(results.data as CSVStudentRow[]);
            },
        });
    };

    const handleSave = async () => {
        if (data.length === 0) return;
        setUploading(true);
        try {
            const result = await adminService.processCSVData(data);
            setSummary(`Berhasil menyimpan ${result.studentsAdded} siswa dan update ${result.rombelsUpdated} rombel.`);
            setData([]);
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setUploading(false);
        }
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-sans text-gray-800">Manajemen Siswa</h1>
                <button
                    onClick={downloadTemplate}
                    className="text-blue-600 text-sm hover:underline"
                >
                    Download Template .csv
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
             "
                    />
                    <p className="text-xs text-gray-400 mt-2">Format: NISN, Nama, JK, Rombel, Tingkat, Program Keahlian, Kompetensi Keahlian</p>
                </div>

                {summary && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm">
                        {summary}
                    </div>
                )}

                {data.length > 0 && (
                    <div className="space-y-4">
                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left">NISN</th>
                                        <th className="px-4 py-2 text-left">Nama</th>
                                        <th className="px-4 py-2 text-left">Rombel</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">{row.NISN}</td>
                                            <td className="px-4 py-2">{row.Nama}</td>
                                            <td className="px-4 py-2">{row.Rombel}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={uploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center"
                        >
                            {uploading ? "Menyimpan..." : `Simpan ${data.length} Data ke Database`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
