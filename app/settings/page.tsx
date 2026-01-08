import { getBrandVoice } from '@/actions/settings-actions';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ApiKeysForm } from '@/components/settings/api-keys-form';
import { IntegrationsForm } from '@/components/settings/integrations-form';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Settings - Podcatch',
    description: 'Manage your global preferences.',
};

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/');

    const [brandVoice, user] = await Promise.all([
        getBrandVoice(),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                webhookUrl: true,
                readwiseApiKey: true,
                notionAccessToken: true,
                notionPageId: true,
                googleDriveRefreshToken: true,
                openaiApiKey: true,
            }
        })
    ]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

            <div className="space-y-8">
                <section>
                    <BrandVoiceSettings initialVoice={brandVoice} />
                </section>

                <div className="grid gap-8 md:grid-cols-2">
                    <section>
                        <IntegrationsForm
                            initialWebhookUrl={user?.webhookUrl}
                            initialReadwiseApiKey={user?.readwiseApiKey}
                            initialNotionAccessToken={user?.notionAccessToken}
                            initialNotionPageId={user?.notionPageId}
                            isGoogleDriveConnected={!!user?.googleDriveRefreshToken}
                        />
                    </section>
                    <section>
                        <ApiKeysForm initialOpenaiApiKey={user?.openaiApiKey} />
                    </section>
                </div>

                {/* Future settings sections can go here */}
            </div>
        </div>
    );
}
