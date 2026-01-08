import { getBrandVoice } from '@/actions/settings-actions';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata = {
    title: 'Brand Voice - Podcatch',
    description: 'Define your persona and style for AI content.',
};

export default async function BrandVoicePage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/');

    const brandVoice = await getBrandVoice();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Brand Voice</h1>
                <p className="text-muted-foreground mt-2">
                    Refine how AI speaks on your behalf.
                </p>
            </div>

            <section>
                <BrandVoiceSettings initialVoice={brandVoice} />
            </section>
        </div>
    );
}
