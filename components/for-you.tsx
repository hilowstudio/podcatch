import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { getRecommendations } from '@/actions/recommendation-actions';

/**
 * "For You" rail — the user's nightly-computed recommendations from within their
 * own subscriptions. Renders nothing until there are picks (new users, or users
 * with no highlights yet, simply don't see it), so the dashboard stays clean.
 */
export async function ForYou() {
    const recs = await getRecommendations(6);
    if (recs.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">For You</h3>
                <span className="text-sm text-muted-foreground">· picks from your library, matched to what you save</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recs.map(ep => (
                    <Link
                        key={ep.id}
                        href={`/episodes/${ep.id}`}
                        className="group flex gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary/50"
                    >
                        {ep.feedImage ? (
                            <Image
                                src={ep.feedImage}
                                alt=""
                                width={56}
                                height={56}
                                className="h-14 w-14 flex-none rounded-md object-cover"
                            />
                        ) : (
                            <div className="h-14 w-14 flex-none rounded-md bg-muted" />
                        )}
                        <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">{ep.title}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{ep.feedTitle}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
