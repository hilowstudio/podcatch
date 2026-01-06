import { getFeeds } from '@/actions/feed-actions';
import { AddFeedDialog } from '@/components/add-feed-dialog';
import { FeedCard } from '@/components/feed-card';
import { UserMenu } from '@/components/auth/user-menu';
import { auth } from '@/auth';
import { Rss } from 'lucide-react';

export default async function Home() {
  const session = await auth();
  const feeds = await getFeeds();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Your Podcasts</h2>
          <AddFeedDialog />
        </div>
        {feeds.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <Rss className="h-24 w-24 text-muted-foreground/40 mb-6" />
            <h2 className="text-3xl font-bold tracking-tight mb-2">No feeds yet</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Get started by adding your first podcast feed. We'll automatically discover episodes, transcribe them,
              and extract insights using AI.
            </p>
            <AddFeedDialog />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {feeds.length} {feeds.length === 1 ? 'feed' : 'feeds'} • Automated intelligence extraction
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {feeds.map((feed) => (
                <FeedCard
                  key={feed.id}
                  id={feed.id}
                  title={feed.title}
                  image={feed.image}
                  url={feed.url}
                  episodeCount={feed._count.episodes}
                  lastEpisodeDate={feed.episodes[0]?.publishedAt || null}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
