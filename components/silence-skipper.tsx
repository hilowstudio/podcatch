'use client';

import { useAudio, useAudioTime } from '@/components/audio-provider';
import { useEffect, useMemo } from 'react';
import { computeSilenceRegions } from '@/lib/silence-regions';

interface SilenceSkipperProps {
    wordTimestamps: { start: number; end: number }[];
}

export function SilenceSkipper({ wordTimestamps }: SilenceSkipperProps) {
    const { seek, silenceSkip } = useAudio();
    const currentTime = useAudioTime();

    const silenceRegions = useMemo(
        () => computeSilenceRegions(wordTimestamps),
        [wordTimestamps]
    );

    useEffect(() => {
        if (!silenceSkip) return;
        for (const region of silenceRegions) {
            if (currentTime >= region.start && currentTime <= region.end) {
                seek(region.end);
                break;
            }
        }
    }, [currentTime, silenceSkip, silenceRegions, seek]);

    return null;
}
