/**
 * Notification Utilities
 * Provides helpers for requesting notification permissions
 * @module lib/notifications
 */

export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isNotificationSupported()) return 'denied';
    return Notification.permission;
}

/**
 * Request notification permission from user
 * @returns The resulting permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported in this browser');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        console.warn('Notifications have been denied by user');
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
}

/**
 * Show a local notification (requires permission)
 * @param title Notification title
 * @param options Notification options
 */
export async function showNotification(
    title: string,
    options?: NotificationOptions
): Promise<void> {
    if (getNotificationPermission() !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    // Use service worker for better PWA integration
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            ...options
        });
    } else {
        // Fallback to basic notification
        new Notification(title, options);
    }
}
