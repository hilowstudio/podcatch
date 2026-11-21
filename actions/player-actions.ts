'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { moveUpdates, positionAtEnd, positionNext, SKIP_CHOICES, SPEEDS } from '@/lib/player/logic';

// Listening is free and unlimited on every plan (Adam, 2026-11-20): nothing
// here checks a plan or counts usage. Only transcription is metered.

async function userId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
}

export type PlayerEpisode = {
    id: string;
    title: string;
    audioUrl: string;
    youtubeId: string | null;
    status: string;
    publishedAt: string;
    feedId: string;
    feedTitle: string | null;
    image: string | null;
    positionSec: number;
    durationSec: number | null;
    completed: boolean;
};

const episodeSelect = {
    id: true,
    title: true,
    audioUrl: true,
    youtubeId: true,
    status: true,
    publishedAt: true,
    feedId: true,
    feed: { select: { title: true, image: true } },
} as const;

type EpisodeRow = {
    id: string; title: string; audioUrl: string; youtubeId: string | null; status: string;
    publishedAt: Date; feedId: string; feed: { title: string | null; image: string | null };
};

function toPlayerEpisode(e: EpisodeRow, state?: { positionSec: number; durationSec: number | null; completedAt: Date | null } | null): PlayerEpisode {
    return {
        id: e.id,
        title: e.title,
        audioUrl: e.audioUrl,
        youtubeId: e.youtubeId,
        status: e.status,
        publishedAt: e.publishedAt.toISOString(),
        feedId: e.feedId,
        feedTitle: e.feed.title,
        image: e.feed.image,
        positionSec: state?.positionSec ?? 0,
        durationSec: state?.durationSec ?? null,
        completed: !!state?.completedAt,
    };
}

// ---------------------------------------------------------------- preferences

export type PlayerPrefs = {
    skipBackSec: number;
    skipForwardSec: number;
    continuousPlay: boolean;
    showSpeeds: Record<string, number>;
};

export async function getPlayerPrefs(): Promise<PlayerPrefs | null> {
    const id = await userId();
    if (!id) return null;
    const [user, subs] = await Promise.all([
        prisma.user.findUnique({ where: { id }, select: { skipBackSec: true, skipForwardSec: true, continuousPlay: true } }),
        prisma.subscription.findMany({ where: { userId: id, playbackRate: { not: null } }, select: { feedId: true, playbackRate: true } }),
    ]);
    if (!user) return null;
    return {
        ...user,
        showSpeeds: Object.fromEntries(subs.map((s) => [s.feedId, s.playbackRate as number])),
    };
}

export async function updatePlayerPrefs(prefs: Partial<Pick<PlayerPrefs, 'skipBackSec' | 'skipForwardSec' | 'continuousPlay'>>) {
    const id = await userId();
    if (!id) return { success: false as const };
    const data: Partial<Pick<PlayerPrefs, 'skipBackSec' | 'skipForwardSec' | 'continuousPlay'>> = {};
    if (prefs.skipBackSec !== undefined && (SKIP_CHOICES as readonly number[]).includes(prefs.skipBackSec)) data.skipBackSec = prefs.skipBackSec;
    if (prefs.skipForwardSec !== undefined && (SKIP_CHOICES as readonly number[]).includes(prefs.skipForwardSec)) data.skipForwardSec = prefs.skipForwardSec;
    if (typeof prefs.continuousPlay === 'boolean') data.continuousPlay = prefs.continuousPlay;
    await prisma.user.update({ where: { id }, data });
    return { success: true as const };
}

/** Per-show speed. `rate` null clears it, so the show uses the last speed. */
export async function setShowSpeed(feedId: string, rate: number | null) {
    const id = await userId();
    if (!id) return { success: false as const };
    if (rate !== null && !(SPEEDS as readonly number[]).includes(rate)) return { success: false as const };
    await prisma.subscription.updateMany({ where: { userId: id, feedId }, data: { playbackRate: rate } });
    return { success: true as const };
}

// ---------------------------------------------------------------- position

/** Saved by the player every few seconds while it plays, and on pause. */
export async function savePlayback(episodeId: string, positionSec: number, durationSec: number | null, finished = false) {
    const id = await userId();
    if (!id) return { success: false as const };
    if (!Number.isFinite(positionSec) || positionSec < 0) return { success: false as const };
    const duration = durationSec && Number.isFinite(durationSec) && durationSec > 0 ? durationSec : null;
    await prisma.playbackState.upsert({
        where: { userId_episodeId: { userId: id, episodeId } },
        create: { userId: id, episodeId, positionSec, durationSec: duration, completedAt: finished ? new Date() : null },
        update: {
            positionSec,
            ...(duration ? { durationSec: duration } : {}),
            ...(finished ? { completedAt: new Date() } : {}),
        },
    });
    if (finished) await prisma.queueItem.deleteMany({ where: { userId: id, episodeId } });
    return { success: true as const };
}

export async function setPlayed(episodeId: string, played: boolean) {
    const id = await userId();
    if (!id) return { success: false as const };
    await prisma.playbackState.upsert({
        where: { userId_episodeId: { userId: id, episodeId } },
        create: { userId: id, episodeId, positionSec: 0, completedAt: played ? new Date() : null },
        update: played ? { completedAt: new Date() } : { completedAt: null, positionSec: 0 },
    });
    if (played) await prisma.queueItem.deleteMany({ where: { userId: id, episodeId } });
    return { success: true as const };
}

export async function getPlayback(episodeId: string) {
    const id = await userId();
    if (!id) return null;
    const s = await prisma.playbackState.findUnique({
        where: { userId_episodeId: { userId: id, episodeId } },
        select: { positionSec: true, durationSec: true, completedAt: true },
    });
    return s ? { positionSec: s.positionSec, durationSec: s.durationSec, completed: !!s.completedAt } : null;
}

// ---------------------------------------------------------------- Up next

export async function getQueue(): Promise<PlayerEpisode[]> {
    const id = await userId();
    if (!id) return [];
    const items = await prisma.queueItem.findMany({
        where: { userId: id },
        orderBy: { position: 'asc' },
        select: { episode: { select: { ...episodeSelect, playbackStates: { where: { userId: id }, select: { positionSec: true, durationSec: true, completedAt: true } } } } },
    });
    return items.map(({ episode }) => toPlayerEpisode(episode, episode.playbackStates[0]));
}

export async function addToQueue(episodeId: string, where: 'next' | 'end', currentEpisodeId?: string | null) {
    const id = await userId();
    if (!id) return { success: false as const };
    const existing = await prisma.queueItem.findMany({ where: { userId: id }, select: { episodeId: true, position: true } });
    const others = existing.filter((q) => q.episodeId !== episodeId);
    const position = where === 'next' ? positionNext(others, currentEpisodeId) : positionAtEnd(others);
    await prisma.queueItem.upsert({
        where: { userId_episodeId: { userId: id, episodeId } },
        create: { userId: id, episodeId, position },
        update: { position },
    });
    return { success: true as const };
}

export async function removeFromQueue(episodeId: string) {
    const id = await userId();
    if (!id) return { success: false as const };
    await prisma.queueItem.deleteMany({ where: { userId: id, episodeId } });
    return { success: true as const };
}

export async function moveInQueue(episodeId: string, direction: 'up' | 'down') {
    const id = await userId();
    if (!id) return { success: false as const };
    const queue = await prisma.queueItem.findMany({ where: { userId: id }, select: { episodeId: true, position: true } });
    const updates = moveUpdates(queue, episodeId, direction);
    await prisma.$transaction(
        updates.map((u) => prisma.queueItem.update({ where: { userId_episodeId: { userId: id, episodeId: u.episodeId } }, data: { position: u.position } })),
    );
    return { success: true as const };
}

export async function clearQueue() {
    const id = await userId();
    if (!id) return { success: false as const };
    await prisma.queueItem.deleteMany({ where: { userId: id } });
    return { success: true as const };
}

// ---------------------------------------------------------------- new episodes

const NEW_WINDOW_DAYS = 14;
const NEW_LIMIT = 30;

/**
 * New from your shows: episodes from the last two weeks that the person
 * hasn't finished and hasn't queued. A finite list, newest first.
 */
export async function getNewEpisodes(): Promise<PlayerEpisode[]> {
    const id = await userId();
    if (!id) return [];
    const since = new Date(Date.now() - NEW_WINDOW_DAYS * 86_400_000);
    const episodes = await prisma.episode.findMany({
        where: {
            publishedAt: { gte: since },
            feed: { subscriptions: { some: { userId: id } } },
            queueItems: { none: { userId: id } },
            playbackStates: { none: { userId: id, completedAt: { not: null } } },
        },
        orderBy: { publishedAt: 'desc' },
        take: NEW_LIMIT,
        select: { ...episodeSelect, playbackStates: { where: { userId: id }, select: { positionSec: true, durationSec: true, completedAt: true } } },
    });
    return episodes.map((e) => toPlayerEpisode(e, e.playbackStates[0]));
}

/** Everything the player needs to start one episode (for Play buttons). */
export async function getPlayerEpisode(episodeId: string): Promise<PlayerEpisode | null> {
    const id = await userId();
    const e = await prisma.episode.findUnique({
        where: { id: episodeId },
        select: { ...episodeSelect, playbackStates: id ? { where: { userId: id }, select: { positionSec: true, durationSec: true, completedAt: true } } : false },
    });
    if (!e) return null;
    const states = (e as unknown as { playbackStates?: { positionSec: number; durationSec: number | null; completedAt: Date | null }[] }).playbackStates;
    return toPlayerEpisode(e, states?.[0]);
}

// ---------------------------------------------------------------- now playing extras

export type NowPlayingExtras = {
    chapters: { start: number; title: string }[];
    lines: { start: number; speaker: string | null; text: string }[];
};

/**
 * Chapters and the timestamped transcript for the full player. Only for
 * transcribed episodes; an empty result means there's nothing to show.
 */
export async function getNowPlayingExtras(episodeId: string): Promise<NowPlayingExtras> {
    if (!(await userId())) return { chapters: [], lines: [] };
    const insight = await prisma.insight.findUnique({
        where: { episodeId },
        select: { chapters: true, transcript: true },
    });
    if (!insight) return { chapters: [], lines: [] };
    const toSec = (stamp: string) => stamp.split(':').map((p) => parseInt(p, 10) || 0).reduce((a, n) => a * 60 + n, 0);
    const chapters = Array.isArray(insight.chapters)
        ? (insight.chapters as { start?: string; title?: string }[])
            .filter((c) => typeof c?.start === 'string' && typeof c?.title === 'string')
            .map((c) => ({ start: toSec(c.start as string), title: c.title as string }))
        : [];
    const lines: NowPlayingExtras['lines'] = [];
    for (const raw of (insight.transcript || '').split('\n')) {
        const m = raw.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?:([^:]{1,40}):\s)?(.*)$/);
        if (m) lines.push({ start: toSec(m[1]), speaker: m[2]?.trim() ?? null, text: m[3].trim() });
        else if (raw.trim() && lines.length) lines[lines.length - 1].text += ` ${raw.trim()}`;
    }
    return { chapters, lines };
}
