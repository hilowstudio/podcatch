'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { MODELS } from '@/lib/ai/models';
import { getUserSubscriptionPlan } from '@/lib/subscription';

// --- Custom Prompts ---

export async function createCustomPrompt(title: string, prompt: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const plan = await getUserSubscriptionPlan();
    if (!plan.canUseCustomPrompts) {
        return { success: false, error: 'Custom prompts require the Pro plan.' };
    }

    try {
        await prisma.customPrompt.create({
            data: {
                userId: session.user.id,
                title,
                prompt,
            },
        });
        revalidatePath('/settings/prompts');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to create prompt' };
    }
}

export async function deleteCustomPrompt(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.customPrompt.delete({
            where: { id, userId: session.user.id },
        });
        revalidatePath('/settings/prompts');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete prompt' };
    }
}

export async function getUserPrompts() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await prisma.customPrompt.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        return [];
    }
}

// --- Run Prompt ---

export async function runCustomPromptOnEpisode(promptId: string, episodeId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Custom prompts are a Pro feature — gate here, not just in the UI.
    const plan = await getUserSubscriptionPlan();
    if (!plan.canUseCustomPrompts) {
        return { success: false, error: 'Custom prompts require the Pro plan.' };
    }

    try {
        // 1. Fetch the prompt (scoped to the caller) and the episode. The episode
        //    lookup is scoped to a feed the caller subscribes to, so a user can
        //    only run a prompt against transcripts they actually have access to —
        //    previously any episode id would return its full transcript.
        const promptData = await prisma.customPrompt.findUnique({
            where: { id: promptId, userId: session.user.id },
        });

        const episode = await prisma.episode.findFirst({
            where: {
                id: episodeId,
                feed: { subscriptions: { some: { userId: session.user.id } } },
            },
            include: { insight: true },
        });

        if (!promptData || !episode) {
            return { success: false, error: 'Resource not found' };
        }

        // 2. Prepare Context (prefer full transcript if available)
        const transcript = episode.insight?.transcript || episode.insight?.summary || 'No transcript available.';

        // 3. Prepare Prompt — replace {{transcript}} if present, otherwise append.
        let finalPrompt = promptData.prompt;
        if (finalPrompt.includes('{{transcript}}')) {
            finalPrompt = finalPrompt.replace('{{transcript}}', transcript);
        } else {
            finalPrompt = `${finalPrompt}\n\nContext:\n${transcript}`;
        }

        // 4. Load the user's own Gemini key and brand voice. The session only
        //    carries the user id, so the key must come from the DB — reading it
        //    off the session always yielded undefined and silently billed the
        //    system key.
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { geminiApiKey: true, brandVoice: true },
        });

        // 5. Call AI
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');

        const geminiApiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;
        const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
        const model = google(MODELS.synthesis);

        const { text } = await generateText({
            model,
            system: user?.brandVoice || undefined,
            prompt: finalPrompt,
        });

        return { success: true, result: text };

    } catch (error) {
        console.error('Run Prompt Failed:', error);
        return { success: false, error: 'AI processing failed' };
    }
}
