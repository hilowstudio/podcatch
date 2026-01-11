import { getFeeds } from '@/actions/feed-actions';
import { FeedGrid } from '@/components/feed-grid';
import { AddFeedDialog } from '@/components/add-feed-dialog';
import { Rss } from 'lucide-react';

export async function FeedList({ userId }: { userId: string }) {
    // usage of userId is deprecated in favor of server-side session check
    const feeds = await getFeeds();

    if (feeds.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <Rss className="h-24 w-24 text-muted-foreground/40 mb-6" />
                <h2 className="text-3xl font-bold tracking-tight mb-2">No feeds yet</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                    Get started by adding your first podcast feed. We'll automatically discover episodes, transcribe them,
                    and extract insights using AI.
                </p>
                <AddFeedDialog />
            </div>
        );
    }

    return <FeedGrid feeds={feeds} />;
}

