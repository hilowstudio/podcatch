import { prisma } from '@/lib/prisma';
import { languageName } from '@/lib/languages';
import { isTtsConfigured, textToMp3 } from '@/lib/tts';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { MODELS } from '@/lib/ai/models';

const MAX_SCRIPT_EPISODES = 12;

export type BriefingResult =
    | { built: true; briefingId: string; durationSec: number }
    | { built: false; reason: 'not-configured' | 'no-user' | 'no-content' | 'empty-script' };

/**
 * Core briefing generation for one user, shared by the weekly cron and the
 * on-demand "Generate now" action: gather the window's episode summaries +
 * saved highlights → Gemini script (localized) → TTS → MP3 → R2 → record + meter.
 * Callers own their own eligibility/idempotency/rate-limit checks.
 */
export async function generateBriefingForUser(userId: string, since: Date): Promise<BriefingResult> {
    if (!isTtsConfigured() || !isR2Configured()) return { built: false, reason: 'not-configured' };

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredLanguage: true } });
    if (!user) return { built: false, reason: 'no-user' };

    const [episodes, snips] = await Promise.all([
        prisma.episode.findMany({
            where: {
                status: 'COMPLETED',
                updatedAt: { gte: since },
                insight: { isNot: null },
                feed: { subscriptions: { some: { userId } } },
            },
            orderBy: { publishedAt: 'desc' },
            take: MAX_SCRIPT_EPISODES,
            select: { title: true, feed: { select: { title: true } }, insight: { select: { summary: true } } },
        }),
        prisma.snip.findMany({
            where: { userId, content: { not: null }, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { content: true },
        }),
    ]);

    if (episodes.length === 0 && snips.length === 0) return { built: false, reason: 'no-content' };

    const material = [
        ...episodes.map(e => `• ${e.feed.title} — ${e.title}\n${e.insight?.summary ?? ''}`),
        ...(snips.length ? [`Highlights the listener saved:\n${snips.map(s => `- "${s.content}"`).join('\n')}`] : []),
    ].join('\n\n');

    const langName = languageName(user.preferredLanguage);
    const langLine = langName ? `Write the script in ${langName}.` : '';

    // 1. Draft the spoken script.
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
    const { generateText } = await import('ai');
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    const { text: script } = await generateText({
        model: google(MODELS.synthesis),
        prompt:
            `You are the host of a personal weekly audio briefing for one listener, recapping their podcast week. ` +
            `Using the material below, write a warm, natural spoken-word script of about 450–650 words. ` +
            `Open with a brief friendly greeting, weave the episodes into 2–4 themes rather than listing them, ` +
            `mention a saved highlight if relevant, and close with a short sign-off. ` +
            `Plain spoken prose only — no headings, no markdown, no stage directions, no speaker labels. ${langLine}\n\n` +
            `MATERIAL:\n${material}`,
        // gemini-3.1-pro is a thinking model — reasoning tokens share this budget,
        // so it must be generous or the visible script gets cut off mid-sentence
        // (a 2048 cap yielded ~70 words). The insights pipeline uses 16384 for the
        // same reason; 8192 is ample for a ~650-word script plus thinking.
        maxOutputTokens: 8192,
    });
    if (!script.trim()) return { built: false, reason: 'empty-script' };

    // 2. Narrate → MP3, 3. store on R2.
    const { mp3, durationSec } = await textToMp3(script);
    const key = `briefings/${userId}/${Date.now()}.mp3`;
    const audioUrl = await uploadToR2(key, mp3, 'audio/mpeg');

    // 4. Record + meter + mark, atomically.
    const [briefing] = await prisma.$transaction([
        prisma.briefing.create({ data: { userId, audioUrl, script, durationSec } }),
        prisma.usageLog.create({ data: { userId, action: 'BRIEFING', targetId: null } }),
        prisma.user.update({ where: { id: userId }, data: { lastBriefingAt: new Date() } }),
    ]);

    return { built: true, briefingId: briefing.id, durationSec };
}
