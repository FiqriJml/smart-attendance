/**
 * Utility functions for the Smart Attendance app
 * @module lib/utils
 */

/**
 * Merge class names conditionally (similar to shadcn/ui's cn function)
 * @param classes - Array of class names or undefined values
 * @returns Merged class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Format a date string to Indonesian locale
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "18 Januari 2026")
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Format a date to short format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Short formatted date (e.g., "18 Jan")
 */
export function formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Pad a number with leading zeros
 * @param num - Number to pad
 * @param size - Desired length
 * @returns Padded string
 */
export function padZero(num: number, size: number = 2): string {
    return String(num).padStart(size, '0');
}
