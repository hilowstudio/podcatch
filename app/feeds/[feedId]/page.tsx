import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEpisodesByFeed } from '@/actions/episode-actions';
import { prisma } from '@/lib/prisma';
import type { EpisodeStatus } from '@/prisma/generated/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProcessEpisodeButton } from '@/components/process-episode-button';
import { ArrowLeft, Calendar, PlayCircle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PageProps = {
    params: { feedId: string };
};

export default async function FeedPage({ params }: PageProps) {
    const { feedId } = await params;

    // Fetch feed and episodes
    const feed = await prisma.feed.findUnique({
        where: { id: feedId },
    });

    if (!feed) {
        notFound();
    }

    const episodes = await getEpisodesByFeed(feedId);

    const statusConfig: Record<EpisodeStatus, { icon: React.ComponentType<any>; label: string; color: string; animate?: boolean }> = {
        DISCOVERED: { icon: PlayCircle, label: 'Discovered', color: 'bg-blue-500' },
        PROCESSING: { icon: Loader2, label: 'Processing', color: 'bg-yellow-500', animate: true },
        COMPLETED: { icon: CheckCircle2, label: 'Completed', color: 'bg-green-500' },
        FAILED: { icon: AlertCircle, label: 'Failed', color: 'bg-red-500' },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to Feeds
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Feed Header */}
                <div className="mb-8 flex items-start gap-6">
                    {feed.image && (
                        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
                            <Image src={feed.image} alt={feed.title || 'Podcast'} fill className="object-cover" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">{feed.title || 'Untitled Feed'}</h1>
                        <p className="text-muted-foreground">
                            {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
                        </p>
                    </div>
                </div>

                {/* Episodes List */}
                {episodes.length === 0 ? (
                    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                        <PlayCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No episodes discovered yet</h2>
                        <p className="text-muted-foreground">
                            Check back soon! We're monitoring the feed and will process new episodes automatically.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {episodes.map((episode) => {
                            const status = statusConfig[episode.status];
                            const StatusIcon = status.icon;

                            return (
                                <Link key={episode.id} href={`/episodes/${episode.id}`}>
                                    <Card className="group transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                                        {episode.title}
                                                    </CardTitle>
                                                    <CardDescription className="mt-2 flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDistanceToNow(episode.publishedAt, { addSuffix: true })}
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
                                                        <ProcessEpisodeButton episodeId={episode.id} status={episode.status} />
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
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
