
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    process.exit(1);
}

async function main() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Fetching models from:", url.replace(apiKey, 'HIDDEN'));

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return;
        }

        const data = await res.json();
        console.log("--- MODEL LIST ---");
        // @ts-ignore
        data.models?.forEach(m => {
            if (m.name.includes('gemini')) {
                console.log(m.name.replace('models/', ''));
            }
        });
        console.log("------------------");

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

main();
