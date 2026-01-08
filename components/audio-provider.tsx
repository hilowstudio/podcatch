'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface Episode {
    id: string;
    title: string;
    audioUrl: string;
    image?: string | null;
    feedTitle?: string;
}

interface AudioContextType {
    currentEpisode: Episode | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    play: (episode: Episode) => void;
    toggle: () => void;
    seek: (time: number) => void;
    close: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
            audio.pause();
        };
    }, []);

    useEffect(() => {
        if ('mediaSession' in navigator && currentEpisode) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentEpisode.title,
                artist: currentEpisode.feedTitle || 'Podcatch',
                artwork: currentEpisode.image ? [{ src: currentEpisode.image, sizes: '512x512', type: 'image/jpeg' }] : []
            });
        }
    }, [currentEpisode]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            const audio = audioRef.current;

            navigator.mediaSession.setActionHandler('play', () => {
                audio?.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                audio?.pause();
                setIsPlaying(false);
            });
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                seek((audio?.currentTime || 0) - (details.seekOffset || 15));
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                seek((audio?.currentTime || 0) + (details.seekOffset || 15));
            });
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) {
                    seek(details.seekTime);
                }
            });
        }
    }, [currentEpisode]); // Re-bind if episode changes to ensure closure scope is correct

    const play = (episode: Episode) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentEpisode?.id !== episode.id) {
            setCurrentEpisode(episode);
            audio.src = episode.audioUrl;
            audio.load();
        }

        audio.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.error("Playback failed:", e));
    };

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio || !currentEpisode) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.error("Playback failed:", e));
        }
    };

    const seek = (time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);

        // Ensure prompt playback if seeking while paused? Currently no.
    };

    const close = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.src = '';
        }
        setCurrentEpisode(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    };

    return (
        <AudioContext.Provider value={{ currentEpisode, isPlaying, currentTime, duration, play, toggle, seek, close }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
