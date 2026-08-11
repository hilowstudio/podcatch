/**
 * Publisher-supplied transcripts from the RSS <podcast:transcript> tag.
 *
 * Only cue-timed formats are accepted: WebVTT and SubRip. Both carry a
 * `--> ` timing line by definition, so timing is guaranteed by the format
 * rather than by publisher goodwill. Plain text and HTML carry no dependable
 * timing, and an untimed transcript is worse than none here — the pipeline
 * asks the model for [MM:SS] chapters and citations regardless, so it would
 * invent them.
 *
 * Everything else falls through to Deepgram, which is also the only source of
 * word-level timing (Insight.wordTimestamps) for the animated transcript.
 */

export type TranscriptCue = { start: number; end: number; text: string; speaker?: string };

export type ParsedTranscript = {
    /** Plain prose, no timings — what the model reads. */
    rawTranscript: string;
    /** `[MM:SS] text` blocks — what drives chapters and citations. */
    timestampedTranscript: string;
    cues: TranscriptCue[];
    format: 'vtt' | 'srt';
};

/** MIME types we can trust to carry cue timing, best first. */
const ACCEPTED: { test: RegExp; format: 'vtt' | 'srt' }[] = [
    // VTT first: same timing as SRT, but speaker survives in <v ...> tags
    { test: /vtt/i, format: 'vtt' },
    { test: /subrip|x-subrip|\bsrt\b/i, format: 'srt' },
];

export type TranscriptTag = { url?: string; type?: string };

/**
 * Pick the best usable transcript from the tags on one RSS item.
 * Returns null when the item offers nothing cue-timed (plain, HTML, JSON).
 */
export function selectTranscriptSource(tags: TranscriptTag[]): { url: string; format: 'vtt' | 'srt' } | null {
    for (const { test, format } of ACCEPTED) {
        const hit = tags.find(t => t?.url && t?.type && test.test(t.type));
        if (hit?.url) return { url: hit.url, format };
    }
    // Some publishers omit `type`; fall back to the file extension.
    const byExt = tags.find(t => /\.vtt(\?|$)/i.test(t?.url || '')) ;
    if (byExt?.url) return { url: byExt.url, format: 'vtt' };
    const srtExt = tags.find(t => /\.srt(\?|$)/i.test(t?.url || ''));
    if (srtExt?.url) return { url: srtExt.url, format: 'srt' };
    return null;
}

const TIMING = /(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;

function toSeconds(h: string | undefined, m: string, s: string, ms: string) {
    return (parseInt(h || '0', 10) || 0) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms.padEnd(3, '0'), 10) / 1000;
}

const stamp = (sec: number) =>
    `[${Math.floor(sec / 60).toString().padStart(2, '0')}:${Math.floor(sec % 60).toString().padStart(2, '0')}]`;

/**
 * Parse WebVTT or SubRip. The two differ only in a header line, the decimal
 * separator and VTT's inline tags, so one pass handles both — and the content
 * is what's trusted, not the declared MIME type.
 *
 * Returns null if no cue survives, so callers fall back to transcription
 * rather than storing an empty or malformed transcript.
 */
export function parseCueTranscript(body: string): ParsedTranscript | null {
    if (!body || !body.includes('-->')) return null;

    const isVtt = /^﻿?WEBVTT/.test(body.trimStart());
    const text = body.replace(/\r\n/g, '\n').replace(/^﻿/, '');
    const cues: TranscriptCue[] = [];

    for (const block of text.split(/\n{2,}/)) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        if (/^WEBVTT/.test(lines[0]) || /^NOTE\b/.test(lines[0]) || /^STYLE\b/.test(lines[0])) continue;

        const idx = lines.findIndex(l => TIMING.test(l));
        if (idx === -1) continue;
        const m = lines[idx].match(TIMING);
        if (!m) continue;

        const start = toSeconds(m[1]?.replace(':', ''), m[2], m[3], m[4]);
        const end = toSeconds(m[5]?.replace(':', ''), m[6], m[7], m[8]);

        let speaker: string | undefined;
        const payload = lines.slice(idx + 1).join(' ')
            // VTT voice spans: <v Speaker>text</v>
            .replace(/<v\s+([^>]+)>/gi, (_x, who) => { speaker ??= String(who).trim(); return ''; })
            .replace(/<\/v>/gi, '')
            // any other VTT/HTML markup (<b>, <i>, <c.colour>, timestamps)
            .replace(/<[^>]+>/g, '')
            .trim();
        if (!payload) continue;

        // SRT carries the speaker inline ("Speaker 1: hello") — lift it out so it
        // does not pollute the prose the model reads.
        let body2 = payload;
        if (!speaker) {
            const inline = body2.match(/^([A-Z][\w .'-]{0,30}?):\s+/);
            if (inline) { speaker = inline[1].trim(); body2 = body2.slice(inline[0].length); }
        }
        if (!body2.trim()) continue;

        cues.push({ start, end, text: body2.trim(), speaker });
    }

    if (!cues.length) return null;

    // Merge consecutive cues into readable blocks so the timestamped view is not
    // one line per two seconds. Break on speaker change or ~400 chars.
    const blocks: { start: number; speaker?: string; text: string }[] = [];
    for (const cue of cues) {
        const last = blocks[blocks.length - 1];
        if (last && last.speaker === cue.speaker && last.text.length + cue.text.length < 400) {
            last.text += ' ' + cue.text;
        } else {
            blocks.push({ start: cue.start, speaker: cue.speaker, text: cue.text });
        }
    }

    return {
        cues,
        format: isVtt ? 'vtt' : 'srt',
        rawTranscript: cues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim(),
        timestampedTranscript: blocks
            .map(b => `${stamp(b.start)} ${b.speaker ? `${b.speaker}: ` : ''}${b.text}`)
            .join('\n\n'),
    };
}
