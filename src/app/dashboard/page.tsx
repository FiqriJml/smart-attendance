export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Guru</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder for Class Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-lg text-gray-800">X-TE2 - Matematika</h3>
                    <p className="text-gray-500 text-sm mt-1">40 Siswa</p>
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aktif</span>
                        <button className="text-blue-600 text-sm font-medium hover:underline">Masuk Kelas &rarr;</button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-border dashed border-2 flex items-center justify-center text-gray-400 h-32">
                    Coming Soon: Jadwal Hari Ini
                </div>
            </div>
        </div>
    );
}
