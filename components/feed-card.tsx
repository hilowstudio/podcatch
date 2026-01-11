'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileAudio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DeleteFeedButton } from '@/components/delete-feed-button';
import { cn } from '@/lib/utils';

type FeedCardProps = {
    id: string;
    title: string | null;
    image: string | null;
    url: string;
    episodeCount: number;
    lastEpisodeDate: Date | null;
    variant?: 'grid' | 'list';
};

export function FeedCard({ id, title, image, episodeCount, lastEpisodeDate, variant = 'grid' }: FeedCardProps) {
    if (variant === 'list') {
        return (
            <Card className="group overflow-hidden transition-all hover:shadow-lg">
                <Link href={`/feeds/${id}`} className="flex items-center gap-4 p-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {image ? (
                            <Image
                                src={image}
                                alt={title || 'Podcast'}
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <FileAudio className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-base truncate flex-1">
                                {title || 'Untitled Feed'}
                            </h3>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                                className="flex-shrink-0"
                            >
                                <DeleteFeedButton feedId={id} feedTitle={title || 'Untitled Feed'} />
                            </div>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <FileAudio className="h-4 w-4" />
                                {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                            </span>
                            {lastEpisodeDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDistanceToNow(lastEpisodeDate, { addSuffix: true })}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            </Card>
        );
    }

    // Grid variant (default)
    return (
        <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
            <Link href={`/feeds/${id}`} className="block">
                <CardHeader className="p-0">
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                        {image ? (
                            <Image
                                src={image}
                                alt={title || 'Podcast'}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <FileAudio className="h-16 w-16 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-lg flex-1">
                            {title || 'Untitled Feed'}
                        </CardTitle>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                            className="flex-shrink-0"
                        >
                            <DeleteFeedButton feedId={id} feedTitle={title || 'Untitled Feed'} />
                        </div>
                    </div>
                    <CardDescription className="mt-2 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                            <FileAudio className="h-4 w-4" />
                            {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                        </span>
                        {lastEpisodeDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(lastEpisodeDate, { addSuffix: true })}
                            </span>
                        )}
                    </CardDescription>
                </CardContent>
            </Link>
        </Card>
    );
}

