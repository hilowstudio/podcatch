import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { listSnips } from '@/actions/snip-actions';
import { SnipsList } from '@/components/snips-list';

export const metadata: Metadata = {
    title: 'Highlights - Podcatch',
    description: 'Your saved podcast highlights.',
};

export default async function SnipsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/signin');

    const snips = await listSnips();

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Highlights</h1>
                <p className="mt-1 text-muted-foreground">
                    Moments you saved while listening. Flip one to public to share it with a link.
                </p>
            </div>
            <SnipsList snips={snips} />
        </div>
    );
}
