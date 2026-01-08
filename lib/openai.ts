
import OpenAI from 'openai';

interface SyncToOpenAIParams {
    apiKey: string;
    assistantId?: string; // Optional: If user already has one, we can use it (or update it)
    vectorStoreId?: string; // Optional: If user already has one
    transcript: string;
    title: string;
    episodeId: string;
}

interface SyncResult {
    success: boolean;
    assistantId?: string;
    vectorStoreId?: string;
    error?: string;
}

export async function syncToOpenAI({
    apiKey,
    assistantId,
    vectorStoreId,
    transcript,
    title,
    episodeId
}: SyncToOpenAIParams): Promise<SyncResult> {
    try {
        const openai = new OpenAI({ apiKey });
        const beta = openai.beta as any;

        // 1. Ensure Vector Store Exists
        let storeId = vectorStoreId;
        if (!storeId) {
            console.log('Creating new OpenAI Vector Store...');
            const store = await beta.vectorStores.create({
                name: "Podcatch Library",
            });
            storeId = store.id;
        }

        // 2. Create/Upload File
        // OpenAI requires a file object (fs.createReadStream) or strictly a File-like object.
        // Since we have string content (transcript), we need to create a File object.
        // In Node environment, we can use the `toFile` helper from openai or just pass a Buffer with name.

        const fileContent = Buffer.from(transcript, 'utf-8');
        const file = await openai.files.create({
            file: await OpenAI.toFile(fileContent, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`),
            purpose: 'assistants',
        });

        // 3. Add to Vector Store
        console.log(`Adding file ${file.id} to Vector Store ${storeId}...`);
        await beta.vectorStores.files.create(storeId, {
            file_id: file.id
        });

        // 4. Ensure Assistant Exists and is linked to Store
        let assistant_id = assistantId;
        if (!assistant_id) {
            console.log('Creating new OpenAI Assistant...');
            const assistant = await beta.assistants.create({
                name: "Podcatch Assistant",
                instructions: "You are a podcast expert. You have access to a library of podcast transcripts. Answer questions based on the provided files.",
                model: "gpt-4o",
                tools: [{ type: "file_search" }],
                tool_resources: {
                    file_search: {
                        vector_store_ids: [storeId]
                    }
                }
            });
            assistant_id = assistant.id;
        } else {
            // Optional: Update logic
        }

        return {
            success: true,
            assistantId: assistant_id,
            vectorStoreId: storeId
        };

    } catch (error) {
        console.error('OpenAI Sync Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
