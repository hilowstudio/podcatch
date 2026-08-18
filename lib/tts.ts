import { GoogleGenAI } from '@google/genai';
import lamejs from '@breezystack/lamejs';

// Gemini 2.5 Flash TTS. Chosen for the weekly briefing: one model covers all of
// the app's supported languages, quality is NotebookLM-adjacent, and it's ~an
// order of magnitude cheaper than ElevenLabs. It returns 24 kHz / 16-bit / mono
// PCM, which we encode to MP3 here with a pure-JS encoder — no ffmpeg, so it runs
// fine inside the Inngest job on serverless.

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const SAMPLE_RATE = 24000; // Gemini TTS output rate
const DEFAULT_VOICE = 'Kore'; // warm, neutral narrator

export function isTtsConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
}

/** Synthesize `text` to an MP3 buffer, returning the clip duration in seconds. */
export async function textToMp3(
    text: string,
    voiceName: string = DEFAULT_VOICE,
): Promise<{ mp3: Buffer; durationSec: number }> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

    const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
        },
    });

    const b64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) {
        throw new Error('Gemini TTS returned no audio (check model access on the API key).');
    }
    const pcm = Buffer.from(b64, 'base64');
    const durationSec = Math.round(pcm.length / 2 / SAMPLE_RATE);

    return { mp3: pcmToMp3(pcm), durationSec };
}

/** Encode signed-16-bit-LE mono PCM to MP3 (128 kbps) with lamejs. */
function pcmToMp3(pcm: Buffer): Buffer {
    const encoder = new lamejs.Mp3Encoder(1, SAMPLE_RATE, 128);
    // Reinterpret the PCM bytes as Int16 samples.
    const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
    const blockSize = 1152; // lamejs works in 1152-sample frames
    const chunks: Buffer[] = [];

    for (let i = 0; i < samples.length; i += blockSize) {
        const slice = samples.subarray(i, i + blockSize);
        const encoded = encoder.encodeBuffer(slice);
        if (encoded.length > 0) chunks.push(Buffer.from(encoded));
    }
    const tail = encoder.flush();
    if (tail.length > 0) chunks.push(Buffer.from(tail));

    return Buffer.concat(chunks);
}
