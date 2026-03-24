import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SettingsNav } from '@/components/settings-nav';

export const metadata = {
    title: 'Settings - Podcatch',
    description: 'Manage your account, integrations, and preferences.',
};

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/signin');

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
            <SettingsNav />
            <div className="mt-8">
                {children}
            </div>
        </div>
    );
}
