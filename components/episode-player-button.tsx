'use client';

import { useAudio } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface EpisodePlayerButtonProps {
    episode: {
        id: string;
        title: string;
        audioUrl: string;
        image?: string;
        feedTitle?: string;
    };
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export function EpisodePlayerButton({
    episode,
    variant = 'default',
    size = 'default',
    className
}: EpisodePlayerButtonProps) {
    const { currentEpisode, isPlaying, play, toggle } = useAudio();

    const isCurrentEpisode = currentEpisode?.id === episode.id;
    const isThisPlaying = isCurrentEpisode && isPlaying;

    const handleClick = () => {
        if (isCurrentEpisode) {
            toggle();
        } else {
            play({
                id: episode.id,
                title: episode.title,
                audioUrl: episode.audioUrl,
                image: episode.image ?? undefined,
                feedTitle: episode.feedTitle
            });
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={className}
        >
            {isThisPlaying ? (
                <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                </>
            ) : (
                <>
                    <Play className="mr-2 h-4 w-4" />
                    {isCurrentEpisode ? 'Resume' : 'Play Episode'}
                </>
            )}
        </Button>
    );
}
