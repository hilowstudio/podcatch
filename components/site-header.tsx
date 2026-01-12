import { auth } from '@/auth';
import { SiteHeaderClient } from '@/components/site-header-client';
import { getUserSubscriptionPlan } from '@/lib/subscription';

export async function SiteHeader() {
    const session = await auth();
    const subscriptionPlan = await getUserSubscriptionPlan();

    return <SiteHeaderClient user={session?.user} subscriptionPlan={subscriptionPlan} />;
}
