import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ApiKeysForm } from '@/components/settings/api-keys-form';
import { GeminiKeyForm } from '@/components/settings/gemini-key-form';
import { ClaudeProjectsForm } from '@/components/settings/claude-projects-form';
import {
    ReadwiseCard,
    NotionCard,
    GoogleDriveCard,
    WebhookCard,
    TanaCard,
    LogseqCard
} from '@/components/settings/integrations-form';
import { prisma } from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GatedFeature } from '@/components/gated-feature';

export default async function SettingsIntegrationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/');

    const [user, subscription] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                webhookUrl: true,
                readwiseApiKey: true,
                notionAccessToken: true,
                notionPageId: true,
                googleDriveRefreshToken: true,
                tanaApiToken: true,
                logseqGraphName: true,
                openaiApiKey: true,
                geminiApiKey: true,
                claudeApiKey: true,
                claudeProjectId: true,
                autoSyncToClaude: true,
            }
        }),
        getUserSubscriptionPlan()
    ]);

    if (!subscription.canUseIntegrations) {
        return (
            <GatedFeature
                title="Integrations Locked"
                description="Connect your knowledge base and AI models. Upgrade to Basic or Pro to unlock."
                requiredTier="BASIC"
            />
        );
    }

    return (
        <div className="space-y-10">
            {/* AI & Models */}
            <section>
                <h2 className="text-xl font-semibold mb-4">AI Brain & Models</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <ClaudeProjectsForm
                        userId={session.user.id}
                        initialSettings={{
                            claudeApiKey: user?.claudeApiKey || '',
                            claudeProjectId: user?.claudeProjectId || '',
                            autoSyncToClaude: user?.autoSyncToClaude || false
                        }}
                    />
                    <ApiKeysForm initialOpenaiApiKey={user?.openaiApiKey} />
                    <GeminiKeyForm initialGeminiApiKey={user?.geminiApiKey} />
                </div>
            </section>

            {/* Knowledge Base Connections */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Knowledge Base</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <ReadwiseCard initialValue={user?.readwiseApiKey} />
                    <NotionCard
                        initialToken={user?.notionAccessToken}
                        initialPageId={user?.notionPageId}
                    />
                    <GoogleDriveCard
                        isConnected={!!user?.googleDriveRefreshToken}
                    />
                    <TanaCard initialValue={user?.tanaApiToken} />
                    <LogseqCard initialValue={user?.logseqGraphName} />
                </div>
            </section>

            {/* Developer / Webhooks */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Developer & Automation</h2>
                <div className="max-w-xl">
                    <WebhookCard initialValue={user?.webhookUrl} />
                </div>
            </section>
        </div>
    );
}
