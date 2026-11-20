import { KnowledgeGraph } from '@/components/knowledge-graph';
import { getGraphData } from '@/actions/graph-actions';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GatedFeature } from '@/components/gated-feature';
import { LibraryTabs } from '@/components/library-tabs';

export const metadata: Metadata = {
    title: 'Map · Podcatch',
    description: 'Visualize connections across your podcast library.',
};

export default async function GraphPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/signin');

    const [subscription, data] = await Promise.all([
        getUserSubscriptionPlan(),
        getGraphData()
    ]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="mb-4 text-3xl font-bold tracking-tight">Library</h1>
            <LibraryTabs className="mb-4" />
            {subscription.canUseKnowledgeGraph ? (
                <>
                    <p className="mb-4 text-muted-foreground">The people, books and ideas across your episodes, and how they connect.</p>
                    <div className="relative h-[70vh] min-h-[28rem] w-full overflow-hidden rounded-xl border bg-card">
                        <KnowledgeGraph initialData={data} />
                    </div>
                </>
            ) : (
                <GatedFeature
                    title="The map is part of Basic and Pro"
                    description="It shows the people, books and ideas across your episodes and how they connect."
                    requiredTier="BASIC"
                />
            )}
        </div>
    );
}
