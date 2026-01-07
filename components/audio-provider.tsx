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
