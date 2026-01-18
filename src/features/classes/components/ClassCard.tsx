/**
 * Class Card component for dashboard
 * @module features/classes/components/ClassCard
 */

import Link from "next/link";
import { ClassSession } from "@/types";
import { Card } from "@/components/ui";
import { FiBook, FiUsers, FiArrowRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface ClassCardProps {
    /** Class session data */
    classSession: ClassSession;
    /** Optional additional className */
    className?: string;
}

/**
 * Displays a class card with subject, rombel, and student count
 * @example
 * <ClassCard classSession={myClass} />
 */
export function ClassCard({ classSession, className }: ClassCardProps) {
    const { id, mata_pelajaran, rombel_id, daftar_siswa } = classSession;
    const studentCount = daftar_siswa?.length || 0;

    return (
        <Card
            hoverable
            className={cn("group relative overflow-hidden", className)}
        >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                        {rombel_id}
                    </span>
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <FiBook size={16} />
                    </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                    {mata_pelajaran}
                </h3>

                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <FiUsers size={14} />
                    <span>{studentCount} Siswa</span>
                </div>

                {/* Action */}
                <Link
                    href={`/dashboard/kelas/${id}`}
                    className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-medium text-sm rounded-lg transition-colors group/btn"
                >
                    <span>Buka Presensi</span>
                    <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
            </div>
        </Card>
    );
}
