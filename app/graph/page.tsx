import { KnowledgeGraph } from '@/components/knowledge-graph';
import { getGraphData } from '@/actions/graph-actions';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GatedFeature } from '@/components/gated-feature';

export const metadata: Metadata = {
    title: 'Knowledge Graph - Podcatch',
    description: 'Visualize connections across your podcast library.',
};

export default async function GraphPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/signin');

    const [subscription, data] = await Promise.all([
        getUserSubscriptionPlan(),
        getGraphData()
    ]);

    if (!subscription.canUseKnowledgeGraph) {
        return (
            <GatedFeature
                title="Knowledge Graph Locked"
                description="Visualizing your entire library's connections is a powerful tool. Upgrade to Basic or Pro to unlock."
                requiredTier="BASIC"
            />
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] w-full overflow-hidden bg-background relative">
            <KnowledgeGraph initialData={data} />
        </div>
    );
}
