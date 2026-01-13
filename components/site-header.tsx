import { auth } from '@/auth';
import { SiteHeaderClient } from '@/components/site-header-client';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { getEpisodeUsage } from '@/lib/usage';

export async function SiteHeader() {
    const session = await auth();
    const subscriptionPlan = await getUserSubscriptionPlan();
    let usageCount = 0;

    if (session?.user?.id) {
        usageCount = await getEpisodeUsage(session.user.id);
    }

    return <SiteHeaderClient user={session?.user} subscriptionPlan={subscriptionPlan} usageCount={usageCount} />;
}
