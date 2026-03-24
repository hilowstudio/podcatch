'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface Episode {
    id: string;
    title: string;
    audioUrl: string;
    image?: string | null;
    feedTitle?: string;
}

export interface PlayHistoryEntry {
    episode: Episode;
    playedAt: number; // timestamp ms
}

interface AudioContextType {
    currentEpisode: Episode | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    volume: number;
    playHistory: PlayHistoryEntry[];
    play: (episode: Episode) => void;
    toggle: () => void;
    seek: (time: number) => void;
    close: () => void;
    setPlaybackRate: (rate: number) => void;
    setVolume: (volume: number) => void;
    silenceSkip: boolean;
    setSilenceSkip: (enabled: boolean) => void;
}

const HISTORY_KEY = 'podcatch_play_history';
const MAX_HISTORY = 20;

function loadHistory(): PlayHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveHistory(entries: PlayHistoryEntry[]) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
    } catch { /* quota exceeded - ignore */ }
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);
    const [playbackRate, setPlaybackRateState] = useState<number>(() => {
        if (typeof window === 'undefined') return 1;
        try {
            const stored = localStorage.getItem('podcatch_playback_rate');
            return stored ? parseFloat(stored) : 1;
        } catch { return 1; }
    });
    const [volume, setVolumeState] = useState<number>(() => {
        if (typeof window === 'undefined') return 1;
        try {
            const stored = localStorage.getItem('podcatch_volume');
            return stored ? parseFloat(stored) : 1;
        } catch { return 1; }
    });
    const [silenceSkip, setSilenceSkipState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try { return localStorage.getItem('podcatch_silence_skip') === 'true'; } catch { return false; }
    });
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load history on mount
    useEffect(() => {
        setPlayHistory(loadHistory());
    }, []);

    const addToHistory = useCallback((episode: Episode) => {
        setPlayHistory(prev => {
            const filtered = prev.filter(e => e.episode.id !== episode.id);
            const updated = [{ episode, playedAt: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
            saveHistory(updated);
            return updated;
        });
    }, []);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);
        audio.playbackRate = playbackRate;
        audio.volume = volume;

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
    }, [currentEpisode]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const setPlaybackRate = useCallback((rate: number) => {
        setPlaybackRateState(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
        try { localStorage.setItem('podcatch_playback_rate', String(rate)); } catch {}
    }, []);

    const setVolume = useCallback((vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        setVolumeState(clamped);
        if (audioRef.current) audioRef.current.volume = clamped;
        try { localStorage.setItem('podcatch_volume', String(clamped)); } catch {}
    }, []);

    const setSilenceSkip = useCallback((enabled: boolean) => {
        setSilenceSkipState(enabled);
        try { localStorage.setItem('podcatch_silence_skip', String(enabled)); } catch {}
    }, []);

    const play = (episode: Episode) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentEpisode?.id !== episode.id) {
            setCurrentEpisode(episode);
            audio.src = episode.audioUrl;
            audio.load();
            audio.playbackRate = playbackRate;
            addToHistory(episode);
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
        <AudioContext.Provider value={{ currentEpisode, isPlaying, currentTime, duration, playbackRate, volume, playHistory, play, toggle, seek, close, setPlaybackRate, setVolume, silenceSkip, setSilenceSkip }}>
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
