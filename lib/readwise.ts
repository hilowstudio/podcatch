
interface ReadwisePayload {
    url: string;
    html?: string;
    title: string;
    summary?: string;
    author?: string;
    published_date?: string;
    image_url?: string;
    tags?: string[];
}

interface ReadwiseResult {
    success: boolean;
    error?: string;
}

export async function saveToReadwise(apiKey: string, payload: ReadwisePayload): Promise<ReadwiseResult> {
    if (!apiKey) {
        return { success: false, error: 'Missing Readwise API Key' };
    }

    try {
        const response = await fetch('https://readwise.io/api/v3/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `Readwise API error (${response.status}): ${errorText}`
            };
        }

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message || 'Unknown error saving to Readwise' };
    }
}
