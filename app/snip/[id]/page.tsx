import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicSnip } from '@/actions/snip-actions';
import { SnipPlayer } from '@/components/snip-player';
import { Button } from '@/components/ui/button';
import { Quote, Youtube } from 'lucide-react';

type PageProps = { params: Promise<{ id: string }> };

function fmtStamp(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const snip = await getPublicSnip(id);
    if (!snip) return { title: 'Highlight Not Found' };

    const quote = snip.content?.slice(0, 200) || snip.note || 'A podcast highlight';
    const title = snip.title || `Highlight from ${snip.episode.title}`;
    return {
        title: `${title} — Podcatch`,
        description: quote,
        openGraph: {
            title,
            description: quote,
            type: 'article',
        },
        twitter: { card: 'summary_large_image', title, description: quote },
    };
}

export default async function SnipPage({ params }: PageProps) {
    const { id } = await params;
    const snip = await getPublicSnip(id);
    if (!snip) notFound();

    const { episode } = snip;
    const quote = snip.content?.trim();
    const youtubeUrl = episode.youtubeId
        ? `https://www.youtube.com/watch?v=${episode.youtubeId}&t=${Math.floor(snip.startTime)}s`
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <header className="border-b bg-background/95 backdrop-blur">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">P</div>
                        Podcatch
                    </Link>
                    <Link href="/">
                        <Button variant="outline" size="sm">Create your own</Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto max-w-2xl px-4 py-10 sm:py-16">
                {/* Provenance */}
                <div className="mb-6 flex items-center gap-3">
                    {episode.feed.image && (
                        <Image
                            src={episode.feed.image}
                            alt={episode.feed.title || 'Podcast'}
                            width={48}
                            height={48}
                            className="h-12 w-12 flex-none rounded-md object-cover shadow-sm"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{episode.feed.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{episode.title}</p>
                    </div>
                </div>

                {/* The quote */}
                <blockquote className="relative rounded-2xl border-2 bg-card p-6 shadow-sm sm:p-8">
                    <Quote className="mb-3 h-7 w-7 text-primary/40" aria-hidden />
                    {quote ? (
                        <p className="text-xl font-medium leading-relaxed sm:text-2xl">{quote}</p>
                    ) : (
                        <p className="text-lg italic text-muted-foreground">{snip.note || 'A highlighted moment.'}</p>
                    )}
                    <div className="mt-5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-2 py-0.5">{fmtStamp(snip.startTime)}</span>
                        <span>–</span>
                        <span className="rounded bg-muted px-2 py-0.5">{fmtStamp(snip.endTime)}</span>
                    </div>
                </blockquote>

                {/* Playback */}
                <div className="mt-6">
                    {youtubeUrl ? (
                        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full gap-2">
                                <Youtube className="h-4 w-4" />
                                Watch on YouTube at {fmtStamp(snip.startTime)}
                            </Button>
                        </a>
                    ) : (
                        <SnipPlayer audioUrl={episode.audioUrl} start={snip.startTime} end={snip.endTime} />
                    )}
                </div>

                {/* CTA */}
                <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                    <h2 className="text-lg font-bold">Turn your podcasts into a searchable second brain</h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Podcatch transcribes every episode, surfaces the moments that matter, and lets you save and share highlights like this one.
                    </p>
                    <Link href="/" className="mt-4 inline-block">
                        <Button>Get started free</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
