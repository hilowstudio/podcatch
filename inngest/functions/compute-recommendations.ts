import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';

const PICKS_PER_USER = 12;

/**
 * Nightly "For You" builder. For each user with a taste signal (episodes they've
 * highlighted or collected), computes a taste centroid = the average embedding of
 * those episodes, then ranks the episodes in their subscriptions they HAVEN'T
 * engaged with by cosine distance to that centroid. Results are cached in
 * Recommendation so the vector math never runs on a page load.
 *
 * All candidates come from the user's own subscriptions — this surfaces
 * "what to listen to next in your library," never another user's content.
 */
export const computeRecommendations = inngest.createFunction(
    { id: 'compute-recommendations', name: 'Compute Recommendations' },
    { cron: '0 4 * * *' }, // nightly at 04:00 UTC
    async ({ step }) => {
        const userIds = await step.run('users-with-taste-signal', async () => {
            // A user needs at least one positive signal (a snip) to have a taste
            // vector worth ranking against.
            const rows = await prisma.snip.findMany({
                distinct: ['userId'],
                select: { userId: true },
            });
            return rows.map(r => r.userId);
        });

        let built = 0;

        for (const userId of userIds) {
            const ok = await step.run(`recommend-${userId}`, async () => {
                // Positive set: episodes the user highlighted or curated into a collection.
                const [snipEps, collections] = await Promise.all([
                    prisma.snip.findMany({ where: { userId }, distinct: ['episodeId'], select: { episodeId: true } }),
                    prisma.collection.findMany({ where: { userId }, select: { episodes: { select: { id: true } } } }),
                ]);
                const positive = new Set<string>();
                snipEps.forEach(s => positive.add(s.episodeId));
                collections.forEach(c => c.episodes.forEach(e => positive.add(e.id)));
                const positiveIds = [...positive];
                if (positiveIds.length === 0) return false;

                let ranked: { episodeId: string; distance: number }[] = [];
                try {
                    ranked = await prisma.$queryRawUnsafe<{ episodeId: string; distance: number }[]>(
                        `WITH taste AS (
                            SELECT avg("vector") AS v
                            FROM "EpisodeEmbedding"
                            WHERE "episodeId" = ANY($2::text[])
                        ),
                        candidates AS (
                            SELECT e."episodeId" AS id, avg(e."vector") AS v
                            FROM "EpisodeEmbedding" e
                            JOIN "Episode" ep ON ep."id" = e."episodeId"
                            JOIN "Subscription" s ON s."feedId" = ep."feedId"
                            WHERE s."userId" = $1
                              AND ep."status" = 'COMPLETED'
                              AND NOT (e."episodeId" = ANY($2::text[]))
                            GROUP BY e."episodeId"
                        )
                        SELECT c.id AS "episodeId", (t.v <=> c.v) AS distance
                        FROM candidates c CROSS JOIN taste t
                        WHERE t.v IS NOT NULL
                        ORDER BY distance ASC
                        LIMIT ${PICKS_PER_USER};`,
                        userId,
                        positiveIds,
                    );
                } catch (err) {
                    console.error(`[recommend] vector query failed for ${userId}`, err);
                    return false;
                }

                // Replace the user's cached picks atomically.
                await prisma.$transaction([
                    prisma.recommendation.deleteMany({ where: { userId } }),
                    ...(ranked.length > 0
                        ? [prisma.recommendation.createMany({
                            data: ranked.map(r => ({ userId, episodeId: r.episodeId, score: r.distance })),
                            skipDuplicates: true,
                        })]
                        : []),
                ]);

                return ranked.length > 0;
            });

            if (ok) built++;
        }

        return { usersConsidered: userIds.length, usersWithPicks: built };
    }
);
