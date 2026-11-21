import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getNewEpisodes } from '@/actions/player-actions';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { getEpisodeUsage } from '@/lib/usage';
import { UpNextView } from '@/components/up-next-view';

export const metadata: Metadata = { title: 'Up next · Podcatch' };

export default async function UpNextPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/signin');

    const [fresh, plan, used] = await Promise.all([
        getNewEpisodes(),
        getUserSubscriptionPlan(),
        getEpisodeUsage(session.user.id),
    ]);

    return (
        <UpNextView
            newEpisodes={fresh}
            transcriptionsLeft={Math.max(0, plan.maxEpisodesPerMonth - used)}
            transcriptionLimit={plan.maxEpisodesPerMonth}
            planName={plan.name}
        />
    );
}
