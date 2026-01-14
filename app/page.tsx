import { AddFeedDialog } from '@/components/add-feed-dialog';
import { auth } from '@/auth';
import { Suspense } from 'react';
import { FeedList } from '@/components/feed-list';
import { FeedListSkeleton } from '@/components/feed-list-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SiteFooter } from '@/components/site-footer';
import { Check, Search, MessageSquare, Zap, PlayCircle, Star } from 'lucide-react';
import { IntegrationsCarousel } from '@/components/landing/integrations-carousel';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* HERO SECTION */}
        <section className="flex-1 w-full flex flex-col items-center justify-center py-20 md:py-32 px-4 text-center space-y-8 bg-gradient-to-b from-background via-muted/20 to-background border-b">
          <div className="space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              Now with Claude & Notion Integration
            </Badge>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Stop guessing why <br />
              <span className="text-primary">your podcasts matter.</span>
            </h1>
            <p className="mx-auto max-w-[800px] text-xl text-muted-foreground md:text-2xl leading-relaxed">
              Don't just listen. Capture, search, and chat with your audio library.
              Turn passive hours into actionable knowledge in seconds.
            </p>
          </div>
          <div className="relative h-64 w-64 md:h-80 md:w-80 mx-auto mb-8">
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
              <Button size="lg" className="h-12 px-8 text-lg shadow-lg hover:shadow-primary/20 transition-all">
                Get Started for Free
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-2 sm:hidden">No credit card required.</p>
          </div>
          <div className="pt-2 hidden sm:block">
            <p className="text-sm text-muted-foreground">Free Forever Plan • No Credit Card • Cancel Anytime</p>
          </div>

          {/* Hero Visual Mockup */}
          <div className="mt-12 relative w-full max-w-5xl mx-auto rounded-xl border bg-card text-card-foreground shadow-2xl overflow-hidden aspect-[16/9] hidden md:flex items-center justify-center bg-muted/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <PlayCircle className="h-12 w-12 opacity-50" />
              <span className="text-lg">Interactive Demo Replay</span>
            </p>
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
                <h3 className="font-semibold text-lg">⚠️ Wasted Time</h3>
                <p className="text-sm text-muted-foreground">Scrubbing through 2-hour episodes trying to find "that one quote."</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">📉 Lost Insights</h3>
                <p className="text-sm text-muted-foreground">Great ideas evaporate before you can write them down.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">🔒 Siloed Knowledge</h3>
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

            <div className="grid md:grid-cols-3 gap-12">
              {/* Feature 1 */}
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Deep Search</h3>
                  <p className="text-muted-foreground">
                    "What did clean code say about functions?"<br />
                    Search across your entire listening history instantly. We transcribe everything.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Chat with Audio</h3>
                  <p className="text-muted-foreground">
                    Ask questions to your library. <br />
                    "Summarize the key takeaways from the last episode." We extract the signal from the noise.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Seamless Sync</h3>
                  <p className="text-muted-foreground">
                    Push highlights to Notion, Obsidian, or Readwise.<br />
                    Build your knowledge base automatically while you run, drive, or cook.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* INTEGRATIONS CAROUSEL */}
        <IntegrationsCarousel />

        {/* SOCIAL PROOF */}
        <section className="py-24 bg-muted/50 border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">Loved by Builders & Learners</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-background border-none shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="text-sm text-foreground">"If you knew what I used to do just to get half this functionality before, you'd have built this a long time ago. Take my money."</p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                    <div className="text-xs">
                      <p className="font-semibold">Reuben C.</p>
                      <p className="text-muted-foreground">Product Manager</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-none shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="text-sm text-foreground">"I can literally stop using like five tools. The AI summaries are actually good, which is rare."</p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                    <div className="text-xs">
                      <p className="font-semibold">Chloe M.</p>
                      <p className="text-muted-foreground">Researcher</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-none shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="text-sm text-foreground">"Finally, a way to 'read' my podcasts. The search functionality is insane."</p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                    <div className="text-xs">
                      <p className="font-semibold">James S.</p>
                      <p className="text-muted-foreground">Developer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">PROCESSED OVER 10,000 HOURS OF AUDIO</p>
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
                  Yes! You can import via OPML file from Apple Podcasts, Spotify, or Pocket Casts.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How accurate are the transcripts?</AccordionTrigger>
                <AccordionContent>
                  We use state-of-the-art models (Deepgram Nova-2) which achieve near-human accuracy. For technical terminology, you can provide custom vocabulary hints in the Pro plan.
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
