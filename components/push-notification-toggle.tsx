'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PushNotificationToggle() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        // Check if push notifications are supported
        if ('Notification' in window && 'serviceWorker' in navigator) {
            setSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!supported) {
            toast.error('Push notifications are not supported in this browser.');
            return;
        }

        setLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                // Register for push with service worker
                const registration = await navigator.serviceWorker.ready;

                // For a full implementation, you would:
                // 1. Get VAPID public key from server
                // 2. Subscribe to push service
                // 3. Send subscription to your backend

                toast.success('Push notifications enabled! You\'ll be notified when episodes finish processing.');

                // Show a test notification
                new Notification('Podcatch', {
                    body: 'You\'ll now receive notifications when episodes are ready!',
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                });
            } else if (result === 'denied') {
                toast.error('Notifications blocked. You can enable them in your browser settings.');
            }
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            toast.error('Failed to enable notifications.');
        } finally {
            setLoading(false);
        }
    };

    if (!supported) {
        return null;
    }

    return (
        <Button
            variant={permission === 'granted' ? 'secondary' : 'outline'}
            size="sm"
            onClick={requestPermission}
            disabled={loading || permission === 'denied'}
            className="gap-2"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : permission === 'granted' ? (
                <Bell className="h-4 w-4" />
            ) : (
                <BellOff className="h-4 w-4" />
            )}
            {permission === 'granted' ? 'Notifications On' : 'Enable Notifications'}
        </Button>
    );
}

// Utility function to show a push notification (can be called from anywhere)
export function showNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...options,
        });
    }
}
