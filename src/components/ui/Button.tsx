import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button style variant */
    variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
    /** Button size */
    size?: "sm" | "md" | "lg";
    /** Show loading spinner */
    loading?: boolean;
    /** Full width button */
    fullWidth?: boolean;
}

/**
 * Primary button component with multiple variants
 * @example
 * <Button variant="primary" onClick={handleClick}>Save</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        variant = "primary",
        size = "md",
        loading = false,
        fullWidth = false,
        className,
        children,
        disabled,
        ...props
    }, ref) => {
        const variants = {
            primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm",
            secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
            outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100",
            danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm",
            ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs gap-1.5",
            md: "px-4 py-2 text-sm gap-2",
            lg: "px-6 py-3 text-base gap-2"
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
