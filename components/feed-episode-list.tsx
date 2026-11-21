'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProcessEpisodeButton } from '@/components/process-episode-button';
import { EpisodeStatusPoller } from '@/components/episode-status-poller';
import {
    Calendar, PlayCircle, CheckCircle2, Loader2, AlertCircle,
    ArrowUpDown, ChevronDown, Square, CheckSquare, Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { processEpisodeAction } from '@/actions/process-episode-action';
import { toast } from 'sonner';
import { EpisodeActions } from '@/components/episode-actions';
import { leftLabel, statusWords } from '@/lib/player/format';

type EpisodeStatus = 'DISCOVERED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

type Episode = {
    id: string;
    title: string;
    description: string | null;
    publishedAt: Date;
    status: EpisodeStatus;
    audioUrl: string;
    youtubeId: string | null;
    positionSec?: number;
    durationSec?: number | null;
    completed?: boolean;
    insight?: { id: string; summary: string } | null;
};

type FeedInfo = { id: string; title: string | null; image: string | null };

type SortOption = 'newest' | 'oldest' | 'status';

const PAGE_SIZE = 20;

const statusConfig: Record<EpisodeStatus, { icon: React.ComponentType<any>; label: string; color: string; animate?: boolean; order: number }> = {
    PROCESSING: { icon: Loader2, label: 'Transcribing', color: '', animate: true, order: 0 },
    DISCOVERED: { icon: PlayCircle, label: 'Not transcribed', color: '', order: 1 },
    FAILED: { icon: AlertCircle, label: 'Couldn’t be transcribed', color: '', order: 2 },
    COMPLETED: { icon: CheckCircle2, label: 'Transcribed', color: '', order: 3 },
};

export function FeedEpisodeList({ episodes: initialEpisodes, feed }: { episodes: Episode[]; feed: FeedInfo }) {
    const [sort, setSort] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isBulkProcessing, startBulkTransition] = useTransition();

    const sorted = useMemo(() => {
        const copy = [...initialEpisodes];
        switch (sort) {
            case 'newest':
                return copy.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            case 'oldest':
                return copy.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
            case 'status':
                return copy.sort((a, b) => statusConfig[a.status].order - statusConfig[b.status].order);
        }
    }, [initialEpisodes, sort]);

    const paginated = sorted.slice(0, page * PAGE_SIZE);
    const hasMore = paginated.length < sorted.length;

    const discoveredEpisodes = initialEpisodes.filter(e => e.status === 'DISCOVERED');
    const selectableIds = discoveredEpisodes.map(e => e.id);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === selectableIds.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(selectableIds));
        }
    };

    const handleBulkProcess = () => {
        if (selected.size === 0) return;
        startBulkTransition(async () => {
            let succeeded = 0;
            let failed = 0;
            let limitHit = false;

            for (const episodeId of selected) {
                if (limitHit) break;
                const formData = new FormData();
                formData.append('episodeId', episodeId);
                const result = await processEpisodeAction(formData);

                if (result.success) {
                    succeeded++;
                } else if (result.upgradeRequired) {
                    limitHit = true;
                } else {
                    failed++;
                }
            }

            if (succeeded > 0) {
                toast.success(`Queued ${succeeded} episode${succeeded !== 1 ? 's' : ''} for processing`);
            }
            if (limitHit) {
                toast.error('Monthly limit reached. Upgrade for more episodes.');
            }
            if (failed > 0) {
                toast.error(`${failed} episode${failed !== 1 ? 's' : ''} failed to queue`);
            }

            setSelected(new Set());
        });
    };

    if (initialEpisodes.length === 0) {
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <PlayCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No episodes discovered yet</h2>
                <p className="text-muted-foreground">
                    Check back soon! We're monitoring the feed and will process new episodes automatically.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Sort */}
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <label htmlFor="episode-sort" className="sr-only">Sort episodes</label>
                    <select
                        id="episode-sort"
                        value={sort}
                        onChange={e => { setSort(e.target.value as SortOption); setPage(1); }}
                        className="min-h-11 text-sm border rounded-md px-2 bg-background"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="status">By status</option>
                    </select>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Bulk select controls */}
                {discoveredEpisodes.length > 0 && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectAll}
                            className="gap-2"
                        >
                            {selected.size === selectableIds.length && selectableIds.length > 0 ? (
                                <CheckSquare className="h-4 w-4" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                            {selected.size === selectableIds.length && selectableIds.length > 0
                                ? 'Deselect All'
                                : `Select All Unprocessed (${discoveredEpisodes.length})`}
                        </Button>

                        {selected.size > 0 && (
                            <Button
                                size="sm"
                                onClick={handleBulkProcess}
                                disabled={isBulkProcessing}
                                className="gap-2"
                            >
                                {isBulkProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Zap className="h-4 w-4" />
                                )}
                                Process {selected.size} Episode{selected.size !== 1 ? 's' : ''}
                            </Button>
                        )}
                    </>
                )}

                <span className="ml-auto text-sm text-muted-foreground">
                    {initialEpisodes.length} episode{initialEpisodes.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Episode List */}
            {paginated.map(episode => {
                const status = statusConfig[episode.status];
                const StatusIcon = status.icon;
                const isSelectable = episode.status === 'DISCOVERED';
                const isSelected = selected.has(episode.id);

                return (
                    <div key={episode.id} className="flex items-start gap-3">
                        {/* Checkbox for selectable episodes */}
                        {discoveredEpisodes.length > 0 && (
                            <div className="pt-3 flex-shrink-0">
                                {isSelectable ? (
                                    <button
                                        onClick={() => toggleSelect(episode.id)}
                                        aria-label={`Select ${episode.title}`}
                                        aria-pressed={isSelected}
                                        className="grid size-11 place-items-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Square className="h-5 w-5" />
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-11" />
                                )}
                            </div>
                        )}

                        <Card className="min-w-0 flex-1">
                            <CardHeader>
                                <CardTitle className="line-clamp-2 leading-snug">
                                    <Link href={`/episodes/${episode.id}`} className="-my-2.5 inline-flex min-h-11 items-center hover:underline">{episode.title}</Link>
                                </CardTitle>
                                <CardDescription
                                    className={`mt-1 flex flex-wrap items-center gap-x-2 text-sm ${episode.status === 'FAILED' ? 'text-destructive' : ''}`}
                                    role={episode.status === 'PROCESSING' ? 'status' : undefined}
                                >
                                    <span>{formatDistanceToNow(new Date(episode.publishedAt), { addSuffix: true })}</span>
                                    <span aria-hidden>·</span>
                                    <span className="inline-flex items-center gap-1">
                                        <StatusIcon className={`h-3.5 w-3.5 ${status.animate ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
                                        {statusWords(episode.status)}
                                    </span>
                                    {leftLabel(episode.positionSec ?? 0, episode.durationSec) && !episode.completed && (
                                        <><span aria-hidden>·</span><span>{leftLabel(episode.positionSec ?? 0, episode.durationSec)}</span></>
                                    )}
                                    {episode.completed && <><span aria-hidden>·</span><span>played</span></>}
                                </CardDescription>
                                {episode.status === 'PROCESSING' && (
                                    <EpisodeStatusPoller episodeId={episode.id} initialStatus="PROCESSING" />
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {episode.description && episode.status === 'COMPLETED' && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    <EpisodeActions
                                        compact
                                        episode={{ ...episode, feedId: feed.id, feedTitle: feed.title, image: feed.image }}
                                    />
                                    {(episode.status === 'DISCOVERED' || episode.status === 'FAILED') && (
                                        <ProcessEpisodeButton episodeId={episode.id} status={episode.status} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}

            {/* Load More */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        className="gap-2"
                    >
                        <ChevronDown className="h-4 w-4" />
                        Load More ({sorted.length - paginated.length} remaining)
                    </Button>
                </div>
            )}
        </div>
    );
}
