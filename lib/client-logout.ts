import { closeOfflineDB } from '@/lib/offline-db';

/**
 * Purge all client-side, user-scoped data on sign-out so nothing bleeds to the
 * next user on a shared device: app localStorage keys (play history, sync queue),
 * the offline IndexedDB (cached transcripts), and the service-worker caches
 * (which NetworkFirst-cache authenticated pages and API responses).
 */
export async function clearClientData(): Promise<void> {
    try {
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith('podcatch')) localStorage.removeItem(key);
        }
    } catch { /* ignore */ }

    try {
        closeOfflineDB();
        indexedDB.deleteDatabase('podcatch-offline');
    } catch { /* ignore */ }

    try {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        }
    } catch { /* ignore */ }
}
