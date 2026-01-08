import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ApiKeysForm } from '@/components/settings/api-keys-form';
import { ClaudeProjectsForm } from '@/components/settings/claude-projects-form';
import {
    ReadwiseCard,
    NotionCard,
    GoogleDriveCard,
    WebhookCard
} from '@/components/settings/integrations-form';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Integrations - Podcatch',
    description: 'Manage your connected services and API keys.',
};

export default async function IntegrationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/');

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            webhookUrl: true,
            readwiseApiKey: true,
            notionAccessToken: true,
            notionPageId: true,
            googleDriveRefreshToken: true,
            openaiApiKey: true,
            claudeApiKey: true,
            claudeProjectId: true,
            autoSyncToClaude: true,
        }
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Integrations</h1>

            <div className="space-y-8">
                <div className="space-y-10">
                    {/* 1. AI & Models */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 p-1 rounded">🧠</span> AI Brain & Models
                        </h2>
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
                        </div>
                    </section>

                    {/* 2. Knowledge Base Connections */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-700 p-1 rounded">📚</span> Knowledge Base
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <ReadwiseCard initialValue={user?.readwiseApiKey} />
                            <NotionCard
                                initialToken={user?.notionAccessToken}
                                initialPageId={user?.notionPageId}
                            />
                            <GoogleDriveCard
                                isConnected={!!user?.googleDriveRefreshToken}
                            />
                        </div>
                    </section>

                    {/* 3. Developer / Webhooks */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-700 p-1 rounded">⚙️</span> Developer & Automation
                        </h2>
                        <div className="max-w-xl">
                            <WebhookCard initialValue={user?.webhookUrl} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
