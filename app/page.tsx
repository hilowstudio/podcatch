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
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <section className="flex-1 w-full flex flex-col items-center justify-center py-12 md:py-24 lg:py-32 xl:py-48 px-4 text-center space-y-8 bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Your Second Brain <span className="text-primary block sm:inline">for Audio.</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Turn your podcasts and videos into searchable knowledge. Sync transcripts, AI summaries, and insights directly to your workspace.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
            <a href="/auth/signin">
              <div className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Get Started for Free
              </div>
            </a>
            <a href="/pricing">
              <div className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                View Pricing
              </div>
            </a>
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-background/60 backdrop-blur-sm border-muted shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <p className="italic text-muted-foreground">"If you knew what I used to do just to get half this functionality before, you'd have built this a long time ago. Take my money."</p>
                  <p className="font-semibold text-sm">— Reuben C.</p>
                </CardContent>
              </Card>

              <Card className="bg-background/60 backdrop-blur-sm border-muted shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <p className="italic text-muted-foreground">"Yeah. This is gonna be a hit."</p>
                  <p className="font-semibold text-sm">— James S.</p>
                </CardContent>
              </Card>

              <Card className="bg-background/60 backdrop-blur-sm border-muted shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <p className="italic text-muted-foreground">"I can literally stop using like five tools. LOVE THIS."</p>
                  <p className="font-semibold text-sm">— Chloe M.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
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
