'use client';

import { useState, useEffect } from 'react';
import { FeedCard } from '@/components/feed-card';
import { ViewToggle } from '@/components/view-toggle';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface Feed {
    id: string;
    title: string | null;
    image: string | null;
    url: string;
    _count: { episodes: number };
    episodes: { publishedAt: Date | null; status?: string }[];
}

interface FeedGridProps {
    feeds: Feed[];
}

const VIEW_MODE_KEY = 'podcatch-feed-view-mode';

export function FeedGrid({ feeds }: FeedGridProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem(VIEW_MODE_KEY);
        if (saved === 'grid' || saved === 'list') {
            setViewMode(saved);
        }
    }, []);

    // Save preference when changed
    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem(VIEW_MODE_KEY, mode);
    };

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                    {feeds.length} {feeds.length === 1 ? 'feed' : 'feeds'} • Automated intelligence extraction
                </p>
                <ViewToggle value={viewMode} onChange={handleViewChange} />
            </div>
            <div className={cn(
                viewMode === 'grid'
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-3"
            )}>
                {feeds.map((feed) => (
                    <FeedCard
                        key={feed.id}
                        id={feed.id}
                        title={feed.title}
                        image={feed.image}
                        url={feed.url}
                        episodeCount={feed._count.episodes}
                        lastEpisodeDate={feed.episodes[0]?.publishedAt || null}
                        lastEpisodeStatus={feed.episodes[0]?.status || null}
                        variant={viewMode}
                    />
                ))}
            </div>
        </>
    );
}
