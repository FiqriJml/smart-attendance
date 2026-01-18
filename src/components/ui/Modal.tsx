"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

export interface ModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal content */
    children: React.ReactNode;
    /** Modal size */
    size?: "sm" | "md" | "lg";
    /** Hide close button */
    hideCloseButton?: boolean;
}

/**
 * Modal dialog component with backdrop and animations
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Edit User">
 *   <form>...</form>
 * </Modal>
 */
export function Modal({
    open,
    onClose,
    title,
    children,
    size = "md",
    hideCloseButton = false
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (open) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [open, onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!open) return null;

    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg"
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={cn(
                    "w-full bg-white rounded-xl shadow-xl animate-in zoom-in-95 duration-200",
                    sizes[size]
                )}
            >
                {/* Header */}
                {(title || !hideCloseButton) && (
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        {title && (
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        )}
                        {!hideCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ModalFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex gap-3 pt-4 mt-4 border-t border-slate-100", className)} {...props}>
            {children}
        </div>
    );
}
