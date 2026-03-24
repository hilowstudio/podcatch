'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPublicPrompts(category?: string) {
    const where: any = { isPublic: true };
    if (category) where.category = category;

    return prisma.customPrompt.findMany({
        where,
        orderBy: { useCount: 'desc' },
        include: {
            user: {
                select: { name: true, image: true },
            },
        },
        take: 50,
    });
}

export async function clonePrompt(promptId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const source = await prisma.customPrompt.findUnique({
        where: { id: promptId, isPublic: true },
    });

    if (!source) {
        return { success: false, error: 'Prompt not found' };
    }

    await prisma.$transaction([
        prisma.customPrompt.create({
            data: {
                userId: session.user.id,
                title: source.title,
                prompt: source.prompt,
                category: source.category,
            },
        }),
        prisma.customPrompt.update({
            where: { id: promptId },
            data: { useCount: { increment: 1 } },
        }),
    ]);

    revalidatePath('/prompts');
    revalidatePath('/settings/prompts');
    return { success: true };
}

export async function togglePromptVisibility(promptId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const prompt = await prisma.customPrompt.findUnique({
        where: { id: promptId, userId: session.user.id },
    });

    if (!prompt) {
        return { success: false, error: 'Prompt not found' };
    }

    await prisma.customPrompt.update({
        where: { id: promptId },
        data: { isPublic: !prompt.isPublic },
    });

    revalidatePath('/prompts');
    revalidatePath('/settings/prompts');
    return { success: true, isPublic: !prompt.isPublic };
}
