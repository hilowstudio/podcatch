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

type EpisodeStatus = 'DISCOVERED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

type Episode = {
    id: string;
    title: string;
    description: string | null;
    publishedAt: Date;
    status: EpisodeStatus;
    insight?: { id: string; summary: string } | null;
};

type SortOption = 'newest' | 'oldest' | 'status';

const PAGE_SIZE = 20;

const statusConfig: Record<EpisodeStatus, { icon: React.ComponentType<any>; label: string; color: string; animate?: boolean; order: number }> = {
    PROCESSING: { icon: Loader2, label: 'Processing', color: 'bg-status-warning', animate: true, order: 0 },
    DISCOVERED: { icon: PlayCircle, label: 'Discovered', color: 'bg-status-info', order: 1 },
    FAILED: { icon: AlertCircle, label: 'Failed', color: 'bg-status-danger', order: 2 },
    COMPLETED: { icon: CheckCircle2, label: 'Completed', color: 'bg-status-success', order: 3 },
};

export function FeedEpisodeList({ episodes: initialEpisodes }: { episodes: Episode[] }) {
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
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={sort}
                        onChange={e => { setSort(e.target.value as SortOption); setPage(1); }}
                        className="text-sm border rounded-md px-2 py-1.5 bg-background"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="status">By Status</option>
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
                            <div className="pt-5 flex-shrink-0">
                                {isSelectable ? (
                                    <button
                                        onClick={() => toggleSelect(episode.id)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Square className="h-5 w-5" />
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-5" />
                                )}
                            </div>
                        )}

                        <Link href={`/episodes/${episode.id}`} className="flex-1 min-w-0">
                            <Card className="group transition-all hover:shadow-md cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                                {episode.title}
                                            </CardTitle>
                                            <CardDescription className="mt-2 flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4" />
                                                {formatDistanceToNow(new Date(episode.publishedAt), { addSuffix: true })}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={`flex items-center gap-1 ${status.color} text-white whitespace-nowrap`}
                                            >
                                                <StatusIcon className={`h-3 w-3 ${status.animate ? 'animate-spin' : ''}`} />
                                                {status.label}
                                            </Badge>
                                            {episode.status === 'DISCOVERED' && (
                                                <div onClick={e => e.preventDefault()}>
                                                    <ProcessEpisodeButton episodeId={episode.id} status={episode.status} />
                                                </div>
                                            )}
                                            {episode.status === 'PROCESSING' && (
                                                <EpisodeStatusPoller episodeId={episode.id} initialStatus="PROCESSING" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                {episode.description && episode.status === 'COMPLETED' && (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                                    </CardContent>
                                )}
                            </Card>
                        </Link>
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
