
import { Client } from '@notionhq/client';

interface NotionPayload {
    pageId: string; // Parent Page ID or Database ID
    title: string;
    url: string;
    summary: string;
    transcript: string;
    keyTakeaways: string[];
    publishedAt: Date;
    feedTitle: string;
}

interface NotionResult {
    success: boolean;
    error?: string;
    url?: string;
}

export async function saveToNotion(accessToken: string, payload: NotionPayload): Promise<NotionResult> {
    if (!accessToken) {
        return { success: false, error: 'Missing Notion Access Token' };
    }

    if (!payload.pageId) {
        return { success: false, error: 'Missing Notion Page/Database ID' };
    }

    const notion = new Client({ auth: accessToken });

    try {
        // Construct the summary blocks
        const children = [
            {
                object: 'block',
                type: 'callout',
                callout: {
                    rich_text: [
                        { type: 'text', text: { content: 'Summary: ' + payload.summary } }
                    ],
                    icon: { emoji: '🎙️' }
                }
            },
            {
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: 'Key Takeaways' } }] }
            },
            ...payload.keyTakeaways.map(t => ({
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                    rich_text: [{ type: 'text', text: { content: t } }]
                }
            })),
            {
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: 'Transcript' } }] }
            },
            // Notion has a block size limit (2000 chars). We need to chunk the transcript.
            ...chunkText(payload.transcript, 2000).map(chunk => ({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: chunk } }]
                }
            }))
        ];

        // determine if parent is a database or page
        // For simplicity, we assume Database because we want to set properties.
        // If it's a Page, we just create a child page.
        // But users usually want a DB entry.
        // Let's try to create a page in the parent.

        const response = await notion.pages.create({
            parent: { database_id: payload.pageId }, // Try Database first
            properties: {
                Name: {
                    title: [
                        { text: { content: payload.title } }
                    ]
                },
                URL: {
                    url: payload.url
                },
                Feed: {
                    rich_text: [
                        { text: { content: payload.feedTitle } }
                    ]
                },
                Published: {
                    date: { start: payload.publishedAt.toISOString() }
                }
            },
            // @ts-ignore
            children: children
        });

        return { success: true, url: (response as any).url };

    } catch (error: any) {
        // If Database ID failed, maybe it's a Page ID?
        // But `properties` schema depends on it being a DB.
        // Handling Page ID as parent requires different "title" structure.
        console.error('Notion API Error:', error);
        return { success: false, error: error.message || 'Unknown error saving to Notion' };
    }
}

function chunkText(text: string, size: number): string[] {
    const numChunks = Math.ceil(text.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = text.substr(o, size);
    }
    return chunks;
}
