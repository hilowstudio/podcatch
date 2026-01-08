import { auth } from '@/auth';
import { SiteNavigation } from '@/components/site-navigation';
import { NotificationBell } from '@/components/notification-bell';

export async function SiteHeader() {
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
