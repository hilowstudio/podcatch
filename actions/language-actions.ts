'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { MODELS } from '@/lib/ai/models';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { languageName, isTranslatable, LANGUAGES } from '@/lib/languages';

export async function setPreferredLanguage(code: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    // Only accept codes we actually offer; 'en' clears back to the default.
    const valid = code === 'en' || LANGUAGES.some(l => l.code === code);
    if (!valid) return { success: false, error: 'Unsupported language' };

    await prisma.user.update({
        where: { id: session.user.id },
        data: { preferredLanguage: code === 'en' ? null : code },
    });
    revalidatePath('/settings');
    return { success: true };
}

export async function getPreferredLanguage(): Promise<string | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferredLanguage: true },
    });
    return user?.preferredLanguage ?? null;
}

type Translated = { summary: string; keyTakeaways: string[] };

/**
 * Translate an episode's summary + key takeaways into `langCode` on demand.
 * Cached in Insight.translations keyed by language — because the translation of a
 * given summary is viewer-independent, the cache is safely shared across users
 * (unlike the funding-sensitive insight generation, which stays English/shared).
 * Paid plans only.
 */
export async function translateEpisode(
    episodeId: string,
    langCode: string,
): Promise<{ success: true; translation: Translated } | { success: false; error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const targetName = languageName(langCode);
    if (!isTranslatable(langCode) || !targetName) {
        return { success: false, error: 'Unsupported language' };
    }

    const plan = await getUserSubscriptionPlan();
    if (plan.name === 'Free') {
        return { success: false, error: 'Translation is available on Basic and Pro plans.' };
    }

    // Scope to the caller's own subscribed, completed episode.
    const episode = await prisma.episode.findFirst({
        where: {
            id: episodeId,
            status: 'COMPLETED',
            feed: { subscriptions: { some: { userId: session.user.id } } },
        },
        select: {
            insight: { select: { id: true, summary: true, keyTakeaways: true, translations: true } },
        },
    });
    const insight = episode?.insight;
    if (!insight) return { success: false, error: 'Not found' };

    // Serve from cache when present.
    const cache = (insight.translations as Record<string, Translated> | null) ?? {};
    if (cache[langCode]) {
        return { success: true, translation: cache[langCode] };
    }

    try {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateObject } = await import('ai');
        const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

        const takeaways = (insight.keyTakeaways as string[]) || [];
        const { object } = await generateObject({
            model: google(MODELS.chat),
            schema: z.object({
                summary: z.string(),
                keyTakeaways: z.array(z.string()),
            }),
            prompt:
                `Translate the following podcast summary and key takeaways into ${targetName}. ` +
                `Preserve meaning, tone, names, and any technical terms. Return the same number of takeaways.\n\n` +
                `SUMMARY:\n${insight.summary}\n\n` +
                `KEY TAKEAWAYS:\n${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
            maxOutputTokens: 4096,
        });

        const translation: Translated = {
            summary: object.summary,
            keyTakeaways: object.keyTakeaways,
        };

        // Merge into the shared cache.
        await prisma.insight.update({
            where: { id: insight.id },
            data: { translations: { ...cache, [langCode]: translation } },
        });

        return { success: true, translation };
    } catch (error) {
        console.error('translateEpisode failed:', error);
        return { success: false, error: 'Translation failed. Please try again.' };
    }
}
