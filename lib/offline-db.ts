import { openDB, IDBPDatabase } from 'idb';

export interface CachedTranscript {
    episodeId: string;
    content: string;
    cachedAt: number;
}

export interface QueuedAction {
    id: string;
    type: 'add_to_collection' | 'process_episode' | 'other';
    payload: Record<string, unknown>;
    createdAt: number;
    retries: number;
}

let dbInstance: IDBPDatabase | null = null;

export async function getOfflineDB() {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB('podcatch-offline', 1, {
        upgrade(db) {
            // Store for cached transcripts
            if (!db.objectStoreNames.contains('transcripts')) {
                db.createObjectStore('transcripts', { keyPath: 'episodeId' });
            }

            // Store for queued actions (pending sync)
            if (!db.objectStoreNames.contains('sync-queue')) {
                const queueStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
                queueStore.createIndex('by-type', 'type');
            }
        },
    });

    return dbInstance;
}

// ========================================
// Transcript Caching
// ========================================

export async function cacheTranscript(episodeId: string, content: string): Promise<void> {
    const db = await getOfflineDB();
    const cached: CachedTranscript = {
        episodeId,
        content,
        cachedAt: Date.now(),
    };
    await db.put('transcripts', cached);
}

export async function getCachedTranscript(episodeId: string): Promise<string | null> {
    const db = await getOfflineDB();
    const cached = await db.get('transcripts', episodeId);
    return cached?.content ?? null;
}

export async function clearCachedTranscript(episodeId: string): Promise<void> {
    const db = await getOfflineDB();
    await db.delete('transcripts', episodeId);
}

// ========================================
// Sync Queue (Pending Actions)
// ========================================

export async function queueAction(
    type: QueuedAction['type'],
    payload: Record<string, unknown>
): Promise<string> {
    const db = await getOfflineDB();
    const action: QueuedAction = {
        id: crypto.randomUUID(),
        type,
        payload,
        createdAt: Date.now(),
        retries: 0,
    };
    await db.add('sync-queue', action);
    return action.id;
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
    const db = await getOfflineDB();
    return db.getAll('sync-queue');
}

export async function getPendingSyncCount(): Promise<number> {
    const db = await getOfflineDB();
    const count = await db.count('sync-queue');
    return count;
}

export async function removeFromQueue(id: string): Promise<void> {
    const db = await getOfflineDB();
    await db.delete('sync-queue', id);
}

export async function incrementRetry(id: string): Promise<void> {
    const db = await getOfflineDB();
    const action = await db.get('sync-queue', id);
    if (action) {
        action.retries += 1;
        await db.put('sync-queue', action);
    }
}
