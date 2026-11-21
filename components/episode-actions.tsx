'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ListPlus, Pause, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAudio, isPlayableHere } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlayerEpisode } from '@/actions/player-actions';
import { cn } from '@/lib/utils';

export type ActionEpisode = Pick<PlayerEpisode, 'id' | 'title' | 'audioUrl'> &
    Partial<Pick<PlayerEpisode, 'youtubeId' | 'feedId' | 'feedTitle' | 'image' | 'positionSec' | 'durationSec' | 'completed' | 'status'>>;

/**
 * Play, Up next and Mark played for one episode. The same three controls,
 * in the same order, everywhere an episode is listed.
 */
export function EpisodeActions({
    episode,
    className,
    compact = false,
    primary = false,
    showQueue = true,
}: {
    episode: ActionEpisode;
    className?: string;
    compact?: boolean;
    /** The screen's main action (filled). Lists keep it quiet. */
    primary?: boolean;
    /** Hide the Up next control where the list is Up next itself. */
    showQueue?: boolean;
}) {
    const { currentEpisode, isPlaying, play, toggle, queue, addToQueue, removeFromQueue, markPlayed } = useAudio();
    const [completed, setCompleted] = useState(!!episode.completed);
    const isCurrent = currentEpisode?.id === episode.id;
    const inQueue = queue.some((q) => q.id === episode.id);
    const started = !completed && (episode.positionSec ?? 0) > 5;

    const playLabel = isCurrent && isPlaying ? 'Pause' : isCurrent || started ? 'Resume' : 'Play';

    const onPlay = () => {
        if (isCurrent) return toggle();
        play({
            id: episode.id,
            title: episode.title,
            audioUrl: episode.audioUrl,
            image: episode.image,
            feedTitle: episode.feedTitle,
            feedId: episode.feedId,
            positionSec: episode.positionSec,
            durationSec: episode.durationSec,
            completed,
        });
    };

    const queueItem = {
        id: episode.id,
        title: episode.title,
        audioUrl: episode.audioUrl,
        image: episode.image,
        feedTitle: episode.feedTitle,
        feedId: episode.feedId,
        positionSec: episode.positionSec,
        durationSec: episode.durationSec,
        completed,
    };

    const onTogglePlayed = () => {
        const next = !completed;
        setCompleted(next);
        markPlayed(episode.id, next);
        toast(next ? 'Marked played' : 'Marked unplayed', {
            action: { label: 'Undo', onClick: () => { setCompleted(!next); markPlayed(episode.id, !next); } },
        });
    };

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {episode.youtubeId || !isPlayableHere(episode) ? (
                <Button asChild variant={primary ? 'default' : 'secondary'} size={compact ? 'sm' : 'default'} className="min-h-11">
                    <Link href={`/episodes/${episode.id}`}>
                        <Play className="h-4 w-4" aria-hidden /> Watch
                    </Link>
                </Button>
            ) : (
                <Button onClick={onPlay} variant={primary ? 'default' : 'secondary'} size={compact ? 'sm' : 'default'} className="min-h-11" aria-label={`${playLabel} ${episode.title}`}>
                    {isCurrent && isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                    {playLabel}
                </Button>
            )}

            {!showQueue ? null : inQueue ? (
                <Button variant="outline" size={compact ? 'sm' : 'default'} className="min-h-11" onClick={() => removeFromQueue(episode.id)} aria-label={`Remove ${episode.title} from Up next`}>
                    <Check className="h-4 w-4" aria-hidden /> In Up next
                </Button>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size={compact ? 'sm' : 'default'} className="min-h-11" aria-label={`Add ${episode.title} to Up next`}>
                            <ListPlus className="h-4 w-4" aria-hidden /> Up next
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => { addToQueue(queueItem, 'next'); toast('Plays next'); }}>Play next</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { addToQueue(queueItem, 'end'); toast('Added to the end of Up next'); }}>Add to the end</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <Button variant="ghost" size={compact ? 'sm' : 'default'} className="min-h-11 text-muted-foreground" onClick={onTogglePlayed}>
                {completed ? <RotateCcw className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                {completed ? 'Mark unplayed' : 'Mark played'}
            </Button>
        </div>
    );
}
