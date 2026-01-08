import { auth } from '@/auth';
import { SiteNavigation } from '@/components/site-navigation';

export async function SiteHeader() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SiteNavigation user={session?.user} />
        </header>
    );
}
