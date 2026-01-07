
import 'dotenv/config';
import { createClient } from '@deepgram/sdk';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = createClient(deepgramApiKey);

async function main() {
    const targetUrl = "https://episodes.captivate.fm/episode/92197c49-f2ea-45bd-a0c9-032413a3b3e3.mp3";

    // 1. Check if we can fetch the file
    console.log("--- Connectivity Check ---");
    console.log("Target: ", targetUrl);
    try {
        const res = await fetch(targetUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Podcatch/1.0 (Test Script)'
            }
        });
        console.log(`URL Status: ${res.status} ${res.statusText}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        // If it's a redirect, fetch follows it by default, so 200 means success.
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

main();
