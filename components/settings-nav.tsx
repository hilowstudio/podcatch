'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Plug, Sparkles, Mic } from 'lucide-react';

const tabs = [
    { label: 'Account', href: '/settings', icon: User },
    { label: 'Integrations', href: '/settings/integrations', icon: Plug },
    { label: 'Prompts', href: '/settings/prompts', icon: Sparkles },
    { label: 'Brand Voice', href: '/settings/brand-voice', icon: Mic },
];

export function SettingsNav() {
    const pathname = usePathname();

    return (
        <nav className="flex gap-1 border-b overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = tab.href === '/settings'
                    ? pathname === '/settings'
                    : pathname.startsWith(tab.href);
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                            isActive
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
