'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Scissors, Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createSnip } from '@/actions/snip-actions'; // Reusing existing action

interface ClipEditorProps {
    episodeId: string;
    audioUrl: string;
}

export function ClipEditor({ episodeId, audioUrl }: ClipEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<any>(null); // Type is tricky for plugins
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<{ start: number, end: number } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#4f46e5', // Indigo-600
            progressColor: '#818cf8', // Indigo-400
            cursorColor: '#ffffff',
            barWidth: 2,
            barGap: 3,
            height: 128,
            url: audioUrl,
        });

        // Initialize Regions Plugin
        const wsRegions = ws.registerPlugin(RegionsPlugin.create());
        regionsRef.current = wsRegions;

        // Enable drag selection
        wsRegions.enableDragSelection({
            color: 'rgba(255, 255, 255, 0.2)',
        });

        wsRegions.on('region-created', (region) => {
            // Ensure only one region exists (optional UX choice)
            wsRegions.getRegions().forEach(r => {
                if (r.id !== region.id) r.remove();
            });
            setSelectedRegion({ start: region.start, end: region.end });
        });

        wsRegions.on('region-updated', (region) => {
            setSelectedRegion({ start: region.start, end: region.end });
        });

        wsRegions.on('region-clicked', (region, e) => {
            e.stopPropagation(); // Prevent seeking
            region.play();
        });

        ws.on('ready', () => setIsReady(true));
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
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

        // Create Snip in DB
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

            <div ref={containerRef} className="w-full" />

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
