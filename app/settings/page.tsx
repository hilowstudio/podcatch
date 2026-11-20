import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/profile/profile-form';
import { ConnectedAccounts } from '@/components/profile/connected-accounts';
import { UsageCard } from '@/components/profile/usage-card';
import { ThemeChoiceSetting } from '@/components/theme-choice';
import { DigestSettings } from '@/components/digest-settings';
import { LanguageSettings } from '@/components/language-settings';
import { ScheduleSettings } from '@/components/schedule-settings';
import { DataExportButton } from '@/components/data-export-button';
import { DeleteAccountButton } from '@/components/delete-account-button';
import { DeactivateAccountButton } from '@/components/deactivate-account-button';
import Link from 'next/link';

export default async function SettingsAccountPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            accounts: true,
        },
    });

    if (!user) {
        redirect('/auth/signin');
    }

    return (
        <div className="grid grid-cols-1 gap-10">
            <section>
                <UsageCard userId={session.user.id} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                <ThemeChoiceSetting />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Profile</h2>
                <ProfileForm user={{ name: user.name, image: user.image }} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Sign-in accounts</h2>
                <p className="text-muted-foreground mb-6">
                    Accounts you can use to sign in to Podcatch.
                </p>
                <ConnectedAccounts
                    accounts={user.accounts.map(acc => ({ provider: acc.provider }))}
                />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Language</h2>
                <p className="text-muted-foreground mb-6">
                    Summaries and chat replies come back in this language.
                </p>
                <LanguageSettings initialLanguage={user.preferredLanguage} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Email</h2>
                <p className="text-muted-foreground mb-6">
                    Off unless you turn it on. A summary of the episodes you processed, sent at the time you choose.
                </p>
                <div className="space-y-6">
                    <DigestSettings initialFrequency={user.digestFrequency || 'NONE'} initialRewindEnabled={user.rewindEnabled} />
                    <ScheduleSettings
                        initialTimezone={user.timezone}
                        initialDeliveryTime={user.digestDeliveryTime}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Your data</h2>
                <p className="text-muted-foreground mb-6">
                    Download everything you’ve added and made here (subscriptions, episodes, transcripts, summaries, highlights, collections, prompts) as one JSON file.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <DataExportButton />
                    <Link href="/settings/my-data" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">
                        View data inventory
                    </Link>
                </div>
            </section>

            <section className="border-t pt-10">
                <h2 className="text-xl font-semibold mb-4">Pause or delete your account</h2>
                <p className="text-muted-foreground mb-6">
                    Pausing keeps everything and you can come back by signing in. Deleting removes your account and everything in it, cancels any paid plan, and can’t be undone.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <DeactivateAccountButton />
                    <DeleteAccountButton />
                </div>
            </section>
        </div>
    );
}
