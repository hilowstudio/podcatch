'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { searchPodcasts } from '@/lib/itunes';
import { MODELS } from '@/lib/ai/models';

// Types are declared locally (a 'use server' module may only *export* async
// functions); the client derives them via Awaited<ReturnType<...>>.
interface DiscoverySuggestion {
    feedUrl: string;
    title: string;
    author: string;
    image: string;
    reason: string; // the topic from the user's brain that surfaced this show
}

interface DiscoveryResult {
    locked: boolean; // plan doesn't include discovery
    topics: string[]; // the topics we searched on
    suggestions: DiscoverySuggestion[];
}

const MAX_TOPICS = 5;
const PER_TOPIC = 4;
const MAX_SUGGESTIONS = 12;
const TOPICS_TTL_MS = 7 * 86_400_000; // recompute topic seeds at most weekly

function normUrl(u: string): string {
    return u.trim().replace(/\/+$/, '').toLowerCase();
}

/** Preferred, cheap source: the user's most frequent knowledge-graph entities. */
async function topicsFromEntities(userId: string): Promise<string[]> {
    const grouped = await prisma.entity.groupBy({
        by: ['name'],
        where: { episode: { status: 'COMPLETED', feed: { subscriptions: { some: { userId } } } } },
        _count: { name: true },
        orderBy: { _count: { name: 'desc' } },
        take: 24,
    });
    return dedupeTopics(grouped.map(g => g.name));
}

/**
 * Fallback when the graph is sparse/empty: extract topics from the user's
 * episode insights with one LLM call. Keeps discovery working independent of the
 * knowledge graph's state.
 */
async function topicsFromInsights(userId: string): Promise<string[]> {
    const episodes = await prisma.episode.findMany({
        where: {
            status: 'COMPLETED',
            insight: { isNot: null },
            feed: { subscriptions: { some: { userId } } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 18,
        select: { title: true, insight: { select: { summary: true } } },
    });
    if (episodes.length === 0) return [];

    const material = episodes
        .map(e => `- ${e.title}: ${(e.insight?.summary || '').slice(0, 240)}`)
        .join('\n');

    try {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateObject } = await import('ai');
        const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
        const { object } = await generateObject({
            model: google(MODELS.synthesis),
            schema: z.object({ topics: z.array(z.string()) }),
            prompt:
                `From these podcast episodes a listener saved, infer 5–6 short, distinct TOPICS ` +
                `(2–4 words each) that capture their interests and would work as searches in a ` +
                `podcast directory. Prefer specific subjects, people, or fields over generic words ` +
                `like "podcast" or "conversation". Return only the topics.\n\n${material}`,
            maxOutputTokens: 4096, // gemini-3.1-pro is a thinking model — leave headroom
        });
        return dedupeTopics(object.topics);
    } catch (err) {
        console.error('topicsFromInsights failed:', err);
        return [];
    }
}

function dedupeTopics(names: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of names) {
        const name = (raw || '').trim();
        const key = name.toLowerCase();
        if (name.length < 3 || name.length > 40 || seen.has(key)) continue;
        seen.add(key);
        out.push(name);
        if (out.length >= MAX_TOPICS) break;
    }
    return out;
}

/** Topic seeds for a user, cached weekly. Graph first, insights-LLM as fallback. */
async function getTopics(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { discoveryTopics: true, discoveryTopicsAt: true },
    });
    if (
        user?.discoveryTopics &&
        user.discoveryTopicsAt &&
        Date.now() - user.discoveryTopicsAt.getTime() < TOPICS_TTL_MS
    ) {
        return user.discoveryTopics as string[];
    }

    // Insights first: LLM-extracted topics ("Christian Spiritual Formation") make
    // sharper catalog searches than raw graph entities ("Jesus", "God"), and the
    // call is cached weekly so the cost is negligible. Entities are the fallback.
    let topics = await topicsFromInsights(userId);
    if (topics.length < 3) {
        const fromEntities = await topicsFromEntities(userId);
        if (fromEntities.length > topics.length) topics = fromEntities;
    }

    if (topics.length > 0) {
        await prisma.user.update({
            where: { id: userId },
            data: { discoveryTopics: topics, discoveryTopicsAt: new Date() },
        });
    }
    return topics;
}

/**
 * "Expand your brain" — outward discovery. Derives the user's topics of interest,
 * searches the whole podcast catalog for shows on those topics, and returns ones
 * they DON'T already follow. Surfaces new shows worth *adding to the brain* —
 * never the user's own episodes, never framed as "play next".
 */
export async function getDiscoverySuggestions(): Promise<DiscoveryResult> {
    const session = await auth();
    if (!session?.user?.id) return { locked: true, topics: [], suggestions: [] };
    const userId = session.user.id;

    const plan = await getUserSubscriptionPlan();
    if (!plan.canUseKnowledgeGraph) return { locked: true, topics: [], suggestions: [] };

    const topics = await getTopics(userId);
    if (topics.length === 0) return { locked: false, topics: [], suggestions: [] };

    // Feeds the user already has — exclude these from suggestions.
    const subs = await prisma.feed.findMany({
        where: { subscriptions: { some: { userId } } },
        select: { url: true, title: true },
    });
    const ownedUrls = new Set(subs.map(s => normUrl(s.url)));
    const ownedTitles = new Set(subs.map(s => (s.title || '').trim().toLowerCase()));

    // Search the catalog per topic in parallel, tagging results with their topic.
    const perTopic = await Promise.all(
        topics.map(async topic => ({ topic, results: await searchPodcasts(topic) })),
    );

    const seen = new Set<string>();
    const suggestions: DiscoverySuggestion[] = [];
    for (const { topic, results } of perTopic) {
        let count = 0;
        for (const r of results) {
            if (count >= PER_TOPIC || suggestions.length >= MAX_SUGGESTIONS) break;
            const key = normUrl(r.feedUrl || '');
            if (!r.feedUrl || seen.has(key)) continue;
            if (ownedUrls.has(key) || ownedTitles.has((r.title || '').trim().toLowerCase())) continue;
            seen.add(key);
            suggestions.push({ feedUrl: r.feedUrl, title: r.title, author: r.author, image: r.image, reason: topic });
            count++;
        }
        if (suggestions.length >= MAX_SUGGESTIONS) break;
    }

    return { locked: false, topics, suggestions };
}
