'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Library, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    matchPaths?: string[];
}

const navItems: NavItem[] = [
    {
        href: '/',
        icon: Home,
        label: 'Home',
        matchPaths: ['/feeds', '/episodes']
    },
    {
        href: '/search',
        icon: Search,
        label: 'Search'
    },
    {
        href: '/chat',
        icon: Sparkles,
        label: 'Chat'
    },
    {
        href: '/collections',
        icon: Library,
        label: 'Library'
    },
    {
        href: '/profile',
        icon: User,
        label: 'Profile'
    },
];

export function BottomNav() {
    const pathname = usePathname();

    // Don't show on auth pages or public pages
    if (
        pathname.startsWith('/auth') ||
        pathname === '/' ||
        pathname.startsWith('/share') ||
        pathname.startsWith('/pricing') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/privacy')
    ) {
        return null;
    }

    const isActive = (item: NavItem) => {
        if (pathname === item.href) return true;
        if (item.matchPaths?.some(path => pathname.startsWith(path))) return true;
        return false;
    };

    return (
        <nav
            className="thumb-zone-nav md:hidden bg-background/95 backdrop-blur-md border-t"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center justify-around h-16 safe-x">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center touch-target gap-1 transition-colors",
                                "text-muted-foreground hover:text-foreground",
                                active && "text-primary"
                            )}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
