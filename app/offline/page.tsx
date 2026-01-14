
import { OfflineView } from '@/components/offline-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Offline - Podcatch',
    description: 'You are currently offline.',
};

export default function OfflinePage() {
    return <OfflineView />;
}
