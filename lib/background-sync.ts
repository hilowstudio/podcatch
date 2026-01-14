/**
 * Background Sync Queue for Offline-First PWA
 * Queues failed requests and retries when connectivity returns
 */

interface QueuedRequest {
    id: string;
    url: string;
    method: string;
    body?: string;
    headers: Record<string, string>;
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = 'podcatch-sync-queue';
const MAX_RETRIES = 3;

/**
 * Get all queued requests from localStorage
 */
export function getQueuedRequests(): QueuedRequest[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Add a failed request to the sync queue
 */
export function queueRequest(
    url: string,
    method: string,
    body?: unknown,
    headers: Record<string, string> = {}
): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const request: QueuedRequest = {
        id,
        url,
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers,
        timestamp: Date.now(),
        retryCount: 0,
    };

    const queue = getQueuedRequests();
    queue.push(request);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // Register for background sync if available
    registerBackgroundSync();

    return id;
}

/**
 * Remove a request from the queue
 */
export function removeFromQueue(id: string): void {
    const queue = getQueuedRequests().filter(req => req.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Update retry count for a request
 */
function updateRetryCount(id: string): void {
    const queue = getQueuedRequests();
    const updated = queue.map(req =>
        req.id === id ? { ...req, retryCount: req.retryCount + 1 } : req
    );
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

/**
 * Register for background sync with service worker
 */
async function registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-queue');
        } catch (error) {
            console.warn('Background sync registration failed:', error);
        }
    }
}

/**
 * Process all queued requests
 * Called when connectivity is restored
 */
export async function processQueue(): Promise<{ success: number; failed: number }> {
    const queue = getQueuedRequests();
    let success = 0;
    let failed = 0;

    for (const request of queue) {
        if (request.retryCount >= MAX_RETRIES) {
            removeFromQueue(request.id);
            failed++;
            continue;
        }

        try {
            const response = await fetch(request.url, {
                method: request.method,
                headers: request.headers,
                body: request.body,
            });

            if (response.ok) {
                removeFromQueue(request.id);
                success++;
            } else {
                updateRetryCount(request.id);
                failed++;
            }
        } catch (error) {
            updateRetryCount(request.id);
            failed++;
        }
    }

    return { success, failed };
}

/**
 * Hook to listen for online/offline events and process queue
 */
export function setupNetworkListener(): () => void {
    const handleOnline = async () => {
        const result = await processQueue();
        if (result.success > 0) {
            console.log(`Background sync: ${result.success} requests synced`);
        }
    };

    window.addEventListener('online', handleOnline);

    // Process queue on initial load if online
    if (navigator.onLine) {
        processQueue();
    }

    return () => {
        window.removeEventListener('online', handleOnline);
    };
}

/**
 * Wrapper for fetch that queues on failure
 */
export async function resilientFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        // If offline or network error, queue the request
        if (!navigator.onLine) {
            const headers: Record<string, string> = {};
            if (options.headers) {
                const h = options.headers as Record<string, string>;
                Object.keys(h).forEach(key => {
                    headers[key] = h[key];
                });
            }

            queueRequest(
                url,
                options.method || 'GET',
                options.body,
                headers
            );
        }
        throw error;
    }
}
