import { auth } from '@/auth';
import { SiteHeaderClient } from '@/components/site-header-client';

export async function SiteHeader() {
    const session = await auth();

    return <SiteHeaderClient user={session?.user} />;
}
