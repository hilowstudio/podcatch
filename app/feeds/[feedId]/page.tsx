import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getEpisodesByFeed } from '@/actions/episode-actions';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
import { FeedEpisodeList } from '@/components/feed-episode-list';
import { ShowSpeed } from '@/components/show-speed';
import { auth } from '@/auth';

type PageProps = {
    params: Promise<{ feedId: string }>;
};

export default async function FeedPage({ params }: PageProps) {
    const { feedId } = await params;

    const feed = await prisma.feed.findUnique({
        where: { id: feedId },
    });

    if (!feed) {
        notFound();
    }

    const [episodes, session] = await Promise.all([getEpisodesByFeed(feedId), auth()]);
    const subscribed = session?.user?.id
        ? !!(await prisma.subscription.findUnique({ where: { userId_feedId: { userId: session.user.id, feedId } }, select: { id: true } }))
        : false;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <Link href="/" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Library
            </Link>

            <div className="mb-8 flex flex-wrap items-start gap-6">
                {feed.image && (
                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border">
                        <Image src={feed.image} alt="" fill className="object-cover" />
                    </div>
                )}
                <div className="min-w-0 flex-1 space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{feed.title || 'Untitled show'}</h1>
                    <p className="text-muted-foreground">
                        {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
                    </p>
                    {subscribed && <ShowSpeed feedId={feed.id} feedTitle={feed.title} />}
                </div>
            </div>

            <FeedEpisodeList episodes={episodes} feed={{ id: feed.id, title: feed.title, image: feed.image }} />
        </div>
    );
}
