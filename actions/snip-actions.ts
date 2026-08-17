'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type WordTimestamp = { word: string; start: number; end: number; speaker?: number };

/**
 * Slice the transcript quote for a time range out of the episode's word-level
 * timestamps. Words are kept when they *overlap* the range at all (a small
 * padding forgives boundary rounding), then joined and tidied so punctuation
 * doesn't float. Returns '' when the episode has no word timings (e.g. some
 * video captions) — the snip still saves, just without a quote.
 */
function extractQuote(words: unknown, start: number, end: number): string {
    if (!Array.isArray(words)) return '';
    const pad = 0.3;
    const picked = (words as WordTimestamp[])
        .filter(w => w && typeof w.start === 'number' && typeof w.word === 'string')
        .filter(w => w.end >= start - pad && w.start <= end + pad)
        .map(w => w.word);
    if (picked.length === 0) return '';
    return picked
        .join(' ')
        .replace(/\s+([.,!?;:’”)])/g, '$1')
        .replace(/([“(‘])\s+/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 2000);
}

export async function createSnip(episodeId: string, startTime: number, endTime?: number, note?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const calculatedStartTime = endTime ? startTime : Math.max(0, Math.floor(startTime) - 30);
        const calculatedEndTime = endTime ? endTime : Math.floor(startTime);
        const finalNote = note || (endTime ? `Clip (${Math.round(calculatedStartTime)}s - ${Math.round(calculatedEndTime)}s)` : '');

        // Pull the transcript quote for this range from the episode's word
        // timestamps, so a shared highlight can show the words, not just the audio.
        const insight = await prisma.insight.findUnique({
            where: { episodeId },
            select: { wordTimestamps: true },
        });
        const content = extractQuote(insight?.wordTimestamps, calculatedStartTime, calculatedEndTime);

        const snip = await prisma.snip.create({
            data: {
                userId: session.user.id,
                episodeId,
                startTime: calculatedStartTime,
                endTime: calculatedEndTime,
                content: content || null,
                note: finalNote,
            },
        });

        revalidatePath(`/episodes/${episodeId}`);
        revalidatePath('/snips');
        return { success: true, snipId: snip.id };
    } catch (error) {
        console.error('Failed to create snip:', error);
        return { success: false, error: 'Failed to save snip' };
    }
}

/** The caller's own highlights, newest first, with the episode/podcast they came from. */
export async function listSnips() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const snips = await prisma.snip.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: {
            id: true,
            startTime: true,
            endTime: true,
            content: true,
            note: true,
            title: true,
            isPublic: true,
            createdAt: true,
            episode: {
                select: {
                    id: true,
                    title: true,
                    audioUrl: true,
                    youtubeId: true,
                    feed: { select: { title: true, image: true } },
                },
            },
        },
    });

    return snips.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
    }));
}

/** Flip a highlight between private and publicly shareable. Owner only. */
export async function toggleSnipPublic(snipId: string, isPublic: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    // extendedWhereUnique: scope the update to the owner so one user can't flip
    // another user's snip public.
    const result = await prisma.snip.updateMany({
        where: { id: snipId, userId: session.user.id },
        data: { isPublic },
    });
    if (result.count === 0) return { success: false, error: 'Not found' };

    revalidatePath('/snips');
    revalidatePath(`/snip/${snipId}`);
    return { success: true, isPublic };
}

export async function deleteSnip(snipId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const result = await prisma.snip.deleteMany({
        where: { id: snipId, userId: session.user.id },
    });
    if (result.count === 0) return { success: false, error: 'Not found' };

    revalidatePath('/snips');
    return { success: true };
}

/**
 * A single highlight for its public share page. UNAUTHENTICATED — returns null
 * unless the snip is explicitly marked public, so private snips never leak via a
 * guessed id. Includes just what the share page and OG card need.
 */
export async function getPublicSnip(snipId: string) {
    const snip = await prisma.snip.findFirst({
        where: { id: snipId, isPublic: true },
        select: {
            id: true,
            startTime: true,
            endTime: true,
            content: true,
            note: true,
            title: true,
            episode: {
                select: {
                    id: true,
                    title: true,
                    audioUrl: true,
                    youtubeId: true,
                    publishedAt: true,
                    feed: { select: { title: true, image: true } },
                },
            },
        },
    });

    if (!snip) return null;
    return {
        ...snip,
        episode: {
            ...snip.episode,
            publishedAt: snip.episode.publishedAt.toISOString(),
        },
    };
}
