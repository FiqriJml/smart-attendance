import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Input label */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
}

/**
 * Form input component with label and error handling
 * @example
 * <Input label="Email" placeholder="Enter email" error={errors.email} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "w-full px-3 py-2 rounded-lg border transition-colors duration-150",
                        "text-sm text-slate-800 placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                        "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
                        error
                            ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
                            : "border-slate-300",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-xs text-rose-600">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    /** Select label */
    label?: string;
    /** Error message */
    error?: string;
}

/**
 * Form select component with label and error handling
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, className, id, children, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        "w-full px-3 py-2 rounded-lg border transition-colors duration-150",
                        "text-sm text-slate-800 bg-white",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                        "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
                        error
                            ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
                            : "border-slate-300",
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {error && (
                    <p className="mt-1.5 text-xs text-rose-600">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";
