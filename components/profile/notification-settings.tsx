'use client';

import { PushNotificationToggle } from '@/components/push-notification-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export function NotificationSettings() {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Push Notifications</CardTitle>
                </div>
                <CardDescription>
                    Receive browser notifications when your episodes finish processing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PushNotificationToggle />
            </CardContent>
        </Card>
    );
}
