import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getBriefingSettings, listBriefings } from '@/actions/briefing-actions';
import { BriefingsView } from '@/components/briefings-view';
import { LibraryTabs } from '@/components/library-tabs';

export const metadata: Metadata = {
    title: 'Briefings · Podcatch',
    description: 'Your weekly narrated podcast recap.',
};

export default async function BriefingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/signin');

    const [settings, briefings] = await Promise.all([getBriefingSettings(), listBriefings()]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="mb-4 text-3xl font-bold tracking-tight">Library</h1>
            <LibraryTabs className="mb-4" />
            <div className="max-w-2xl">
                <p className="mb-6 text-muted-foreground">
                    A narrated recap of your week’s episodes, here or in another podcast app.
                </p>
                <BriefingsView
                    isPro={settings.isPro}
                    initialEnabled={settings.enabled}
                    initialRssUrl={settings.rssUrl}
                    briefings={briefings}
                />
            </div>
        </div>
    );
}
