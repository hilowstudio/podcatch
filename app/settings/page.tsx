import { getBrandVoice } from '@/actions/settings-actions';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

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

                {/* Future settings sections can go here */}
            </div>
        </div>
    );
}
