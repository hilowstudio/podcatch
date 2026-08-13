'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeFetch } from '@/lib/ssrf';

export async function shareToSlack(message: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slackWebhookUrl: true }
    });

    if (!user?.slackWebhookUrl) {
        throw new Error("Slack not connected");
    }

    // safeFetch: slackWebhookUrl is user-supplied — validate it isn't an internal
    // / metadata address before POSTing (SSRF).
    const response = await safeFetch(user.slackWebhookUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
        throw new Error("Failed to post to Slack");
    }

    return { success: true };
}
