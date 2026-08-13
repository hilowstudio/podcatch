import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { MODELS } from './models';

/**
 * Native video understanding for YouTube episodes.
 *
 * Gemini watches the video itself, so it captures what is shown as well as what
 * is said. That matters: for a lecture, demonstration, or explainer built around
 * diagrams, simulations and on-screen worked examples, the visual channel *is*
 * the content, and an audio-only transcript silently discards most of the value.
 *
 * The URL must be passed as a `file` part. Naming it in a text prompt does not
 * make the model fetch anything — it just invites a plausible answer about a
 * video it never saw.
 *
 * Cost note for callers, not a policy decision made here: video is billed per
 * second of footage (measured at ~5,460 tokens/minute), while captions are free.
 * Whether to prefer fidelity or cost belongs to the caller.
 */

export type VideoTranscript = {
    rawTranscript: string;
    timestampedTranscript: string;
    /** Seconds covered by the last timestamp, for truncation reporting. */
    lastTimestamp: number;
    lines: number;
    /** How many lines describe on-screen content rather than speech. */
    visualLines: number;
};

export type VideoTranscribeOptions = {
    /**
     * Record significant on-screen content — diagrams, equations, code, data,
     * demonstrations, labelled figures — alongside the speech.
     *
     * Defaults to true: it is the full-fidelity reading of the video, and for
     * visually-driven material it is the difference between a usable record and
     * a stenographer's account of someone pointing at something off-page. Turn
     * it off to spend fewer output tokens when only speech is wanted.
     */
    captureVisuals?: boolean;
};

const LINE = /^\[(\d{1,3}):(\d{2})(?::(\d{2}))?\]\s*(.+)$/;
const VISUAL = /^\(on screen:/i;

/** [H:MM:SS] past the hour, [MM:SS] under it — matched by the timestamp extractors. */
const hms = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const p = (n: number) => n.toString().padStart(2, '0');
    const h = Math.floor(s / 3600);
    return h > 0 ? `[${h}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}]` : `[${p(Math.floor(s / 60))}:${p(s % 60)}]`;
};

/** Build the `file` part that actually carries the video to the model. */
export function videoPart(videoUrl: string) {
    return { type: 'file' as const, data: videoUrl, mediaType: 'video/mp4' };
}

function buildPrompt(captureVisuals: boolean) {
    const base = [
        'Transcribe this video in full, verbatim.',
        'Output one line per utterance, each beginning with a [MM:SS] timestamp.',
        'Attribute speakers inline as "Speaker 1:" when more than one person talks.',
    ];
    if (!captureVisuals) {
        base.push('Transcribe speech only. Do not describe imagery.');
        return base.join('\n');
    }
    return [
        ...base,
        '',
        'The video may also convey meaning visually. Whenever the screen carries',
        'information that the narration does not fully state — a diagram, chart,',
        'equation, code, data, an experiment or demonstration, a labelled figure,',
        'or text shown on screen — add a separate timestamped line in the form:',
        '  [MM:SS] (on screen: concise factual description of what is shown)',
        'Describe what is actually displayed, including any values, labels or',
        'results legible on screen. Do not interpret, speculate, or editorialise,',
        'and do not describe purely decorative footage or a person simply talking.',
    ].join('\n');
}

/**
 * Ask Gemini to transcribe a video it can watch.
 *
 * Returns null when the result is too thin to be a real transcript, so the caller
 * can fall back to analysing the video directly rather than storing a stub.
 */
export async function transcribeVideoWithGemini(
    videoUrl: string,
    apiKey: string,
    opts: VideoTranscribeOptions = {},
): Promise<VideoTranscript | null> {
    const captureVisuals = opts.captureVisuals ?? true;
    const google = createGoogleGenerativeAI({ apiKey });

    const { text } = await generateText({
        model: google(MODELS.insights),
        maxOutputTokens: 64_000,
        messages: [{
            role: 'user',
            content: [
                { type: 'text', text: buildPrompt(captureVisuals) },
                videoPart(videoUrl),
            ],
        }] as any,
    });

    const lines: { at: number; text: string; visual: boolean }[] = [];
    for (const rawLine of text.split('\n')) {
        const m = rawLine.trim().match(LINE);
        if (!m) continue;
        const at = m[3]
            ? parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10)
            : parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        const body = m[4].trim();
        if (body) lines.push({ at, text: body, visual: VISUAL.test(body) });
    }

    // Too thin to be a genuine transcript — treat as failure rather than store a stub.
    const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
    if (lines.length < 20 || words < 200) return null;

    lines.sort((a, b) => a.at - b.at);

    return {
        lines: lines.length,
        visualLines: lines.filter(l => l.visual).length,
        lastTimestamp: lines[lines.length - 1].at,
        // Both channels feed the transcript: on-screen content must be searchable,
        // embeddable and available to chat, not discarded as presentation detail.
        rawTranscript: lines.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim(),
        timestampedTranscript: lines
            .map(l => `${hms(l.at)} ${l.text}`)
            .join('\n'),
    };
}
