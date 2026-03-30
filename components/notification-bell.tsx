
'use client';

import { useState, useEffect } from 'react';
import { getNotifications, getUnreadCount, markNotificationRead, markAllRead } from '@/actions/notification-actions';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Notification = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    link: string | null;
    createdAt: Date;
    type: string;
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Poll for notifications every 30 seconds
    useEffect(() => {
        const fetchCount = async () => {
            const c = await getUnreadCount();
            setCount(c);
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data);
            setLoading(false);
        }
    };

    const handleClick = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationRead(notification.id);
            setCount(c => Math.max(0, c - 1));
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        }
        setOpen(false);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllRead();
        setCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-status-danger ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                    <h4 className="font-semibold">Notifications</h4>
                    {count > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="grid">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "relative flex cursor-pointer gap-4 px-4 py-3 hover:bg-muted/50 transition-colors",
                                        !notification.read && "bg-muted/30"
                                    )}
                                    onClick={() => handleClick(notification)}
                                >
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="flex h-2 w-2 shrink-0 rounded-full bg-primary translate-y-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="border-t px-4 py-2">
                    <Link href="/notifications" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        View full history
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
