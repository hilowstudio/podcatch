import { prisma } from '@/lib/prisma';

interface NotificationData {
    title: string;
    message: string;
    link?: string;
    type?: string;
}

/**
 * Creates a notification, respecting the user's quiet hours.
 * If the current time (in the user's timezone) falls within their quiet hours,
 * the notification is queued until quiet hours end.
 */
export async function createNotificationWithQuietHours(userId: string, data: NotificationData) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { quietHoursStart: true, quietHoursEnd: true, timezone: true },
    });

    let queuedUntil: Date | null = null;

    if (user?.quietHoursStart && user?.quietHoursEnd && user?.timezone) {
        queuedUntil = getQueuedUntilTime(user.quietHoursStart, user.quietHoursEnd, user.timezone);
    }

    return prisma.notification.create({
        data: {
            userId,
            title: data.title,
            message: data.message,
            link: data.link,
            type: data.type || 'INFO',
            queuedUntil,
        },
    });
}

/**
 * If the current time is within quiet hours, returns the Date when quiet hours end.
 * Otherwise returns null.
 */
function getQueuedUntilTime(startStr: string, endStr: string, timezone: string): Date | null {
    const now = new Date();

    // Get current time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let isInQuietHours = false;

    if (startMinutes > endMinutes) {
        // Overnight quiet hours (e.g., 22:00 - 07:00)
        isInQuietHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
        // Same-day quiet hours (e.g., 13:00 - 14:00)
        isInQuietHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    if (!isInQuietHours) return null;

    // Calculate when quiet hours end in UTC
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const dateParts = dateFormatter.formatToParts(now);
    const year = parseInt(dateParts.find(p => p.type === 'year')?.value || '2026');
    const month = parseInt(dateParts.find(p => p.type === 'month')?.value || '1') - 1;
    const day = parseInt(dateParts.find(p => p.type === 'day')?.value || '1');

    // Create end time in the user's local date
    let endDate = new Date(Date.UTC(year, month, day, endH, endM));

    // Adjust for timezone offset
    const utcNow = now.getTime();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTime();
    const offset = localNow - utcNow;
    endDate = new Date(endDate.getTime() - offset);

    // If end is before now (overnight case), add a day
    if (endDate <= now) {
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return endDate;
}
