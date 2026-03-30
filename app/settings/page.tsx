import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/profile/profile-form';
import { ConnectedAccounts } from '@/components/profile/connected-accounts';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { UsageCard } from '@/components/profile/usage-card';
import { DigestSettings } from '@/components/digest-settings';
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
        <div className="grid gap-10">
            <section>
                <UsageCard userId={session.user.id} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Personal Info</h2>
                <ProfileForm user={{ name: user.name, image: user.image }} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
                <p className="text-muted-foreground mb-6">
                    Connect these accounts to sign in securely.
                </p>
                <ConnectedAccounts
                    accounts={user.accounts.map(acc => ({ provider: acc.provider }))}
                />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                <p className="text-muted-foreground mb-6">
                    Get notified when your episodes finish processing.
                </p>
                <NotificationSettings />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Email Digest</h2>
                <p className="text-muted-foreground mb-6">
                    Receive summaries of newly processed episodes.
                </p>
                <DigestSettings initialFrequency={user.digestFrequency || 'NONE'} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Schedule & Quiet Hours</h2>
                <p className="text-muted-foreground mb-6">
                    Set your timezone, preferred digest delivery time, and quiet hours when notifications are queued.
                </p>
                <ScheduleSettings
                    initialTimezone={user.timezone}
                    initialDeliveryTime={user.digestDeliveryTime}
                    initialQuietStart={user.quietHoursStart}
                    initialQuietEnd={user.quietHoursEnd}
                />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Your Data</h2>
                <p className="text-muted-foreground mb-6">
                    Export all your data (subscriptions, episodes, transcripts, insights, collections, prompts) as a JSON file.
                </p>
                <div className="flex items-center gap-3">
                    <DataExportButton />
                    <Link href="/settings/my-data" className="text-sm text-primary hover:underline">
                        View data inventory
                    </Link>
                </div>
            </section>

            <section className="border-t pt-10">
                <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
                <p className="text-muted-foreground mb-6">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                    <DeactivateAccountButton />
                    <DeleteAccountButton />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    <strong>Deactivate:</strong> Pause your account. Data retained, reactivate anytime.
                    <br />
                    <strong>Delete:</strong> Permanent. All data destroyed immediately.
                </p>
            </section>
        </div>
    );
}
