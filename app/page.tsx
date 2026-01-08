import { AddFeedDialog } from '@/components/add-feed-dialog';
import { auth } from '@/auth';
import { Suspense } from 'react';
import { FeedList } from '@/components/feed-list';
import { FeedListSkeleton } from '@/components/feed-list-skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-center">
            Your Second Brain for Audio.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Please sign in to continue.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="pt-6 space-y-4">
              <p className="italic text-muted-foreground">"If you knew what I used to do just to get half this functionality before, you'd have built this a long time ago. Take my money."</p>
              <p className="font-semibold text-sm">— Reuben C.</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="pt-6 space-y-4">
              <p className="italic text-muted-foreground">"Yeah. This is gonna be a hit."</p>
              <p className="font-semibold text-sm">— James S.</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="pt-6 space-y-4">
              <p className="italic text-muted-foreground">"I can literally stop using like five tools. LOVE THIS."</p>
              <p className="font-semibold text-sm">— Chloe M.</p>
            </CardContent>
          </Card>
        </div>
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
