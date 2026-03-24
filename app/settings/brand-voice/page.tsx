import { getBrandVoice } from '@/actions/settings-actions';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GatedFeature } from '@/components/gated-feature';

export default async function SettingsBrandVoicePage() {
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
        <section>
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Brand Voice</h2>
                <p className="text-muted-foreground mt-1">
                    Refine how AI speaks on your behalf.
                </p>
            </div>
            <BrandVoiceSettings initialVoice={brandVoice} />
        </section>
    );
}
