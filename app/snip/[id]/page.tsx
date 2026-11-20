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
        <div>
            <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
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
                        <p className="font-serif text-2xl leading-relaxed sm:text-3xl">{quote}</p>
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
                        <Button asChild variant="outline" className="min-h-11 w-full gap-2">
                            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                                <Youtube className="h-4 w-4" aria-hidden />
                                Watch on YouTube at {fmtStamp(snip.startTime)}
                            </a>
                        </Button>
                    ) : (
                        <SnipPlayer audioUrl={episode.audioUrl} start={snip.startTime} end={snip.endTime} />
                    )}
                </div>

                {/* CTA */}
                <div className="mt-10 rounded-2xl border bg-card p-6 text-center">
                    <h2 className="text-lg font-semibold">Shared from Podcatch</h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Podcatch is a podcast player that transcribes the episodes you choose, so you can search them and keep moments like this one.
                    </p>
                    <Button asChild className="mt-4 min-h-11">
                        <Link href="/auth/signup">Start free</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
