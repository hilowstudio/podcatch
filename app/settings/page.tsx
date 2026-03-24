import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/profile/profile-form';
import { ConnectedAccounts } from '@/components/profile/connected-accounts';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { UsageCard } from '@/components/profile/usage-card';
import { DigestSettings } from '@/components/digest-settings';

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
        </div>
    );
}
