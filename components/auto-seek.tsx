'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAudio } from '@/components/audio-provider';

interface AutoSeekProps {
    episode: {
        id: string;
        title: string;
        audioUrl: string;
        image?: string;
        feedTitle?: string;
    };
}

export function AutoSeek({ episode }: AutoSeekProps) {
    const searchParams = useSearchParams();
    const { currentEpisode, play, seek, isPlaying } = useAudio();
    const hasAutoSeeked = useRef(false);

    useEffect(() => {
        const timestamp = searchParams.get('t');
        if (!timestamp || hasAutoSeeked.current) return;

        const seconds = parseInt(timestamp, 10);
        if (isNaN(seconds) || seconds < 0) return;

        hasAutoSeeked.current = true;

        // If this episode is already loaded, just seek
        if (currentEpisode?.id === episode.id) {
            seek(seconds);
        } else {
            // Otherwise, start playing and then seek
            play({
                id: episode.id,
                title: episode.title,
                audioUrl: episode.audioUrl,
                image: episode.image,
                feedTitle: episode.feedTitle
            });
            // Small delay to let the audio load before seeking
            setTimeout(() => seek(seconds), 500);
        }
    }, [searchParams, episode, currentEpisode, play, seek]);

    // This component doesn't render anything visible
    return null;
}
