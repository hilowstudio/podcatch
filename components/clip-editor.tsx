'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Scissors, Save, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createSnip } from '@/actions/snip-actions';

interface ClipEditorProps {
    episodeId: string;
    audioUrl: string;
}

function getProxiedAudioUrl(url: string): string {
    // Check if URL is external (different domain)
    try {
        const audioOrigin = new URL(url).origin;
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

        // If external, use proxy
        if (audioOrigin !== currentOrigin) {
            return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
        }
    } catch {
        // If URL parsing fails, still try proxy
        return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

export function ClipEditor({ episodeId, audioUrl }: ClipEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<{ start: number, end: number } | null>(null);

    const initWaveSurfer = () => {
        if (!containerRef.current) return;

        // Clean up previous instance
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }

        setIsLoading(true);
        setError(null);
        setIsReady(false);
        setSelectedRegion(null);

        const proxiedUrl = getProxiedAudioUrl(audioUrl);

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#4f46e5',
            progressColor: '#818cf8',
            cursorColor: '#ffffff',
            barWidth: 2,
            barGap: 3,
            height: 128,
            url: proxiedUrl,
        });

        // Initialize Regions Plugin
        const wsRegions = ws.registerPlugin(RegionsPlugin.create());
        regionsRef.current = wsRegions;

        // Enable drag selection
        wsRegions.enableDragSelection({
            color: 'rgba(255, 255, 255, 0.2)',
        });

        wsRegions.on('region-created', (region) => {
            // Ensure only one region exists
            wsRegions.getRegions().forEach(r => {
                if (r.id !== region.id) r.remove();
            });
            setSelectedRegion({ start: region.start, end: region.end });
        });

        wsRegions.on('region-updated', (region) => {
            setSelectedRegion({ start: region.start, end: region.end });
        });

        wsRegions.on('region-clicked', (region, e) => {
            e.stopPropagation();
            region.play();
        });

        ws.on('ready', () => {
            setIsReady(true);
            setIsLoading(false);
        });

        ws.on('error', (err) => {
            console.error('WaveSurfer error:', err);
            setError('Failed to load audio waveform. The audio file may not be accessible.');
            setIsLoading(false);
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));

        wavesurferRef.current = ws;
    };

    useEffect(() => {
        initWaveSurfer();

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
            }
        };
    }, [audioUrl]);

    const handlePlayPause = () => {
        wavesurferRef.current?.playPause();
    };

    const handleSaveSnip = async () => {
        if (!selectedRegion) {
            toast.error('Select a region first');
            return;
        }

        const result = await createSnip(
            episodeId,
            selectedRegion.start,
            selectedRegion.end,
            `Clip (${Math.round(selectedRegion.start)}s - ${Math.round(selectedRegion.end)}s)`
        );

        if (result.success) {
            toast.success('Clip saved to Snips library');
        } else {
            toast.error('Failed to save clip');
        }
    };

    const handleRetry = () => {
        initWaveSurfer();
    };

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-black/40 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-indigo-400" /> Clip Editor
                </h3>
                <div className="text-xs text-muted-foreground">
                    Drag on waveform to select
                </div>
            </div>

            {/* Waveform Container */}
            <div className="relative min-h-[128px]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded z-10">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                            <span className="text-sm text-muted-foreground">Loading waveform...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded z-10">
                        <div className="flex flex-col items-center gap-3 p-4 text-center">
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                            <span className="text-sm text-muted-foreground max-w-sm">{error}</span>
                            <Button variant="outline" size="sm" onClick={handleRetry}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                <div ref={containerRef} className="w-full" />
            </div>

            <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={handlePlayPause} disabled={!isReady}>
                    {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <div className="flex items-center gap-2">
                    {selectedRegion && (
                        <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                            {selectedRegion.start.toFixed(1)}s - {selectedRegion.end.toFixed(1)}s
                        </div>
                    )}
                    <Button size="sm" onClick={handleSaveSnip} disabled={!selectedRegion}>
                        <Save className="h-4 w-4 mr-2" /> Save Clip
                    </Button>
                </div>
            </div>
        </div>
    );
}

