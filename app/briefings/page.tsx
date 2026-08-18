import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getBriefingSettings, listBriefings } from '@/actions/briefing-actions';
import { BriefingsView } from '@/components/briefings-view';

export const metadata: Metadata = {
    title: 'Audio Briefings - Podcatch',
    description: 'Your weekly narrated podcast recap.',
};

export default async function BriefingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/signin');

    const [settings, briefings] = await Promise.all([getBriefingSettings(), listBriefings()]);

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Audio Briefings</h1>
                <p className="mt-1 text-muted-foreground">
                    A narrated recap of your podcast week — in the app, or in your own podcast player.
                </p>
            </div>
            <BriefingsView
                isPro={settings.isPro}
                initialEnabled={settings.enabled}
                initialRssUrl={settings.rssUrl}
                briefings={briefings}
            />
        </div>
    );
}
