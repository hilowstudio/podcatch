'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setupNetworkListener, getQueuedRequests, processQueue } from '@/lib/background-sync';
import { toast } from 'sonner';

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Initialize online state
        setIsOnline(navigator.onLine);
        setPendingRequests(getQueuedRequests().length);

        const handleOnline = async () => {
            setIsOnline(true);
            const queued = getQueuedRequests().length;
            if (queued > 0) {
                toast.info(`Syncing ${queued} pending request${queued > 1 ? 's' : ''}...`);
                const result = await processQueue();
                setPendingRequests(getQueuedRequests().length);
                if (result.success > 0) {
                    toast.success(`Synced ${result.success} request${result.success > 1 ? 's' : ''}`);
                }
            }
            // Hide banner after a short delay
            setTimeout(() => setShowBanner(false), 2000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Show banner if currently offline
        if (!navigator.onLine) {
            setShowBanner(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner && isOnline) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium transition-all duration-300 safe-top",
                isOnline
                    ? "bg-status-success text-white"
                    : "bg-status-warning text-foreground"
            )}
        >
            <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                    <>
                        <Wifi className="h-4 w-4" aria-hidden="true" />
                        <span>Back online{pendingRequests > 0 ? ` - Syncing ${pendingRequests} pending` : ''}</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="h-4 w-4" aria-hidden="true" />
                        <span>You're offline - Changes will sync when connected</span>
                    </>
                )}
            </div>
        </div>
    );
}
