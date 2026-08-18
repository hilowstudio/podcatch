'use server';

import { randomBytes } from 'crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getUserSubscriptionPlan } from '@/lib/subscription';

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
