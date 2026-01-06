import { AddFeedDialog } from '@/components/add-feed-dialog';
import { auth } from '@/auth';
import { Suspense } from 'react';
import { FeedList } from '@/components/feed-list';
import { FeedListSkeleton } from '@/components/feed-list-skeleton';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your feeds.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Your Podcasts</h2>
          <AddFeedDialog />
        </div>

        <Suspense fallback={<FeedListSkeleton />}>
          <FeedList userId={session.user.id} />
        </Suspense>
      </main>
    </div>
  );
}
