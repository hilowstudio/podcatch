'use client';

import { useAudio, useAudioTime } from '@/components/audio-provider';
import { cn } from '@/lib/utils';
import { memo, useEffect, useRef, useMemo, useState, type RefObject } from 'react';

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

type ParagraphData = { words: WordTimestamp[]; startIndex: number };

// Memoized so a currentTime tick only re-renders the paragraph gaining or losing
// the active word (its activeLocal / played props change) rather than every
// paragraph's spans. `words`, `seek`, and `activeRef` are all stable references.
const Paragraph = memo(function Paragraph({
    words,
    startIndex,
    activeLocal,
    played,
    seek,
    activeRef,
}: {
    words: WordTimestamp[];
    startIndex: number;
    activeLocal: number; // index of the active word within this paragraph, or -1
    played: boolean;     // the whole paragraph is before the active word
    seek: (t: number) => void;
    activeRef: RefObject<HTMLSpanElement | null>;
}) {
    return (
        <p className="leading-relaxed text-sm">
            <span
                className="text-xs text-muted-foreground font-mono mr-2 cursor-pointer hover:text-primary"
                onClick={() => seek(words[0].start)}
            >
                [{formatTime(words[0].start)}]
            </span>
            {words.map((word, wIdx) => {
                const isActive = wIdx === activeLocal;
                const isPlayed = played || (activeLocal >= 0 && wIdx < activeLocal);
                return (
                    <span
                        key={startIndex + wIdx}
                        ref={isActive ? activeRef : undefined}
                        onClick={() => seek(word.start)}
                        className={cn(
                            "cursor-pointer transition-colors duration-150 hover:bg-primary/10 rounded-sm px-0.5",
                            isActive && "bg-primary/20 text-primary font-medium",
                            isPlayed && "text-muted-foreground"
                        )}
                    >
                        {word.word}{' '}
                    </span>
                );
            })}
        </p>
    );
});

export function AnimatedTranscriptViewer({ wordTimestamps, className }: AnimatedTranscriptViewerProps) {
    const { seek } = useAudio();
    const currentTime = useAudioTime();
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
    const paragraphs = useMemo<ParagraphData[]>(() => {
        const paras: ParagraphData[] = [];
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
            {paragraphs.map((para, pIdx) => {
                const end = para.startIndex + para.words.length - 1;
                const activeLocal = (activeIndex >= para.startIndex && activeIndex <= end)
                    ? activeIndex - para.startIndex
                    : -1;
                const played = end < activeIndex;
                return (
                    <Paragraph
                        key={pIdx}
                        words={para.words}
                        startIndex={para.startIndex}
                        activeLocal={activeLocal}
                        played={played}
                        seek={seek}
                        activeRef={activeWordRef}
                    />
                );
            })}
        </div>
    );
}
