'use client';

import { useAudio } from '@/components/audio-provider';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useMemo, useState } from 'react';

interface WordTimestamp {
    word: string;
    start: number;
    end: number;
    speaker?: number;
}

interface AnimatedTranscriptViewerProps {
    wordTimestamps: WordTimestamp[];
    className?: string;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function AnimatedTranscriptViewer({ wordTimestamps, className }: AnimatedTranscriptViewerProps) {
    const { seek, currentTime } = useAudio();
    const containerRef = useRef<HTMLDivElement>(null);
    const activeWordRef = useRef<HTMLSpanElement>(null);
    const [userScrolled, setUserScrolled] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Binary search to find the active word index
    const activeIndex = useMemo(() => {
        let lo = 0, hi = wordTimestamps.length - 1;
        while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (wordTimestamps[mid].end < currentTime) {
                lo = mid + 1;
            } else if (wordTimestamps[mid].start > currentTime) {
                hi = mid - 1;
            } else {
                return mid;
            }
        }
        return lo > 0 ? lo - 1 : 0;
    }, [currentTime, wordTimestamps]);

    // Auto-scroll to active word
    useEffect(() => {
        if (!userScrolled && activeWordRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex, userScrolled]);

    // Detect manual scroll to pause auto-scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setUserScrolled(true);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => setUserScrolled(false), 5000);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    // Group words into paragraphs by speaker change or time gap
    const paragraphs = useMemo(() => {
        const paras: { words: WordTimestamp[]; startIndex: number }[] = [];
        let current: WordTimestamp[] = [];
        let startIndex = 0;

        for (let i = 0; i < wordTimestamps.length; i++) {
            const word = wordTimestamps[i];
            const prev = wordTimestamps[i - 1];

            if (prev && (
                word.speaker !== prev.speaker ||
                word.start - prev.end > 2
            )) {
                if (current.length > 0) {
                    paras.push({ words: current, startIndex });
                }
                current = [];
                startIndex = i;
            }
            current.push(word);
        }
        if (current.length > 0) {
            paras.push({ words: current, startIndex });
        }
        return paras;
    }, [wordTimestamps]);

    return (
        <div
            ref={containerRef}
            className={cn("overflow-y-auto max-h-[600px] p-4 space-y-4", className)}
        >
            {paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="leading-relaxed text-sm">
                    <span className="text-xs text-muted-foreground font-mono mr-2 cursor-pointer hover:text-primary" onClick={() => seek(para.words[0].start)}>
                        [{formatTime(para.words[0].start)}]
                    </span>
                    {para.words.map((word, wIdx) => {
                        const idx = para.startIndex + wIdx;
                        const isActive = idx === activeIndex;

                        return (
                            <span
                                key={idx}
                                ref={isActive ? activeWordRef : undefined}
                                onClick={() => seek(word.start)}
                                className={cn(
                                    "cursor-pointer transition-colors duration-150 hover:bg-primary/10 rounded-sm px-0.5",
                                    isActive && "bg-primary/20 text-primary font-medium",
                                    idx < activeIndex && "text-muted-foreground"
                                )}
                            >
                                {word.word}{' '}
                            </span>
                        );
                    })}
                </p>
            ))}
        </div>
    );
}
