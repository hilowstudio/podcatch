'use client';

import { usePathname } from 'next/navigation';
import { SiteNavigation } from '@/components/site-navigation';
import { NotificationBell } from '@/components/notification-bell';

interface SiteHeaderClientProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function SiteHeaderClient({ user }: SiteHeaderClientProps) {
    const pathname = usePathname();

    // Hide header on auth pages
    if (pathname.startsWith('/auth')) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between pr-4">
                <SiteNavigation user={user} />
                <NotificationBell />
            </div>
        </header>
    );
}
