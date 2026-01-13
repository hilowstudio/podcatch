import { getBrandVoice } from '@/actions/settings-actions';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GatedFeature } from '@/components/gated-feature';

export const metadata = {
    title: 'Brand Voice - Podcatch',
    description: 'Define your persona and style for AI content.',
};

export default async function BrandVoicePage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/');

    const [brandVoice, subscription] = await Promise.all([
        getBrandVoice(),
        getUserSubscriptionPlan()
    ]);

    if (!subscription.canUseBrandVoice) {
        return (
            <GatedFeature
                title="Brand Voice Locked"
                description="Teach AI to speak in your unique style. Upgrade to Basic or Pro to unlock."
                requiredTier="BASIC"
            />
        );
    }

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
