'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// --- Custom Prompts ---

export async function createCustomPrompt(title: string, prompt: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

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

    try {
        // 1. Fetch Prompt and Episode
        const promptData = await prisma.customPrompt.findUnique({
            where: { id: promptId, userId: session.user.id },
        });

        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: { insight: true }
        });

        if (!promptData || !episode) {
            return { success: false, error: 'Resource not found' };
        }

        // 2. Prepare Context (prefer full transcript if available)
        const transcript = episode.insight?.transcript || episode.insight?.summary || 'No transcript available.';

        // 3. Prepare Prompt
        // Replace {{transcript}} if it exists, otherwise append
        let finalPrompt = promptData.prompt;
        if (finalPrompt.includes('{{transcript}}')) {
            finalPrompt = finalPrompt.replace('{{transcript}}', transcript);
        } else {
            finalPrompt = `${finalPrompt}\n\nContext:\n${transcript}`;
        }

        // 4. Inject Brand Voice
        const brandVoice = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { brandVoice: true }
        }).then(u => u?.brandVoice);

        let systemInstruction = "";
        if (brandVoice) {
            systemInstruction = `Use the following Brand Voice/Style Guide for all output:\n${brandVoice}\n\n---\n`;
        }

        // 5. Call AI
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');

        const user = session.user as any;
        const geminiApiKey = user.geminiApiKey || process.env.GEMINI_API_KEY;
        const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
        const model = google('gemini-1.5-pro-latest');

        const { text } = await generateText({
            model,
            system: brandVoice ? brandVoice : undefined,
            prompt: finalPrompt,
        });

        return { success: true, result: text };

    } catch (error) {
        console.error('Run Prompt Failed:', error);
        return { success: false, error: 'AI processing failed' };
    }
}
