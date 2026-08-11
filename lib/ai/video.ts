import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { MODELS } from './models';

/**
 * Native video understanding for YouTube episodes.
 *
 * Gemini can watch a YouTube URL directly, which is the only option when a video
 * has no captions — and more thorough than captions when it does, since the model
 * sees slides, demonstrations and on-screen text as well as hearing the audio.
 * It is also more expensive: video is billed per second of footage, whereas
 * captions are free. Callers should therefore try captions first and reach for
 * this when they are absent (or when thoroughness is worth the spend).
 *
 * The URL must be passed as a `file` part. Putting it in a text prompt — as this
 * pipeline used to — does not make the model fetch anything; it simply invites a
 * plausible-sounding answer about a video it never saw.
 */

export type VideoTranscript = {
    rawTranscript: string;
    timestampedTranscript: string;
    /** Seconds covered by the last timestamp, for truncation reporting. */
    lastTimestamp: number;
    lines: number;
};

const LINE = /^\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(.+)$/;

/** Build the `file` part that actually carries the video to the model. */
export function videoPart(videoUrl: string) {
    return { type: 'file' as const, data: videoUrl, mediaType: 'video/mp4' };
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
): Promise<VideoTranscript | null> {
    const google = createGoogleGenerativeAI({ apiKey });

    const { text } = await generateText({
        model: google(MODELS.insights),
        maxOutputTokens: 64_000,
        messages: [{
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: [
                        'Transcribe this video in full, verbatim.',
                        'Output one line per utterance, each beginning with a [MM:SS] timestamp.',
                        'Attribute speakers inline as "Speaker 1:" when more than one person talks.',
                        'Do not summarise, comment, or add anything that is not spoken.',
                    ].join('\n'),
                },
                videoPart(videoUrl),
            ],
        }] as any,
    });

    const lines: { at: number; text: string }[] = [];
    for (const rawLine of text.split('\n')) {
        const m = rawLine.trim().match(LINE);
        if (!m) continue;
        const at = m[3]
            ? parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10)
            : parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        const body = m[4].trim();
        if (body) lines.push({ at, text: body });
    }

    // Too thin to be a genuine transcript — treat as failure rather than store a stub.
    const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
    if (lines.length < 20 || words < 200) return null;

    return {
        lines: lines.length,
        lastTimestamp: lines[lines.length - 1].at,
        rawTranscript: lines.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim(),
        timestampedTranscript: lines
            .map(l => `[${Math.floor(l.at / 60).toString().padStart(2, '0')}:${(l.at % 60).toString().padStart(2, '0')}] ${l.text}`)
            .join('\n'),
    };
}
