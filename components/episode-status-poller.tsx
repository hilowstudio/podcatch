
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEpisodeStatus } from '@/actions/episode-actions';
import { toast } from 'sonner';

interface EpisodeStatusPollerProps {
    episodeId: string;
    initialStatus: string;
}

export function EpisodeStatusPoller({ episodeId, initialStatus }: EpisodeStatusPollerProps) {
    const router = useRouter();
    const [status, setStatus] = useState(initialStatus);

    useEffect(() => {
        // Only poll if processing or discovered
        if (status !== 'PROCESSING' && status !== 'DISCOVERED') return;

        const interval = setInterval(async () => {
            const newStatus = await getEpisodeStatus(episodeId);

            if (newStatus && newStatus !== status) {
                setStatus(newStatus);

                if (newStatus === 'COMPLETED') {
                    toast.success('Episode processing complete!');
                    router.refresh();
                } else if (newStatus === 'FAILED') {
                    toast.error('Episode processing failed.');
                    router.refresh();
                }
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [episodeId, status, router]);

    return null; // This component renders nothing
}
