import { getBrandVoice } from '@/actions/settings-actions';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ApiKeysForm } from '@/components/settings/api-keys-form';
import { IntegrationsForm } from '@/components/settings/integrations-form';

export const metadata = {
    title: 'Settings - Podcatch',
    description: 'Manage your global preferences.',
};

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/');

    const brandVoice = await getBrandVoice();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

            <div className="space-y-8">
                <section>
                    <BrandVoiceSettings initialVoice={brandVoice} />
                </section>

                <div className="grid gap-8 md:grid-cols-2">
                    <section>
                        <IntegrationsForm />
                    </section>
                    <section>
                        <ApiKeysForm />
                    </section>
                </div>

                {/* Future settings sections can go here */}
            </div>
        </div>
    );
}
