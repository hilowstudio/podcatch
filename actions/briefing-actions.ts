'use server';

import { randomBytes } from 'crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { isTtsConfigured } from '@/lib/tts';
import { isR2Configured } from '@/lib/r2';
import { generateBriefingForUser } from '@/lib/briefings/generate';

const ONDEMAND_MIN_HOURS = 20; // one on-demand briefing per ~day, to bound TTS cost
const ONDEMAND_LOOKBACK_DAYS = 30; // wider window than the weekly cron so a manual run finds content

function appUrl(): string {
    return (process.env.NEXTAUTH_URL || 'https://www.podcatch.app').replace(/\/$/, '');
}

function rssUrlFor(token: string): string {
    return `${appUrl()}/api/briefings/rss?token=${token}`;
}

/** Mint a private-feed token if the user doesn't have one yet. Returns the token. */
async function ensureToken(userId: string): Promise<string> {
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { apiToken: true } });
    if (existing?.apiToken) return existing.apiToken;
    const token = randomBytes(24).toString('base64url');
    await prisma.user.update({ where: { id: userId }, data: { apiToken: token } });
    return token;
}

export interface BriefingSettings {
    enabled: boolean;
    isPro: boolean;
    rssUrl: string | null;
}

export async function getBriefingSettings(): Promise<BriefingSettings> {
    const session = await auth();
    if (!session?.user?.id) return { enabled: false, isPro: false, rssUrl: null };

    const [user, plan] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id }, select: { briefingEnabled: true, apiToken: true } }),
        getUserSubscriptionPlan(),
    ]);

    return {
        enabled: !!user?.briefingEnabled,
        isPro: plan.name === 'Pro',
        rssUrl: user?.apiToken ? rssUrlFor(user.apiToken) : null,
    };
}

export async function setBriefingEnabled(enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false as const, error: 'Unauthorized' };

    const plan = await getUserSubscriptionPlan();
    if (enabled && plan.name !== 'Pro') {
        return { success: false as const, error: 'Audio briefings are a Pro feature.' };
    }

    // Turning it on mints the feed token so the private RSS URL is ready immediately.
    let rssUrl: string | null = null;
    if (enabled) {
        const token = await ensureToken(session.user.id);
        rssUrl = rssUrlFor(token);
    }
    await prisma.user.update({ where: { id: session.user.id }, data: { briefingEnabled: enabled } });

    revalidatePath('/briefings');
    revalidatePath('/settings');
    return { success: true as const, rssUrl };
}

/** Rotate the private-feed token (invalidates the old RSS URL). */
export async function regenerateFeedToken() {
    const session = await auth();
    if (!session?.user?.id) return { success: false as const, error: 'Unauthorized' };

    const token = randomBytes(24).toString('base64url');
    await prisma.user.update({ where: { id: session.user.id }, data: { apiToken: token } });
    revalidatePath('/briefings');
    return { success: true as const, rssUrl: rssUrlFor(token) };
}

/** Generate a briefing on demand (the "Generate now" button). Pro-only, rate-limited. */
export async function generateBriefingNow(): Promise<{ success: true } | { success: false; error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const plan = await getUserSubscriptionPlan();
    if (plan.name !== 'Pro') return { success: false, error: 'Audio briefings are a Pro feature.' };

    if (!isTtsConfigured() || !isR2Configured()) {
        return { success: false, error: 'Briefings aren’t configured yet. Try again once setup is complete.' };
    }

    // Rate limit: no more than one on-demand briefing per ~day.
    const recent = await prisma.briefing.findFirst({
        where: { userId: session.user.id, createdAt: { gte: new Date(Date.now() - ONDEMAND_MIN_HOURS * 3_600_000) } },
        select: { id: true },
    });
    if (recent) {
        return { success: false, error: 'You already generated a briefing recently — try again tomorrow.' };
    }

    try {
        const since = new Date(Date.now() - ONDEMAND_LOOKBACK_DAYS * 86_400_000);
        const result = await generateBriefingForUser(session.user.id, since);
        if (!result.built) {
            const msg = result.reason === 'no-content'
                ? 'No recent episodes or highlights to brief on yet. Process an episode first.'
                : 'Couldn’t generate a briefing right now. Please try again.';
            return { success: false, error: msg };
        }
        revalidatePath('/briefings');
        return { success: true };
    } catch (error) {
        console.error('generateBriefingNow failed:', error);
        return { success: false, error: 'Briefing generation failed. Please try again.' };
    }
}

export async function listBriefings() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const briefings = await prisma.briefing.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 52,
        select: { id: true, audioUrl: true, durationSec: true, createdAt: true },
    });
    return briefings.map(b => ({ ...b, createdAt: b.createdAt.toISOString() }));
}
