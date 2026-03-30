import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Changelog - Podcatch',
    description: 'What\'s new in Podcatch — features, improvements, and fixes.',
};

const entries = [
    {
        version: '0.3.0',
        date: '2026-03-28',
        changes: [
            { type: 'added' as const, text: 'QSF compliance: full data export (JSON) from Settings' },
            { type: 'added' as const, text: 'QSF compliance: in-app account deletion with confirmation' },
            { type: 'added' as const, text: 'QSF compliance: plain-language summaries on Privacy Policy and Terms of Service' },
            { type: 'added' as const, text: 'QSF compliance: post-cancellation data access policy (90 days)' },
            { type: 'added' as const, text: 'QSF compliance: service discontinuation notice policy (30 days)' },
            { type: 'added' as const, text: 'Public changelog and help/FAQ pages' },
        ],
    },
    {
        version: '0.2.0',
        date: '2026-03-27',
        changes: [
            { type: 'added' as const, text: 'Prompt template gallery with clone and share functionality' },
            { type: 'added' as const, text: 'Entity-level and collection-level chat' },
            { type: 'added' as const, text: 'ORGANIZATION and TECHNOLOGY entity types in knowledge graph' },
            { type: 'added' as const, text: 'Podcast discovery tab on search page' },
            { type: 'added' as const, text: 'Daily/weekly email digest via Resend' },
            { type: 'added' as const, text: 'Animated word-level transcript viewer with silence skipping' },
            { type: 'added' as const, text: 'Playback speed and volume controls with localStorage persistence' },
            { type: 'added' as const, text: 'Auto-process toggle for new episodes' },
        ],
    },
    {
        version: '0.1.0',
        date: '2026-01-13',
        changes: [
            { type: 'added' as const, text: 'Initial release: podcast aggregation, transcription, and AI insights' },
            { type: 'added' as const, text: 'Knowledge graph with entity extraction' },
            { type: 'added' as const, text: 'Semantic search across episode library' },
            { type: 'added' as const, text: 'Collections with AI meta-synthesis' },
            { type: 'added' as const, text: 'Custom prompts and brand voice' },
            { type: 'added' as const, text: 'Integrations: Notion, Readwise, Google Drive, Claude Projects' },
            { type: 'added' as const, text: 'PWA with offline support' },
            { type: 'added' as const, text: 'Free, Basic, and Pro subscription tiers via Stripe' },
        ],
    },
];

const typeBadge = {
    added: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    changed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    fixed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function ChangelogPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4 space-y-8">
            <div className="space-y-4">
                <Link href="/" className="text-sm text-primary hover:underline">&larr; Back to Home</Link>
                <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
                <p className="text-muted-foreground">What&apos;s new in Podcatch — features, improvements, and fixes.</p>
            </div>

            <div className="space-y-10">
                {entries.map(entry => (
                    <section key={entry.version} className="space-y-3">
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-xl font-semibold">v{entry.version}</h2>
                            <span className="text-sm text-muted-foreground">{entry.date}</span>
                        </div>
                        <ul className="space-y-2">
                            {entry.changes.map((change, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mt-0.5 ${typeBadge[change.type]}`}>
                                        {change.type}
                                    </span>
                                    <span>{change.text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
