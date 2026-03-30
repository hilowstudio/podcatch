import { getNotificationHistory } from '@/actions/notification-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = {
    title: 'Notification History - Podcatch',
    description: 'Your notification history for the last 30 days.',
};

export default async function NotificationsPage() {
    const { notifications, count } = await getNotificationHistory(30);

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                    <ArrowLeft className="h-3 w-3" /> Back to Settings
                </Link>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Notification History</h1>
                <p className="text-muted-foreground">
                    {count} notification{count !== 1 ? 's' : ''} in the last 30 days
                </p>
            </div>

            <div className="space-y-2">
                {notifications.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <Bell className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No notifications in the last 30 days.</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <Card key={n.id} className={n.read ? 'opacity-60' : ''}>
                            <CardContent className="flex items-start gap-3 p-4">
                                <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.read ? 'bg-muted' : 'bg-primary'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-medium text-sm">{n.title}</span>
                                        <Badge variant="secondary" className="text-[10px]">{n.type}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{n.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
