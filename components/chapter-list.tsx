'use client';

import { useAudio } from '@/components/audio-provider';
import { cn } from '@/lib/utils';
import { PlayCircle } from 'lucide-react';

interface Chapter {
    start: string; // e.g. "00:15" or "1:30:45"
    title: string;
    reason?: string;
}

interface ChapterListProps {
    chapters: Chapter[];
    episode: {
        id: string;
        title: string;
        audioUrl: string;
        image?: string;
        feedTitle?: string;
    };
}

function parseTimestamp(timestamp: string): number {
    // Parse "MM:SS" or "HH:MM:SS" format to seconds
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    }
    return 0;
}

export function ChapterList({ chapters, episode }: ChapterListProps) {
    const { currentEpisode, play, seek, currentTime } = useAudio();

    const handleChapterClick = (timestamp: string) => {
        const seconds = parseTimestamp(timestamp);

        // If not playing this episode, start it first
        if (currentEpisode?.id !== episode.id) {
            play({
                id: episode.id,
                title: episode.title,
                audioUrl: episode.audioUrl,
                image: episode.image ?? undefined,
                feedTitle: episode.feedTitle
            });
            // Use a small delay to let the audio load before seeking
            setTimeout(() => seek(seconds), 500);
        } else {
            seek(seconds);
        }
    };

    // Determine active chapter based on current time
    const getActiveChapterIndex = () => {
        if (currentEpisode?.id !== episode.id) return -1;

        for (let i = chapters.length - 1; i >= 0; i--) {
            const chapterTime = parseTimestamp(chapters[i].start);
            if (currentTime >= chapterTime) {
                return i;
            }
        }
        return -1;
    };

    const activeIndex = getActiveChapterIndex();

    return (
        <div className="grid gap-2">
            {chapters.map((chapter, i) => (
                <div
                    key={i}
                    onClick={() => handleChapterClick(chapter.start)}
                    className={cn(
                        "flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer group",
                        i === activeIndex && "bg-primary/10 border-l-4 border-primary"
                    )}
                >
                    <span className={cn(
                        "font-mono text-sm px-2 py-0.5 rounded flex items-center gap-1",
                        i === activeIndex
                            ? "text-primary-foreground bg-primary"
                            : "text-primary bg-primary/10"
                    )}>
                        <PlayCircle className="h-3 w-3" />
                        {chapter.start}
                    </span>
                    <div>
                        <p className={cn(
                            "font-medium text-sm transition-colors",
                            i === activeIndex ? "text-primary" : "group-hover:text-primary"
                        )}>
                            {chapter.title}
                        </p>
                        {chapter.reason && (
                            <p className="text-xs text-muted-foreground">{chapter.reason}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
