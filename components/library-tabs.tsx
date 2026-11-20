'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
    { href: '/', label: 'Shows', match: (p: string) => p === '/' || p.startsWith('/feeds') },
    { href: '/collections', label: 'Collections', match: (p: string) => p.startsWith('/collections') },
    { href: '/graph', label: 'Map', match: (p: string) => p.startsWith('/graph') },
    { href: '/briefings', label: 'Briefings', match: (p: string) => p.startsWith('/briefings') },
];

// The parts of Library, shown under its heading on each of these pages.
export function LibraryTabs({ className }: { className?: string }) {
    const pathname = usePathname();
    return (
        <nav aria-label="Library" className={cn('-mx-1 overflow-x-auto', className)}>
            <ul className="flex min-w-max gap-1 border-b">
                {TABS.map((tab) => {
                    const current = tab.match(pathname);
                    return (
                        <li key={tab.href}>
                            <Link
                                href={tab.href}
                                aria-current={current ? 'page' : undefined}
                                className={cn(
                                    '-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm transition-colors',
                                    current
                                        ? 'border-primary font-semibold text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
