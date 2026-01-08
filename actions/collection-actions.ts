'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function createCollection(title: string, description?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        const collection = await prisma.collection.create({
            data: {
                userId: session.user.id,
                title,
                description,
            },
        });
        revalidatePath('/collections');
        return { success: true, collection };
    } catch (error) {
        console.error('Error creating collection:', error);
        return { success: false, error: 'Failed to create collection' };
    }
}

export async function getUserCollections() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await prisma.collection.findMany({
            where: { userId: session.user.id },
            include: {
                episodes: {
                    select: { id: true, title: true, feed: { select: { image: true } } },
                },
                _count: {
                    select: { episodes: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });
    } catch (error) {
        return [];
    }
}

export async function getCollection(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        return await prisma.collection.findUnique({
            where: { id, userId: session.user.id },
            include: {
                episodes: {
                    include: {
                        feed: true,
                        insight: { select: { summary: true } }
                    }
                },
                insights: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
    } catch (error) {
        return null;
    }
}

export async function addEpisodeToCollection(collectionId: string, episodeId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.collection.update({
            where: { id: collectionId, userId: session.user.id },
            data: {
                episodes: {
                    connect: { id: episodeId }
                }
            }
        });
        revalidatePath(`/collections/${collectionId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to add episode' };
    }
}

export async function removeEpisodeFromCollection(collectionId: string, episodeId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.collection.update({
            where: { id: collectionId, userId: session.user.id },
            data: {
                episodes: {
                    disconnect: { id: episodeId }
                }
            }
        });
        revalidatePath(`/collections/${collectionId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to remove episode' };
    }
}

export async function deleteCollection(collectionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await prisma.collection.delete({
            where: { id: collectionId, userId: session.user.id },
        });
        revalidatePath('/collections');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete collection' };
    }
}

export async function synthesizeCollection(collectionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        // 1. Fetch episodes
        const collection = await prisma.collection.findUnique({
            where: { id: collectionId, userId: session.user.id },
            include: {
                episodes: {
                    include: {
                        insight: true
                    }
                }
            }
        });

        if (!collection || collection.episodes.length < 2) {
            return { success: false, error: 'Not enough episodes to synthesize' };
        }

        // 2. Prepare Context (Summaries & Takeaways)
        // We avoid full transcripts to save context window, unless necessary.
        const context = collection.episodes.map(ep => {
            return `
Title: ${ep.title}
Summary: ${ep.insight?.summary || 'N/A'}
Key Takeaways: ${(ep.insight?.keyTakeaways as string[])?.join('\n') || 'N/A'}
            `.trim();
        }).join('\n\n---\n\n');

        // 3. Call AI
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');

        // Use user's key or system key
        const user = session.user as any;
        const geminiApiKey = user.geminiApiKey || process.env.GEMINI_API_KEY;
        const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
        const model = google('gemini-1.5-pro-latest');

        const prompt = `
You are an expert researcher and synthesizer. 
Analyze the following summaries from a collection of podcast episodes titled "${collection.title}".

Your goal is to create a "Meta-Synthesis" that compares and contrasts the viewpoints, identifies recurring themes, and synthesizes a master-level understanding of the topic.

Structure your response in Markdown:
# Synthesis: ${collection.title}

## Executive Summary
(High-level overview of the common thread)

## Core Themes
(Identify 3-5 major themes discussed across these episodes)

## Points of Agreement vs. Disagreement
(Where do the speakers align? Where do they differ?)

## Actionable Conclusion
(What is the ultimate takeaway from this collection?)

---
Episode Context:
${context}
        `;

        const { text } = await generateText({
            model,
            prompt,
        });

        // 4. Save Result
        await prisma.collectionInsight.create({
            data: {
                collectionId: collection.id,
                synthesis: text,
            }
        });

        revalidatePath(`/collections/${collectionId}`);
        return { success: true };

    } catch (error) {
        console.error('Synthesis failed:', error);
        return { success: false, error: 'Failed to synthesize' };
    }
}
