"use client";

import { useState, useEffect } from "react";
import { FiX, FiDownload, FiSmartphone } from "react-icons/fi";
import { Button } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA Install Prompt Banner
 * Shows a custom banner prompting users to install the app
 */
export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed before
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            // Show again after 7 days
            if (daysSinceDismissed < 7) return;
        }

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for successful install
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowBanner(false);
        });

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    };

    if (isInstalled || !showBanner) return null;

    return (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-up">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                        <FiSmartphone className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                            Install Aplikasi
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Akses lebih cepat dari home screen
                        </p>

                        <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="primary" onClick={handleInstall}>
                                <FiDownload size={14} />
                                Install
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleDismiss}>
                                Nanti
                            </Button>
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={handleDismiss}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <FiX size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
