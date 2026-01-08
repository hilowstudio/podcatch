'use client';

import { useAudio } from '@/components/audio-provider';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';

interface TranscriptViewerProps {
    transcript: string;
    className?: string;
}

interface TranscriptSegment {
    timestamp: number; // Seconds
    text: string;
    displayTime: string; // [MM:SS]
}

export function TranscriptViewer({ transcript, className }: TranscriptViewerProps) {
    const { seek, currentTime } = useAudio();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Parse transcript: Look for [MM:SS] patterns
    const segments = useMemo(() => {
        const lines = transcript.split('\n');
        const parsed: TranscriptSegment[] = [];

        // Regex to find start timestamps like [00:00] or [1:30]
        const timeRegex = /\[(\d{1,2}):(\d{2})\]/;

        for (const line of lines) {
            const match = line.match(timeRegex);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const totalSeconds = minutes * 60 + seconds;
                const text = line.replace(timeRegex, '').trim();

                if (text) {
                    parsed.push({
                        timestamp: totalSeconds,
                        displayTime: match[0],
                        text
                    });
                }
            } else if (parsed.length > 0 && line.trim()) {
                // Append to previous segment if no timestamp found but text exists
                parsed[parsed.length - 1].text += ' ' + line.trim();
            } else if (line.trim()) {
                // No timestamp found yet, maybe header or intro?
                // Just add with 0 timestamp or skip? Let's add with -1 to indicate non-seekable
                parsed.push({ timestamp: 0, displayTime: '', text: line });
            }
        }
        return parsed;
    }, [transcript]);

    // Find active segment
    const activeIndex = segments.findIndex((seg, i) => {
        const nextSeg = segments[i + 1];
        return currentTime >= seg.timestamp && (!nextSeg || currentTime < nextSeg.timestamp);
    });

    // Auto-scroll logic
    useEffect(() => {
        if (activeIndex >= 0 && scrollContainerRef.current) {
            const activeEl = scrollContainerRef.current.children[activeIndex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeIndex]);

    if (!transcript) return <div className="text-muted-foreground p-4">No transcript available.</div>;

    return (
        <div ref={scrollContainerRef} className={cn("flex flex-col gap-4 overflow-y-auto max-h-[600px] p-4", className)}>
            {segments.map((seg, i) => (
                <div
                    key={i}
                    onClick={() => seek(seg.timestamp)}
                    className={cn(
                        "p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
                        i === activeIndex ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                    )}
                >
                    <div className="text-xs text-muted-foreground font-mono mb-1">{seg.displayTime}</div>
                    <p className="text-sm leading-relaxed">{seg.text}</p>
                </div>
            ))}
        </div>
    );
}
