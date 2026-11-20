'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Library, Highlighter, Search, MessageCircleQuestion, type LucideIcon } from 'lucide-react';
import { NAV_PLACES, isBareRoute } from '@/lib/nav';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
    '/': Library,
    '/snips': Highlighter,
    '/search': Search,
    '/chat': MessageCircleQuestion,
};

// The phone's bottom bar: the same places as the laptop header, shown only to
// people who are signed in.
export function BottomNav({ signedIn }: { signedIn: boolean }) {
    const pathname = usePathname();
    if (!signedIn || isBareRoute(pathname)) return null;

    return (
        <nav aria-label="Main" className="thumb-zone-nav border-t bg-background/95 backdrop-blur-md md:hidden">
            <div className="grid h-16 grid-cols-4 safe-x">
                {NAV_PLACES.map((place) => {
                    const Icon = ICONS[place.href];
                    const current = place.match(pathname);
                    return (
                        <Link
                            key={place.href}
                            href={place.href}
                            aria-current={current ? 'page' : undefined}
                            className={cn(
                                'flex min-h-11 flex-col items-center justify-center gap-1 text-xs transition-colors',
                                current ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Icon className="size-5" aria-hidden />
                            {place.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
