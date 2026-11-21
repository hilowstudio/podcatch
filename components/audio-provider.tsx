'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    addToQueue as addToQueueAction,
    clearQueue as clearQueueAction,
    getPlayback,
    getPlayerPrefs,
    getQueue,
    moveInQueue as moveInQueueAction,
    removeFromQueue as removeFromQueueAction,
    savePlayback,
    setPlayed,
    setShowSpeed as setShowSpeedAction,
    updatePlayerPrefs,
    type PlayerEpisode,
    type PlayerPrefs,
} from '@/actions/player-actions';
import { isFinished, nextInQueue, resumeAt, sleepDeadline, type SleepMode } from '@/lib/player/logic';

/** What a Play button passes in. Only id, title and audioUrl are required. */
export interface Episode {
    id: string;
    title: string;
    audioUrl: string;
    image?: string | null;
    feedTitle?: string | null;
    feedId?: string;
    /** Where to start, when the caller already knows it (skips a lookup). */
    positionSec?: number;
    durationSec?: number | null;
    completed?: boolean;
}

export interface PlayHistoryEntry {
    episode: Episode;
    playedAt: number; // timestamp ms
}

const DEFAULT_PREFS: PlayerPrefs = { skipBackSec: 15, skipForwardSec: 30, continuousPlay: true, showSpeeds: {} };

interface AudioContextType {
    currentEpisode: Episode | null;
    isPlaying: boolean;
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
    // Phase 2: a player people can switch to
    signedIn: boolean;
    prefs: PlayerPrefs;
    updatePrefs: (p: Partial<Pick<PlayerPrefs, 'skipBackSec' | 'skipForwardSec' | 'continuousPlay'>>) => void;
    setShowSpeed: (feedId: string, rate: number | null) => void;
    skipBack: () => void;
    skipForward: () => void;
    queue: PlayerEpisode[];
    refreshQueue: () => Promise<void>;
    addToQueue: (episode: Episode | PlayerEpisode, where: 'next' | 'end') => void;
    removeFromQueue: (episodeId: string) => void;
    moveInQueue: (episodeId: string, direction: 'up' | 'down') => void;
    clearQueue: () => void;
    playNextInQueue: () => void;
    markPlayed: (episodeId: string, played: boolean) => void;
    sleep: { mode: SleepMode; deadline: number | null };
    setSleep: (mode: SleepMode) => void;
}

const HISTORY_KEY = 'podcatch_play_history';
const MAX_HISTORY = 20;
const SAVE_EVERY_MS = 10_000;

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

const readStored = (key: string, fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    try {
        const v = localStorage.getItem(key);
        return v ? parseFloat(v) : fallback;
    } catch { return fallback; }
};

const toEpisode = (e: Episode | PlayerEpisode): Episode => ({
    id: e.id,
    title: e.title,
    audioUrl: e.audioUrl,
    image: e.image ?? null,
    feedTitle: e.feedTitle ?? null,
    feedId: e.feedId,
    positionSec: e.positionSec,
    durationSec: e.durationSec ?? null,
    completed: e.completed,
});

const AudioContext = createContext<AudioContextType | undefined>(undefined);
// currentTime lives in its own context so components that don't need the live
// position don't re-render ~4x/sec during playback.
const AudioTimeContext = createContext<number>(0);

export function AudioProvider({ children, signedIn = false }: { children: React.ReactNode; signedIn?: boolean }) {
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);
    const [playbackRate, setPlaybackRateState] = useState<number>(() => readStored('podcatch_playback_rate', 1));
    const [volume, setVolumeState] = useState<number>(() => readStored('podcatch_volume', 1));
    const [silenceSkip, setSilenceSkipState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try { return localStorage.getItem('podcatch_silence_skip') === 'true'; } catch { return false; }
    });
    const [prefs, setPrefs] = useState<PlayerPrefs>(DEFAULT_PREFS);
    const [queue, setQueue] = useState<PlayerEpisode[]>([]);
    const [sleep, setSleepState] = useState<{ mode: SleepMode; deadline: number | null }>({ mode: { kind: 'off' }, deadline: null });

    const audioRef = useRef<HTMLAudioElement | null>(null);
    // Refs mirror state the audio event handlers read, so the handlers can be
    // attached once and still see the latest values.
    const episodeRef = useRef<Episode | null>(null);
    const queueRef = useRef<PlayerEpisode[]>([]);
    const prefsRef = useRef<PlayerPrefs>(DEFAULT_PREFS);
    const sleepRef = useRef(sleep);
    const rateRef = useRef(playbackRate);
    const pendingSeek = useRef<number | null>(null);
    const lastSaved = useRef(0);

    useEffect(() => { queueRef.current = queue; }, [queue]);
    useEffect(() => { prefsRef.current = prefs; }, [prefs]);
    useEffect(() => { sleepRef.current = sleep; }, [sleep]);
    useEffect(() => { rateRef.current = playbackRate; }, [playbackRate]);

    // ------------------------------------------------------------ server state
    const refreshQueue = useCallback(async () => {
        if (!signedIn) return;
        try { setQueue(await getQueue()); } catch { /* offline: keep what we have */ }
    }, [signedIn]);

    useEffect(() => {
        setPlayHistory(loadHistory());
        if (!signedIn) return;
        getPlayerPrefs().then((p) => { if (p) setPrefs(p); }).catch(() => {});
        refreshQueue();
    }, [signedIn, refreshQueue]);

    const persist = useCallback((finished = false) => {
        const audio = audioRef.current;
        const ep = episodeRef.current;
        if (!signedIn || !audio || !ep || !audio.src) return;
        lastSaved.current = Date.now();
        const dur = Number.isFinite(audio.duration) ? audio.duration : null;
        savePlayback(ep.id, audio.currentTime, dur, finished).catch(() => {});
    }, [signedIn]);

    // ------------------------------------------------------------ the element
    const startEpisode = useCallback((episode: Episode, autoplay = true) => {
        const audio = audioRef.current;
        if (!audio) return;
        persist();
        episodeRef.current = episode;
        setCurrentEpisode(episode);
        setCurrentTime(0);
        setDuration(episode.durationSec ?? 0);
        audio.src = episode.audioUrl;
        audio.load();
        // A show's own speed applies to that show only; everything else plays
        // at the person's usual speed.
        const showRate = episode.feedId ? prefsRef.current.showSpeeds[episode.feedId] : undefined;
        const rate = showRate ?? readStored('podcatch_playback_rate', 1);
        audio.playbackRate = rate;
        setPlaybackRateState(rate);
        setPlayHistory((prev) => {
            const updated = [{ episode, playedAt: Date.now() }, ...prev.filter((e) => e.episode.id !== episode.id)].slice(0, MAX_HISTORY);
            saveHistory(updated);
            return updated;
        });
        // Playing an episode from Up next moves it to the front, so "next"
        // is always the episode after the one playing.
        // (Functional update: the episode that just ended may have been removed
        // a moment ago, and the ref can still hold the old list.)
        if (queueRef.current.findIndex((x) => x.id === episode.id) > 0 && signedIn) {
            addToQueueAction(episode.id, 'next', null).catch(() => {});
        }
        setQueue((q) => {
            const at = q.findIndex((x) => x.id === episode.id);
            return at > 0 ? [q[at], ...q.slice(0, at), ...q.slice(at + 1)] : q;
        });

        const begin = (start: number) => {
            pendingSeek.current = start > 0 ? start : null;
            if (autoplay) audio.play().then(() => setIsPlaying(true)).catch((e) => console.error('Playback failed:', e));
        };
        if (episode.positionSec !== undefined) {
            begin(resumeAt(episode.positionSec, episode.durationSec, !!episode.completed));
        } else if (signedIn) {
            getPlayback(episode.id)
                .then((s) => begin(s ? resumeAt(s.positionSec, s.durationSec, s.completed) : 0))
                .catch(() => begin(0));
        } else {
            begin(0);
        }
    }, [persist, signedIn]);

    const playNextInQueue = useCallback(() => {
        const nextId = nextInQueue(queueRef.current.map((q, i) => ({ episodeId: q.id, position: i })), episodeRef.current?.id ?? null);
        const next = queueRef.current.find((q) => q.id === nextId);
        if (next) startEpisode(toEpisode(next));
    }, [startEpisode]);

    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audioRef.current = audio;
        // Lets the local browser checks read the element's state. Dev only.
        if (process.env.NODE_ENV !== 'production') (window as unknown as { __podcatchAudio?: HTMLAudioElement }).__podcatchAudio = audio;

        const onTime = () => {
            setCurrentTime(audio.currentTime);
            if (audio.paused) return;
            if (Date.now() - lastSaved.current > SAVE_EVERY_MS) persist();
            const s = sleepRef.current;
            if (s.mode.kind === 'minutes' && s.deadline && Date.now() >= s.deadline) {
                audio.pause();
                setIsPlaying(false);
                setSleepState({ mode: { kind: 'off' }, deadline: null });
                persist();
            }
        };
        const onMeta = () => {
            setDuration(audio.duration);
            if (pendingSeek.current !== null) {
                audio.currentTime = pendingSeek.current;
                pendingSeek.current = null;
            }
        };
        const onPause = () => { setIsPlaying(false); persist(); };
        const onPlay = () => setIsPlaying(true);
        const onEnded = () => {
            setIsPlaying(false);
            const ep = episodeRef.current;
            if (ep) {
                persist(true);
                setQueue((q) => q.filter((x) => x.id !== ep.id));
            }
            if (sleepRef.current.mode.kind === 'end-of-episode') {
                setSleepState({ mode: { kind: 'off' }, deadline: null });
                return;
            }
            if (prefsRef.current.continuousPlay) playNextInQueue();
        };
        const onHide = () => { if (document.visibilityState === 'hidden') persist(); };

        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('loadedmetadata', onMeta);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('ended', onEnded);
        document.addEventListener('visibilitychange', onHide);
        audio.playbackRate = rateRef.current;
        audio.volume = readStored('podcatch_volume', 1);

        return () => {
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('loadedmetadata', onMeta);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('ended', onEnded);
            document.removeEventListener('visibilitychange', onHide);
            audio.pause();
        };
    }, [persist, playNextInQueue]);

    // ------------------------------------------------------------ controls
    const seek = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        const known = Number.isFinite(audio.duration);
        // Browsers don't fire "ended" for a jump to the exact last instant, so
        // a jump to the end lands just before it and finishes by playing.
        const max = known ? Math.max(0, audio.duration - 0.25) : time;
        audio.currentTime = Math.max(0, Math.min(time, max));
        setCurrentTime(audio.currentTime);
    }, []);

    const skipBack = useCallback(() => {
        const a = audioRef.current;
        if (a) seek(a.currentTime - prefsRef.current.skipBackSec);
    }, [seek]);

    const skipForward = useCallback(() => {
        const a = audioRef.current;
        if (a) seek(a.currentTime + prefsRef.current.skipForwardSec);
    }, [seek]);

    const play = useCallback((episode: Episode) => {
        const audio = audioRef.current;
        if (!audio) return;
        if (episodeRef.current?.id === episode.id && audio.src) {
            audio.play().then(() => setIsPlaying(true)).catch((e) => console.error('Playback failed:', e));
            return;
        }
        startEpisode(episode);
    }, [startEpisode]);

    const toggle = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !episodeRef.current) return;
        if (!audio.paused) {
            audio.pause();
        } else {
            audio.play().then(() => setIsPlaying(true)).catch((e) => console.error('Playback failed:', e));
        }
    }, []);

    const close = useCallback(() => {
        const audio = audioRef.current;
        persist();
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }
        // Clear the OS media widget so it doesn't keep showing the closed episode
        // with live (but now dead) play/pause controls.
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            for (const action of ['play', 'pause', 'seekbackward', 'seekforward', 'seekto', 'nexttrack', 'previoustrack'] as const) {
                try { navigator.mediaSession.setActionHandler(action, null); } catch { /* unsupported action */ }
            }
        }
        episodeRef.current = null;
        setCurrentEpisode(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    }, [persist]);

    /** Change the speed now without changing the person's usual speed. */
    const applyRate = useCallback((rate: number) => {
        setPlaybackRateState(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
    }, []);

    /** The person's usual speed, used for every show without its own. */
    const setPlaybackRate = useCallback((rate: number) => {
        applyRate(rate);
        try { localStorage.setItem('podcatch_playback_rate', String(rate)); } catch { /* storage blocked */ }
    }, [applyRate]);

    const setVolume = useCallback((vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        setVolumeState(clamped);
        if (audioRef.current) audioRef.current.volume = clamped;
        try { localStorage.setItem('podcatch_volume', String(clamped)); } catch { /* storage blocked */ }
    }, []);

    const setSilenceSkip = useCallback((enabled: boolean) => {
        setSilenceSkipState(enabled);
        try { localStorage.setItem('podcatch_silence_skip', String(enabled)); } catch { /* storage blocked */ }
    }, []);

    const updatePrefs = useCallback((p: Partial<Pick<PlayerPrefs, 'skipBackSec' | 'skipForwardSec' | 'continuousPlay'>>) => {
        setPrefs((cur) => ({ ...cur, ...p }));
        if (signedIn) updatePlayerPrefs(p).catch(() => {});
    }, [signedIn]);

    const setShowSpeed = useCallback((feedId: string, rate: number | null) => {
        setPrefs((cur) => {
            const showSpeeds = { ...cur.showSpeeds };
            if (rate === null) delete showSpeeds[feedId]; else showSpeeds[feedId] = rate;
            return { ...cur, showSpeeds };
        });
        if (episodeRef.current?.feedId === feedId) applyRate(rate ?? readStored('podcatch_playback_rate', 1));
        if (signedIn) setShowSpeedAction(feedId, rate).catch(() => {});
    }, [signedIn, applyRate]);

    // Queue changes show at once and are reconciled with the server after.
    const addToQueue = useCallback((episode: Episode | PlayerEpisode, where: 'next' | 'end') => {
        const item: PlayerEpisode = {
            id: episode.id,
            title: episode.title,
            audioUrl: episode.audioUrl,
            youtubeId: 'youtubeId' in episode ? episode.youtubeId : null,
            status: 'status' in episode ? episode.status : 'COMPLETED',
            publishedAt: 'publishedAt' in episode ? episode.publishedAt : new Date().toISOString(),
            feedId: episode.feedId ?? '',
            feedTitle: episode.feedTitle ?? null,
            image: episode.image ?? null,
            positionSec: episode.positionSec ?? 0,
            durationSec: episode.durationSec ?? null,
            completed: !!episode.completed,
        };
        setQueue((q) => {
            const rest = q.filter((x) => x.id !== item.id);
            if (where === 'end') return [...rest, item];
            const i = rest.findIndex((x) => x.id === episodeRef.current?.id);
            const at = i === -1 ? 0 : i + 1;
            return [...rest.slice(0, at), item, ...rest.slice(at)];
        });
        if (signedIn) addToQueueAction(episode.id, where, episodeRef.current?.id).then(refreshQueue).catch(() => {});
    }, [signedIn, refreshQueue]);

    const removeFromQueue = useCallback((episodeId: string) => {
        setQueue((q) => q.filter((x) => x.id !== episodeId));
        if (signedIn) removeFromQueueAction(episodeId).catch(() => {});
    }, [signedIn]);

    const moveInQueue = useCallback((episodeId: string, direction: 'up' | 'down') => {
        setQueue((q) => {
            const i = q.findIndex((x) => x.id === episodeId);
            const j = direction === 'up' ? i - 1 : i + 1;
            if (i === -1 || j < 0 || j >= q.length) return q;
            const copy = [...q];
            [copy[i], copy[j]] = [copy[j], copy[i]];
            return copy;
        });
        if (signedIn) moveInQueueAction(episodeId, direction).catch(() => {});
    }, [signedIn]);

    const clearQueue = useCallback(() => {
        setQueue([]);
        if (signedIn) clearQueueAction().catch(() => {});
    }, [signedIn]);

    const markPlayed = useCallback((episodeId: string, played: boolean) => {
        if (played) setQueue((q) => q.filter((x) => x.id !== episodeId));
        if (signedIn) setPlayed(episodeId, played).catch(() => {});
    }, [signedIn]);

    const setSleep = useCallback((mode: SleepMode) => {
        setSleepState({ mode, deadline: sleepDeadline(mode, Date.now()) });
    }, []);

    // ------------------------------------------------------------ lock screen
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentEpisode) return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentEpisode.title,
            artist: currentEpisode.feedTitle || 'Podcatch',
            artwork: currentEpisode.image ? [{ src: currentEpisode.image, sizes: '512x512', type: 'image/jpeg' }] : [],
        });
        const ms = navigator.mediaSession;
        const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
            try { ms.setActionHandler(action, handler); } catch { /* unsupported action */ }
        };
        set('play', () => { audioRef.current?.play().catch(() => {}); });
        set('pause', () => { audioRef.current?.pause(); });
        set('seekbackward', (d) => seek((audioRef.current?.currentTime || 0) - (d.seekOffset || prefsRef.current.skipBackSec)));
        set('seekforward', (d) => seek((audioRef.current?.currentTime || 0) + (d.seekOffset || prefsRef.current.skipForwardSec)));
        set('seekto', (d) => { if (d.seekTime !== undefined) seek(d.seekTime); });
        set('previoustrack', () => seek(0));
        set('nexttrack', queue.some((q) => q.id !== currentEpisode.id) ? () => playNextInQueue() : null);
    }, [currentEpisode, queue, seek, playNextInQueue]);

    // Memoized so the value only changes on real state changes, not on every
    // currentTime tick.
    const value = useMemo<AudioContextType>(() => ({
        currentEpisode, isPlaying, duration, playbackRate, volume, playHistory,
        play, toggle, seek, close, setPlaybackRate, setVolume, silenceSkip, setSilenceSkip,
        signedIn, prefs, updatePrefs, setShowSpeed, skipBack, skipForward,
        queue, refreshQueue, addToQueue, removeFromQueue, moveInQueue, clearQueue, playNextInQueue, markPlayed,
        sleep, setSleep,
    }), [
        currentEpisode, isPlaying, duration, playbackRate, volume, playHistory,
        play, toggle, seek, close, setPlaybackRate, setVolume, silenceSkip, setSilenceSkip,
        signedIn, prefs, updatePrefs, setShowSpeed, skipBack, skipForward,
        queue, refreshQueue, addToQueue, removeFromQueue, moveInQueue, clearQueue, playNextInQueue, markPlayed,
        sleep, setSleep,
    ]);

    return (
        <AudioContext.Provider value={value}>
            <AudioTimeContext.Provider value={currentTime}>
                {children}
            </AudioTimeContext.Provider>
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

/** Subscribe to the live playback position separately from useAudio(), so
 *  components that don't need it don't re-render ~4x/sec during playback. */
export function useAudioTime() {
    return useContext(AudioTimeContext);
}

/** YouTube episodes play on their own page; everything else plays here. */
export function isPlayableHere(e: { audioUrl: string; youtubeId?: string | null }) {
    return !e.youtubeId && (/^https?:\/\//.test(e.audioUrl) || e.audioUrl.startsWith('/'));
}
