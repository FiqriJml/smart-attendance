"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "smart-attendance-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    // Get system preference
    const getSystemTheme = (): "light" | "dark" => {
        if (typeof window === "undefined") return "light";
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    // Apply theme to document
    const applyTheme = (resolved: "light" | "dark") => {
        const root = document.documentElement;
        if (resolved === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        setResolvedTheme(resolved);
    };

    // Set theme and persist
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);

        const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
        applyTheme(resolved);
    };

    // Toggle between light and dark
    const toggleTheme = () => {
        const newTheme = resolvedTheme === "light" ? "dark" : "light";
        setTheme(newTheme);
    };

    // Initialize on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        const initial = stored || "system";
        setThemeState(initial);

        const resolved = initial === "system" ? getSystemTheme() : initial;
        applyTheme(resolved);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (theme === "system") {
                applyTheme(getSystemTheme());
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
