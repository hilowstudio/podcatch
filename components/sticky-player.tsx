'use client';

import { createSnip } from '@/actions/snip-actions';
import { useAudio } from '@/components/audio-provider';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, X, SkipBack, SkipForward, Scissors } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function StickyPlayer() {
    const { currentEpisode, isPlaying, toggle, currentTime, duration, seek, close } = useAudio();
    const [isSnipping, setIsSnipping] = useState(false);

    if (!currentEpisode) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSnip = async () => {
        if (!currentEpisode) return;
        setIsSnipping(true);
        try {
            const result = await createSnip(currentEpisode.id, currentTime);
            if (result.success) {
                toast.success('Snip saved!');
            } else {
                toast.error('Failed to save snip.');
            }
        } catch (error) {
            toast.error('Error creating snip');
        } finally {
            setIsSnipping(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 z-50">
            <div className="container flex items-center gap-4 max-w-screen-xl mx-auto">
                {/* Episode Info */}
                <div className="flex items-center gap-3 w-1/4 min-w-0">
                    {currentEpisode.image && (
                        <img
                            src={currentEpisode.image}
                            alt={currentEpisode.title}
                            className="h-12 w-12 rounded object-cover"
                        />
                    )}
                    <div className="min-w-0 overflow-hidden">
                        <h4 className="font-medium truncate text-sm">{currentEpisode.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{currentEpisode.feedTitle}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center flex-1 gap-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => seek(currentTime - 15)}>
                            <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 rounded-full shadow-sm"
                            onClick={toggle}
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => seek(currentTime + 30)}>
                            <SkipForward className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 w-full max-w-md">
                        <span className="text-xs tabular-nums text-muted-foreground">{formatTime(currentTime)}</span>
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={1}
                            onValueChange={(val) => seek(val[0])}
                            className="flex-1"
                        />
                        <span className="text-xs tabular-nums text-muted-foreground">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Extra Actions */}
                <div className="flex items-center justify-end w-1/4 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 hidden sm:flex"
                        onClick={handleSnip}
                        disabled={isSnipping}
                    >
                        <Scissors className="h-4 w-4" />
                        {isSnipping ? 'Saving...' : 'Snip'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={close}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
