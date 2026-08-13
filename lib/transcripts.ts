/**
 * Publisher-supplied transcripts from the RSS <podcast:transcript> tag.
 *
 * The declared MIME type is treated as a hint, never as a contract. What a
 * publisher advertises and what it serves are different things: a URL may 404,
 * a "vtt" may arrive empty, and the JSON transcript spec permits segment-level
 * timing as readily as word-level. So every candidate is fetched, parsed and
 * validated, and anything unusable falls through to the next candidate and
 * finally to Deepgram.
 *
 * Preference, best first:
 *   1. JSON, when it turns out to be word-level  -> drives Insight.wordTimestamps,
 *      so the animated transcript and silence skipper work without transcription
 *   2. VTT  -> cue-level timing, plus speaker names in <v ...> spans
 *   3. SRT  -> cue-level timing
 *   4. JSON that is only phrase/sentence-level -> cue-level equivalent, used only
 *      when nothing above is available
 * Plain text and HTML are never used: they carry no dependable timing, and the
 * pipeline asks the model for [MM:SS] chapters and citations regardless, so an
 * untimed transcript produces fabricated ones.
 */

export type TranscriptKind = 'json' | 'vtt' | 'srt';
export type TranscriptSource = { url: string; type?: string; kind: TranscriptKind };
export type WordTimestamp = { word: string; start: number; end: number; speaker?: number };

export type ParsedTranscript = {
    rawTranscript: string;
    timestampedTranscript: string;
    /** Only present when a word-level source was used. */
    wordTimestamps?: WordTimestamp[];
    kind: TranscriptKind;
    granularity: 'word' | 'cue';
};

export type TranscriptTag = { url?: string; type?: string };

/** Max bytes we will pull for a single transcript; word-level JSON runs ~1MB. */
const MAX_BYTES = 12 * 1024 * 1024;
/** At or below this many words per segment, a JSON transcript is word-level. */
const WORD_LEVEL_MAX_AVG = 1.6;

const KIND_PATTERNS: { kind: TranscriptKind; type: RegExp; ext: RegExp }[] = [
    { kind: 'json', type: /json/i, ext: /\.json(\?|$)/i },
    { kind: 'vtt', type: /vtt/i, ext: /\.vtt(\?|$)/i },
    { kind: 'srt', type: /subrip|x-subrip|\bsrt\b/i, ext: /\.srt(\?|$)/i },
];

/**
 * Rank the tags on one RSS item into an ordered candidate list.
 * Order is json, vtt, srt — JSON first because it is the only publisher format
 * that can be word-level; if it turns out not to be, the caller falls onward.
 */
export function collectTranscriptSources(tags: TranscriptTag[]): TranscriptSource[] {
    const out: TranscriptSource[] = [];
    for (const { kind, type, ext } of KIND_PATTERNS) {
        for (const t of tags) {
            if (!t?.url) continue;
            const matches = (t.type && type.test(t.type)) || (!t.type && ext.test(t.url)) || ext.test(t.url);
            // Dedupe per (url, kind): when a tag's declared type and its extension
            // disagree (e.g. a .vtt served as application/json), keep BOTH candidates
            // so a failed json parse still falls through to the vtt attempt instead
            // of discarding a usable transcript.
            if (matches && !out.some(o => o.url === t.url && o.kind === kind)) out.push({ url: t.url, type: t.type, kind });
        }
    }
    return out;
}

/** Back-compat helper: the single best cue-timed URL, or null. */
export function selectTranscriptSource(tags: TranscriptTag[]): { url: string; format: TranscriptKind } | null {
    const first = collectTranscriptSources(tags)[0];
    return first ? { url: first.url, format: first.kind } : null;
}

const stamp = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const p = (n: number) => n.toString().padStart(2, '0');
    const h = Math.floor(s / 3600);
    // Emit [H:MM:SS] past the hour so timestamps past ~100 minutes don't collapse
    // to 3-digit minutes ([120:30]) that the [MM:SS]/[HH:MM:SS] extractors can't parse.
    return h > 0
        ? `[${h}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}]`
        : `[${p(Math.floor(s / 60))}:${p(s % 60)}]`;
};

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Map free-form speaker labels onto the numeric ids the UI groups paragraphs by. */
function speakerNumberer() {
    const seen = new Map<string, number>();
    return (raw: unknown): number | undefined => {
        if (raw == null) return undefined;
        if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
        const key = String(raw).trim();
        if (!key) return undefined;
        const digits = key.match(/(\d+)\s*$/);           // SPEAKER_02, Speaker 1
        if (digits) return parseInt(digits[1], 10);
        if (!seen.has(key)) seen.set(key, seen.size);
        return seen.get(key);
    };
}

/** Group timed items into readable `[MM:SS] Speaker: text` blocks. */
function toBlocks(items: { start: number; text: string; speaker?: number }[]): string {
    const blocks: { start: number; speaker?: number; text: string }[] = [];
    for (const it of items) {
        const last = blocks[blocks.length - 1];
        if (last && last.speaker === it.speaker && last.text.length + it.text.length < 400) {
            last.text += ' ' + it.text;
        } else {
            blocks.push({ start: it.start, speaker: it.speaker, text: it.text });
        }
    }
    return blocks
        .map(b => `${stamp(b.start)} ${b.speaker !== undefined ? `Speaker ${b.speaker}: ` : ''}${b.text}`)
        .join('\n\n');
}

// ---------------------------------------------------------------- VTT / SRT

const TIMING = /(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;
const toSeconds = (h: string | undefined, m: string, s: string, ms: string) =>
    (parseInt(h || '0', 10) || 0) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms.padEnd(3, '0'), 10) / 1000;

/**
 * Parse WebVTT or SubRip. They differ only in a header line, the decimal
 * separator and VTT's inline tags, so one pass covers both.
 * Returns null when no cue survives, so the caller can fall through.
 */
export function parseCueTranscript(body: string): ParsedTranscript | null {
    if (!body || !body.includes('-->')) return null;
    const isVtt = /^﻿?WEBVTT/.test(body.trimStart());
    const text = body.replace(/\r\n/g, '\n').replace(/^﻿/, '');
    const num = speakerNumberer();
    const cues: { start: number; text: string; speaker?: number }[] = [];

    for (const block of text.split(/\n{2,}/)) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        if (/^(WEBVTT|NOTE\b|STYLE\b|REGION\b)/.test(lines[0])) continue;

        const idx = lines.findIndex(l => TIMING.test(l));
        if (idx === -1) continue;
        const m = lines[idx].match(TIMING)!;
        const start = toSeconds(m[1]?.replace(':', ''), m[2], m[3], m[4]);
        if (!finite(start)) continue;

        let speakerRaw: string | undefined;
        let payload = lines.slice(idx + 1).join(' ')
            .replace(/<v\s+([^>]+)>/gi, (_x, who) => { speakerRaw ??= String(who).trim(); return ''; })
            .replace(/<\/v>/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim();
        if (!payload) continue;

        // SRT carries the speaker inline ("Speaker 1: hello"); lift it out so it
        // does not pollute the prose the model reads.
        if (!speakerRaw) {
            const inline = payload.match(/^([A-Z][\w .'-]{0,30}?):\s+/);
            if (inline) { speakerRaw = inline[1].trim(); payload = payload.slice(inline[0].length); }
        }
        if (!payload.trim()) continue;
        cues.push({ start, text: payload.trim(), speaker: num(speakerRaw) });
    }

    if (!cues.length) return null;
    cues.sort((a, b) => a.start - b.start);
    return {
        kind: isVtt ? 'vtt' : 'srt',
        granularity: 'cue',
        rawTranscript: cues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim(),
        timestampedTranscript: toBlocks(cues),
    };
}

// -------------------------------------------------------------------- JSON

/**
 * Parse a podcast-namespace JSON transcript.
 *
 * The spec fixes neither field names nor granularity in practice, so this is
 * deliberately permissive about shape and strict about substance: it accepts
 * several field spellings, then decides word-vs-cue from the data itself rather
 * than from anything the publisher claims. Returns null if the payload has no
 * usable timing at all.
 */
export function parseJsonTranscript(body: string): ParsedTranscript | null {
    let doc: any;
    try { doc = JSON.parse(body); } catch { return null; }

    const segs: any[] = Array.isArray(doc) ? doc
        : Array.isArray(doc?.segments) ? doc.segments
            : Array.isArray(doc?.results) ? doc.results
                : Array.isArray(doc?.transcript) ? doc.transcript
                    : [];
    if (!segs.length) return null;

    const num = speakerNumberer();
    const items: { start: number; end: number; text: string; speaker?: number }[] = [];
    for (const s of segs) {
        const text = String(s?.body ?? s?.text ?? s?.word ?? '').trim();
        if (!text) continue;
        // `*Ms` fields are explicitly milliseconds → always convert. `start` /
        // `startTime` are ambiguous (seconds or ms), so only for those do we fall
        // back to the magnitude heuristic. Applying that heuristic to a known-ms
        // value below 100_000 (e.g. 50000ms = 50s) is what scrambled the first
        // ~100s of ms-format publisher transcripts.
        const startIsMs = !finite(s?.startTime) && !finite(s?.start) && finite(s?.startMs);
        const endIsMs = !finite(s?.endTime) && !finite(s?.end) && finite(s?.endMs);
        const start = s?.startTime ?? s?.start ?? s?.startMs;
        const end = s?.endTime ?? s?.end ?? s?.endMs;
        if (!finite(start)) continue;                     // untimed segment: unusable
        const st = startIsMs ? start / 1000 : (start > 100_000 ? start / 1000 : start);
        const en = !finite(end) ? st
            : endIsMs ? end / 1000
                : (end > 100_000 ? end / 1000 : end);
        items.push({ start: st, end: Math.max(en, st), text, speaker: num(s?.speaker ?? s?.speaker_id) });
    }
    // require timing on effectively all of it, not just a lucky prefix
    if (!items.length || items.length < segs.length * 0.8) return null;

    items.sort((a, b) => a.start - b.start);
    const avgWords = items.reduce((n, i) => n + i.text.split(/\s+/).filter(Boolean).length, 0) / items.length;
    const wordLevel = avgWords <= WORD_LEVEL_MAX_AVG;

    const rawTranscript = items.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
    if (!rawTranscript) return null;

    return {
        kind: 'json',
        granularity: wordLevel ? 'word' : 'cue',
        rawTranscript,
        timestampedTranscript: toBlocks(items),
        wordTimestamps: wordLevel
            ? items.map(i => ({ word: i.text, start: i.start, end: i.end, speaker: i.speaker }))
            : undefined,
    };
}

// --------------------------------------------------------------- resolution

async function fetchText(url: string, fetchImpl: typeof fetch): Promise<string | null> {
    try {
        const res = await fetchImpl(url, { headers: { 'User-Agent': 'Podcatch/1.0 (compatible; RSS Reader)' } });
        if (!res.ok) return null;
        const len = Number(res.headers.get('content-length') || 0);
        if (len && len > MAX_BYTES) return null;
        const text = await res.text();
        return text.length > MAX_BYTES ? null : text;
    } catch { return null; }
}

/**
 * Try each candidate in preference order and return the first genuinely usable
 * transcript. A phrase-level JSON is held back and only used if no VTT/SRT
 * works, since cue-level VTT additionally carries speaker names.
 *
 * Returns null when nothing usable is on offer — the caller should transcribe.
 */
export async function resolvePublisherTranscript(
    sources: TranscriptSource[],
    fetchImpl: typeof fetch = fetch,
): Promise<ParsedTranscript | null> {
    let phraseLevelJson: ParsedTranscript | null = null;

    for (const src of sources) {
        const body = await fetchText(src.url, fetchImpl);
        if (!body) continue;

        if (src.kind === 'json') {
            const parsed = parseJsonTranscript(body);
            if (!parsed) continue;
            if (parsed.granularity === 'word') return parsed;   // best available, stop
            phraseLevelJson ??= parsed;                          // keep as a last resort
            continue;
        }

        const parsed = parseCueTranscript(body);
        if (parsed) return parsed;
    }

    return phraseLevelJson;
}
