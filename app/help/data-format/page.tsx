import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Export Format - Podcatch',
    description: 'Documentation for the Podcatch JSON data export format.',
};

export default function DataFormatPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4 space-y-8">
            <div className="space-y-4">
                <Link href="/help" className="text-sm text-primary hover:underline">&larr; Back to Help</Link>
                <h1 className="text-4xl font-bold tracking-tight">Data Export Format</h1>
                <p className="text-muted-foreground">
                    Complete documentation of the JSON file produced by &quot;Export My Data&quot; in Settings.
                </p>
            </div>

            <article className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold">Overview</h2>
                    <p>
                        The export is a single JSON file containing all your Podcatch data. The format is versioned (currently <code>1.0</code>) and designed for portability. The file is named <code>podcatch-export-YYYY-MM-DD.json</code>.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Top-Level Structure</h2>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">{`{
  "exportVersion": "1.0",
  "exportDate": "2026-03-28T12:00:00.000Z",
  "product": "Podcatch",
  "user": { ... },
  "subscriptions": [ ... ],
  "episodes": [ ... ],
  "collections": [ ... ],
  "customPrompts": [ ... ],
  "snips": [ ... ],
  "notifications": [ ... ]
}`}</pre>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Field Reference</h2>

                    <h3 className="text-xl font-semibold mt-6">user</h3>
                    <p>Your account profile.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>id</code></td><td>string</td><td>Unique user ID</td></tr>
                            <tr><td><code>name</code></td><td>string | null</td><td>Display name</td></tr>
                            <tr><td><code>email</code></td><td>string</td><td>Email address</td></tr>
                            <tr><td><code>image</code></td><td>string | null</td><td>Avatar URL</td></tr>
                            <tr><td><code>brandVoice</code></td><td>string | null</td><td>Your Brand Voice prompt</td></tr>
                            <tr><td><code>digestFrequency</code></td><td>string</td><td>NONE, DAILY, or WEEKLY</td></tr>
                            <tr><td><code>createdAt</code></td><td>ISO 8601</td><td>Account creation date</td></tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-6">subscriptions[]</h3>
                    <p>Your podcast feed subscriptions.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>feedUrl</code></td><td>string</td><td>RSS feed URL (importable into any podcast app)</td></tr>
                            <tr><td><code>feedTitle</code></td><td>string | null</td><td>Podcast name</td></tr>
                            <tr><td><code>feedType</code></td><td>string</td><td>RSS or YOUTUBE</td></tr>
                            <tr><td><code>autoProcess</code></td><td>boolean</td><td>Whether new episodes auto-process</td></tr>
                            <tr><td><code>subscribedAt</code></td><td>ISO 8601</td><td>Subscription date</td></tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-6">episodes[]</h3>
                    <p>All processed episodes with AI insights.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>title</code></td><td>string</td><td>Episode title</td></tr>
                            <tr><td><code>audioUrl</code></td><td>string</td><td>Direct audio file URL</td></tr>
                            <tr><td><code>publishedAt</code></td><td>ISO 8601</td><td>Publication date</td></tr>
                            <tr><td><code>feedTitle</code></td><td>string | null</td><td>Parent podcast name</td></tr>
                            <tr><td><code>feedUrl</code></td><td>string</td><td>Parent podcast RSS URL</td></tr>
                            <tr><td><code>summary</code></td><td>string | null</td><td>AI-generated 2-3 sentence summary</td></tr>
                            <tr><td><code>keyTakeaways</code></td><td>string[]</td><td>5 key bullet points</td></tr>
                            <tr><td><code>links</code></td><td>string[]</td><td>URLs mentioned in episode</td></tr>
                            <tr><td><code>socialContent</code></td><td>object | null</td><td>AI-generated tweet, LinkedIn post, blog title</td></tr>
                            <tr><td><code>chapters</code></td><td>object[]</td><td>Chapter markers with title, start time, reason</td></tr>
                            <tr><td><code>transcript</code></td><td>string | null</td><td>Full episode transcript (plain text with timestamps)</td></tr>
                            <tr><td><code>entities</code></td><td>object[]</td><td>People, books, concepts, orgs, tech mentioned</td></tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-6">collections[]</h3>
                    <p>Your episode collections with AI syntheses.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>title</code></td><td>string</td><td>Collection name</td></tr>
                            <tr><td><code>description</code></td><td>string | null</td><td>Collection description</td></tr>
                            <tr><td><code>episodes</code></td><td>string[]</td><td>Episode titles in this collection</td></tr>
                            <tr><td><code>syntheses</code></td><td>object[]</td><td>AI meta-syntheses with text and date</td></tr>
                            <tr><td><code>createdAt</code></td><td>ISO 8601</td><td>Collection creation date</td></tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-6">customPrompts[]</h3>
                    <p>Your custom AI analysis prompts.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>title</code></td><td>string</td><td>Prompt name</td></tr>
                            <tr><td><code>prompt</code></td><td>string</td><td>Prompt template text</td></tr>
                            <tr><td><code>category</code></td><td>string | null</td><td>business, education, research, or content</td></tr>
                            <tr><td><code>isPublic</code></td><td>boolean</td><td>Whether shared to gallery</td></tr>
                            <tr><td><code>createdAt</code></td><td>ISO 8601</td><td>Creation date</td></tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-6">snips[]</h3>
                    <p>Your audio clip bookmarks.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>content</code></td><td>string | null</td><td>Snip text content</td></tr>
                            <tr><td><code>episodeTitle</code></td><td>string</td><td>Source episode</td></tr>
                            <tr><td><code>startTime</code></td><td>number</td><td>Start time in seconds</td></tr>
                            <tr><td><code>endTime</code></td><td>number</td><td>End time in seconds</td></tr>
                            <tr><td><code>note</code></td><td>string | null</td><td>Your note on the snip</td></tr>
                            <tr><td><code>createdAt</code></td><td>ISO 8601</td><td>Creation date</td></tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-semibold mt-6">notifications[]</h3>
                    <p>Your last 100 notifications.</p>
                    <table className="text-sm">
                        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>title</code></td><td>string</td><td>Notification title</td></tr>
                            <tr><td><code>message</code></td><td>string</td><td>Notification body</td></tr>
                            <tr><td><code>read</code></td><td>boolean</td><td>Read status</td></tr>
                            <tr><td><code>createdAt</code></td><td>ISO 8601</td><td>Notification date</td></tr>
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Importing Into Other Systems</h2>
                    <p>The export is designed for portability:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Podcast subscriptions:</strong> The <code>feedUrl</code> fields are standard RSS URLs. Import them into any podcast app (Apple Podcasts, Overcast, Pocket Casts) individually, or collect them into an OPML file.</li>
                        <li><strong>Transcripts:</strong> Plain text with timestamps. Copy into any note-taking app, search tool, or text editor.</li>
                        <li><strong>AI insights:</strong> Summaries, takeaways, and entities are structured JSON. Parse programmatically or read as plain text.</li>
                        <li><strong>Custom prompts:</strong> Plain text templates. Reusable in any AI tool that accepts prompt input.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Schema Versioning</h2>
                    <p>
                        The <code>exportVersion</code> field tracks the schema version. We will not remove fields from the export — new fields may be added in future versions. The current version is <code>1.0</code>.
                    </p>
                </section>
            </article>
        </div>
    );
}
