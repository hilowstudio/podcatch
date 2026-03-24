'use client';

import { useAudio, PlayHistoryEntry } from '@/components/audio-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export function RecentlyPlayed() {
    const { playHistory, play } = useAudio();

    if (playHistory.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Recently Played</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {playHistory.slice(0, 6).map((entry: PlayHistoryEntry) => (
                    <Card key={entry.episode.id} className="group hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center gap-3">
                            {entry.episode.image && (
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                                    <Image
                                        src={entry.episode.image}
                                        alt=""
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => play(entry.episode)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <PlayCircle className="h-6 w-6 text-white" />
                                    </button>
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <Link href={`/episodes/${entry.episode.id}`} className="text-sm font-medium line-clamp-1 hover:text-primary transition-colors">
                                    {entry.episode.title}
                                </Link>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {entry.episode.feedTitle} &middot; {formatDistanceToNow(entry.playedAt, { addSuffix: true })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
