import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEpisodesByFeed } from '@/actions/episode-actions';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
import { FeedEpisodeList } from '@/components/feed-episode-list';

type PageProps = {
    params: { feedId: string };
};

export default async function FeedPage({ params }: PageProps) {
    const { feedId } = await params;

    const feed = await prisma.feed.findUnique({
        where: { id: feedId },
    });

    if (!feed) {
        notFound();
    }

    const episodes = await getEpisodesByFeed(feedId);

    return (
        <div className="min-h-screen">
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

                <FeedEpisodeList episodes={episodes} />
            </main>
        </div>
    );
}
