import { auth } from '@/auth';
import { headers } from 'next/headers';
import { SiteNavigation } from '@/components/site-navigation';
import { NotificationBell } from '@/components/notification-bell';

export async function SiteHeader() {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';

    // Hide header on auth pages
    if (pathname.startsWith('/auth')) {
        return null;
    }

    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between pr-4">
                <SiteNavigation user={session?.user} />
                <NotificationBell />
            </div>
        </header>
    );
}

