'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

export function SessionTimer() {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        const key = 'podcatch-session-start';
        let start = sessionStorage.getItem(key);
        if (!start) {
            start = Date.now().toString();
            sessionStorage.setItem(key, start);
        }
        const startTime = parseInt(start);
        let lastToastHour = 0;

        const update = () => {
            const diff = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);

            if (hours > 0) {
                setElapsed(`${hours}h ${minutes}m`);
            } else {
                setElapsed(`${minutes}m`);
            }

            // Gentle hourly check-in
            if (hours > 0 && hours > lastToastHour) {
                lastToastHour = hours;
                toast(`You've been using Podcatch for ${hours} hour${hours > 1 ? 's' : ''}. Take a break?`, {
                    duration: 8000,
                });
            }
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!elapsed) return null;

    return (
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground" title="Session duration">
            <Clock className="h-3 w-3" />
            <span>{elapsed}</span>
        </div>
    );
}
