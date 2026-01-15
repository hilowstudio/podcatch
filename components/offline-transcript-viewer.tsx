'use client';

import { useEffect, useState } from 'react';
import { TranscriptViewer } from './transcript-viewer';
import { cacheTranscript, getCachedTranscript } from '@/lib/offline-db';
import { Loader2, WifiOff } from 'lucide-react';

interface OfflineTranscriptViewerProps {
    episodeId: string;
    serverTranscript: string | null;
    className?: string;
}

export function OfflineTranscriptViewer({
    episodeId,
    serverTranscript,
    className
}: OfflineTranscriptViewerProps) {
    const [transcript, setTranscript] = useState<string | null>(serverTranscript);
    const [isFromCache, setIsFromCache] = useState(false);
    const [isLoading, setIsLoading] = useState(!serverTranscript);

    useEffect(() => {
        async function loadAndCacheTranscript() {
            // If we have server transcript, cache it for offline use
            if (serverTranscript) {
                try {
                    await cacheTranscript(episodeId, serverTranscript);
                } catch (error) {
                    console.warn('Failed to cache transcript:', error);
                }
                setTranscript(serverTranscript);
                setIsLoading(false);
                return;
            }

            // No server transcript - try to load from cache (offline scenario)
            try {
                const cached = await getCachedTranscript(episodeId);
                if (cached) {
                    setTranscript(cached);
                    setIsFromCache(true);
                }
            } catch (error) {
                console.warn('Failed to load cached transcript:', error);
            }
            setIsLoading(false);
        }

        loadAndCacheTranscript();
    }, [episodeId, serverTranscript]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading transcript...
            </div>
        );
    }

    if (!transcript) {
        return (
            <div className="p-4 text-muted-foreground text-center">
                No transcript available.
            </div>
        );
    }

    return (
        <div>
            {isFromCache && (
                <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-md text-sm">
                    <WifiOff className="h-4 w-4" />
                    Viewing cached transcript (offline)
                </div>
            )}
            <TranscriptViewer transcript={transcript} className={className} />
        </div>
    );
}
