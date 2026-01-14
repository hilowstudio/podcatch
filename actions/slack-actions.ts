'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    const response = await fetch(user.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
        throw new Error("Failed to post to Slack");
    }

    return { success: true };
}
