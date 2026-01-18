import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Badge color variant */
    variant?: "default" | "success" | "warning" | "danger" | "info";
    /** Badge size */
    size?: "sm" | "md";
}

/**
 * Badge component for status indicators
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Offline</Badge>
 */
export function Badge({
    variant = "default",
    size = "sm",
    className,
    children,
    ...props
}: BadgeProps) {
    const variants = {
        default: "bg-slate-100 text-slate-700",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-sky-50 text-sky-700 border-sky-200"
    };

    const sizes = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm"
    };

    return (
        <span
            className={cn(
                "inline-flex items-center font-medium rounded-full border",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

/**
 * Status dot for inline indicators
 */
export function StatusDot({
    status
}: {
    status: "online" | "offline" | "busy" | "away"
}) {
    const colors = {
        online: "bg-emerald-500",
        offline: "bg-slate-400",
        busy: "bg-rose-500",
        away: "bg-amber-500"
    };

    return (
        <span className={cn("w-2 h-2 rounded-full", colors[status])} />
    );
}
