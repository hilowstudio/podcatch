
interface WebhookPayload {
    event: string;
    [key: string]: any;
}

interface WebhookResult {
    success: boolean;
    status?: number;
    error?: string;
}

export async function dispatchWebhook(url: string | null | undefined, payload: WebhookPayload): Promise<WebhookResult> {
    if (!url) {
        return { success: false, error: 'No webhook URL configured' };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Podcatch/1.0',
            },
            body: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            return {
                success: false,
                status: response.status,
                error: `Webhook failed with status ${response.status}: ${response.statusText}`
            };
        }

        return { success: true, status: response.status };

    } catch (error: any) {
        return { success: false, error: error.message || 'Unknown error dispatching webhook' };
    }
}
