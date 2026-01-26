/**
 * Attendance Toggle Component
 * Toggles between H (Hadir), S (Sakit), I (Izin), A (Alpha)
 * @module features/attendance/components/AttendanceToggle
 */

import { AttendanceStatus } from "@/types";
import { cn } from "@/lib/utils";

interface AttendanceToggleProps {
    /** Current status value */
    value: AttendanceStatus | 'H';
    /** Callback when status changes */
    onChange: (status: AttendanceStatus | 'H') => void;
    /** Student name for display */
    studentName: string;
    /** Student NISN */
    nisn: string;
    /** Disable the toggle */
    disabled?: boolean;
}

const STATUS_OPTIONS: { value: AttendanceStatus | 'H'; label: string; color: string; bgColor: string }[] = [
    { value: 'H', label: 'H', color: 'text-emerald-700', bgColor: 'bg-emerald-500' },
    { value: 'S', label: 'S', color: 'text-sky-700', bgColor: 'bg-sky-500' },
    { value: 'I', label: 'I', color: 'text-amber-700', bgColor: 'bg-amber-500' },
    { value: 'A', label: 'A', color: 'text-rose-700', bgColor: 'bg-rose-500' },
];

/**
 * Toggle button group for attendance status
 * @example
 * <AttendanceToggle 
 *   value="H" 
 *   onChange={(s) => setStatus(nisn, s)} 
 *   studentName="John Doe"
 *   nisn="12345"
 * />
 */
export function AttendanceToggle({
    value,
    onChange,
    studentName,
    nisn,
    disabled = false
}: AttendanceToggleProps) {
    return (
        <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            {/* Student Info */}
            <div className="flex-1 min-w-0 mr-4">
                <p className="font-medium text-slate-800 leading-tight">{studentName}</p>
                <p className="text-xs text-slate-400">{nisn}</p>
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {STATUS_OPTIONS.map((option) => {
                    const isActive = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "w-9 h-9 rounded-lg font-bold text-sm transition-all duration-150",
                                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                isActive
                                    ? `${option.bgColor} text-white shadow-sm`
                                    : `bg-transparent ${option.color} hover:bg-white`
                            )}
                            title={getStatusTitle(option.value)}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function getStatusTitle(status: AttendanceStatus | 'H'): string {
    const titles: Record<AttendanceStatus | 'H', string> = {
        H: 'Hadir',
        S: 'Sakit',
        I: 'Izin',
        A: 'Alpha (Tanpa Keterangan)',
        hadir: 'Hadir',
        sakit: 'Sakit',
        izin: 'Izin',
        alpha: 'Alpha',
        terlambat: 'Terlambat'
    };
    return titles[status];
}

/**
 * Stats bar showing attendance summary
 */
interface StatsBarProps {
    stats: { H: number; S: number; I: number; A: number };
}

export function StatsBar({ stats }: StatsBarProps) {
    const items = [
        { key: 'H', label: 'Hadir', value: stats.H, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { key: 'S', label: 'Sakit', value: stats.S, color: 'bg-sky-50 text-sky-700 border-sky-200' },
        { key: 'I', label: 'Izin', value: stats.I, color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'A', label: 'Alpha', value: stats.A, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    ];

    return (
        <div className="grid grid-cols-4 gap-2">
            {items.map((item) => (
                <div
                    key={item.key}
                    className={cn("p-3 rounded-xl border text-center", item.color)}
                >
                    <div className="text-xs font-bold uppercase tracking-wide opacity-80">
                        {item.label}
                    </div>
                    <div className="text-xl font-bold mt-1">
                        {item.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
