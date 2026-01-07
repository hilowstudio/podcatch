'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { syncEpisodeToClaude } from '@/lib/claude/sync';

export async function syncToClaudeAction(episodeId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            include: {
                feed: {
                    include: {
                        subscriptions: {
                            where: { userId: session.user.id }
                        }
                    }
                },
                insight: true
            }
        });

        if (!episode) {
            return { success: false, error: 'Episode not found' };
        }

        // Verify user has access via subscription
        if (episode.feed.subscriptions.length === 0) {
            return { success: false, error: 'You are not subscribed to this feed' };
        }

        // Get User keys
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { claudeApiKey: true, claudeProjectId: true }
        });

        if (!user?.claudeApiKey || !user?.claudeProjectId) {
            return { success: false, error: 'Claude features not configured. Check Settings.' };
        }

        if (!episode.insight) {
            return { success: false, error: 'Episode not yet processed (No insights)' };
        }

        // Sync
        const result = await syncEpisodeToClaude({
            apiKey: user.claudeApiKey,
            projectId: user.claudeProjectId,
            episodeTitle: episode.title,
            feedTitle: episode.feed.title || 'Podcast',
            publishedAt: episode.publishedAt,
            summary: episode.insight.summary,
            keyTakeaways: episode.insight.keyTakeaways as string[] || [],
            links: episode.insight.links as string[] || [],
            transcript: episode.insight.transcript
        });

        return result;

    } catch (error) {
        console.error('Manual Claude Sync Error:', error);
        return { success: false, error: 'Failed to sync to Claude' };
    }
}
