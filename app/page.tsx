import { AddFeedDialog } from '@/components/add-feed-dialog';
import { auth } from '@/auth';
import { Suspense } from 'react';
import { FeedList } from '@/components/feed-list';
import { FeedListSkeleton } from '@/components/feed-list-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SiteFooter } from '@/components/site-footer';
import { RecentlyPlayed } from '@/components/recently-played';
import { Search, MessageSquare, Zap, Clock, TrendingDown, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* HERO SECTION */}
        <section className="flex-1 w-full flex flex-col items-center justify-center py-20 md:py-28 px-4 text-center space-y-8 border-b">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Stop guessing why <br />
              <span className="text-primary">your podcasts matter.</span>
            </h1>
            <p className="mx-auto max-w-[640px] text-lg text-muted-foreground md:text-xl leading-relaxed">
              Don't just listen. Capture, search, and chat with your audio library.
              Turn passive hours into actionable knowledge in seconds.
            </p>
          </div>
          <div className="relative h-48 w-48 md:h-64 md:w-64 mx-auto mb-4">
            <Image
              src="/podcatch.png"
              alt="Podcatch Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 min-w-[200px] pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-lg transition-shadow">
                Get Started for Free
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-2 sm:hidden">No credit card required.</p>
          </div>
          <div className="pt-2 hidden sm:block">
            <p className="text-sm text-muted-foreground">Free Forever Plan • No Credit Card • Cancel Anytime</p>
          </div>

        </section>

        {/* AGITATION SECTION */}
        <section className="py-24 bg-muted/30 border-b">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight mb-6">The "Podcast Black Hole"</h2>
            <p className="text-xl text-muted-foreground mb-8">
              You listen to 5 hours of content a week. You hear a brilliant idea.
              Two days later? <span className="font-bold text-foreground">Gone.</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-12">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /> Wasted Time</h3>
                <p className="text-sm text-muted-foreground">Scrubbing through 2-hour episodes trying to find "that one quote."</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><TrendingDown className="h-5 w-5 text-muted-foreground" /> Lost Insights</h3>
                <p className="text-sm text-muted-foreground">Great ideas evaporate before you can write them down.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Lock className="h-5 w-5 text-muted-foreground" /> Siloed Knowledge</h3>
                <p className="text-sm text-muted-foreground">Your notes are trapped in your head, not your workflow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION */}
        <section className="py-24 border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your Second Brain for Audio</h2>
              <p className="text-muted-foreground mt-4 text-lg">We handle the heavy lifting. You get the insights.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="shadow-sm">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Deep Search</h3>
                  <p className="text-muted-foreground max-w-prose">
                    "What did clean code say about functions?"<br />
                    Search every episode you've processed, word for word.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="shadow-sm">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Chat with Audio</h3>
                  <p className="text-muted-foreground max-w-prose">
                    Ask your library questions, on the Pro plan. <br />
                    "Summarize the key takeaways from the last episode." We extract the signal from the noise.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="shadow-sm">
                <CardContent className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Seamless Sync</h3>
                  <p className="text-muted-foreground max-w-prose">
                    Send episode notes to Notion, Readwise or Google Drive.<br />
                    Build your knowledge base automatically while you run, drive, or cook.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Do I need a credit card to start?</AccordionTrigger>
                <AccordionContent>
                  No. You can get started on the Free plan immediately. We only ask for payment when you upgrade to Basic or Pro for higher limits.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I import my existing podcast history?</AccordionTrigger>
                <AccordionContent>
                  Yes. Import an OPML file from any podcast app that exports one, such as Pocket Casts or Overcast.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How accurate are the transcripts?</AccordionTrigger>
                <AccordionContent>
                  Transcripts come from Deepgram's Nova-2 model and are accurate on clear speech. Names and technical terms can still come out wrong, so check a quote against the audio before you use it.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. You can downgrade to the Free plan at any time from your dashboard.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to upgrade your listening?</h3>
              <Link href="/auth/signup">
                <Button size="lg">Get Started Now</Button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Your Podcasts</h2>
          <AddFeedDialog />
        </div>

        <RecentlyPlayed />

        <Suspense fallback={<FeedListSkeleton />}>
          <FeedList userId={session.user.id} />
        </Suspense>
      </main>
    </div>
  );
}
