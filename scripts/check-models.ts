/**
 * Verifies every model in lib/ai/models.ts is still live.
 *
 * Google retires model IDs on its own schedule, and a retired ID keeps appearing in
 * ListModels while failing at call time — so this calls each one for real, using the
 * same method the app uses for that role. Exits non-zero on any failure.
 *
 *   npx tsx scripts/check-models.ts
 */
import 'dotenv/config';
import { generateObject, generateText, streamText, embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { MODELS, EMBEDDING_DIMENSIONS } from '../lib/ai/models';

if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing');
    process.exit(1);
}

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const failures: string[] = [];

function report(role: string, model: string, ok: boolean, detail: string) {
    console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${role.padEnd(10)} ${model.padEnd(24)} ${detail}`);
    if (!ok) failures.push(`${role} (${model}): ${detail}`);
}

async function check(role: string, model: string, fn: () => Promise<string>) {
    try {
        report(role, model, true, await fn());
    } catch (e: any) {
        report(role, model, false, String(e?.message ?? e).replace(/\s+/g, ' ').slice(0, 100));
    }
}

async function main() {
    console.log('Checking models from lib/ai/models.ts\n');

    // insights: structured output against a schema
    await check('insights', MODELS.insights, async () => {
        const { object } = await generateObject({
            model: google(MODELS.insights),
            schema: z.object({ items: z.array(z.string()).length(3) }),
            messages: [{ role: 'user', content: 'List exactly 3 colors.' }],
        });
        if (object.items.length !== 3) throw new Error(`expected 3 items, got ${object.items.length}`);
        return 'structured output';
    });

    // chat: streaming
    await check('chat', MODELS.chat, async () => {
        const result = streamText({
            model: google(MODELS.chat),
            messages: [{ role: 'user', content: 'Reply with the single word OK' }],
        });
        let text = '';
        for await (const delta of result.textStream) text += delta;
        // A retired model can yield an empty stream rather than throwing.
        if (!text.trim()) throw new Error('empty stream — check the stream for errors');
        return 'streaming';
    });

    // synthesis: plain text generation
    await check('synthesis', MODELS.synthesis, async () => {
        const { text } = await generateText({
            model: google(MODELS.synthesis),
            prompt: 'Reply with the single word OK',
        });
        if (!text.trim()) throw new Error('empty response');
        return 'text generation';
    });

    // embedding: must match the EpisodeEmbedding.vector column width
    await check('embedding', MODELS.embedding, async () => {
        const { embedding } = await embed({
            model: google.textEmbeddingModel(MODELS.embedding),
            value: 'dimension check',
            providerOptions: { google: { outputDimensionality: EMBEDDING_DIMENSIONS } },
        });
        if (embedding.length !== EMBEDDING_DIMENSIONS) {
            throw new Error(`got ${embedding.length} dims, EpisodeEmbedding.vector expects ${EMBEDDING_DIMENSIONS}`);
        }
        return `${embedding.length} dims`;
    });

    if (failures.length) {
        console.error(`\n${failures.length} model check(s) failed:`);
        failures.forEach(f => console.error(`  - ${f}`));
        console.error('\nUpdate lib/ai/models.ts with a current model id.');
        process.exit(1);
    }
    console.log('\nAll models live.');
}

main().catch((e) => {
    console.error('Check failed to run:', e);
    process.exit(1);
});
