import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Help & FAQ - Podcatch',
    description: 'Get help using Podcatch — frequently asked questions and how-to guides.',
};

const faqs = [
    {
        category: 'Getting Started',
        questions: [
            {
                q: 'How do I add a podcast?',
                a: 'Click "Add Feed" on your home page. You can search iTunes by name, paste an RSS feed URL directly, subscribe to a YouTube channel, or import an OPML file from another podcast app.',
            },
            {
                q: 'How does episode processing work?',
                a: 'When you click "Process Episode", Podcatch transcribes the audio using Deepgram, then uses AI (Gemini) to generate a summary, key takeaways, chapters, entities, and social content. Processing typically takes 1-3 minutes.',
            },
            {
                q: 'What is the Knowledge Graph?',
                a: 'The Knowledge Graph maps people, books, concepts, organizations, and technologies mentioned across your episodes. It shows connections between entities — helping you discover how ideas relate across different podcasts.',
            },
        ],
    },
    {
        category: 'Subscriptions & Billing',
        questions: [
            {
                q: 'What is included in the free plan?',
                a: 'The free plan lets you subscribe to podcasts, play episodes, and process a limited number of episodes per month. Upgrade to Basic or Pro for more processing capacity and advanced features like custom prompts and integrations.',
            },
            {
                q: 'How do I cancel my subscription?',
                a: 'Go to Settings, then click "Manage Subscription" to open the Stripe billing portal. You can cancel there — your access continues through the end of your current billing period.',
            },
            {
                q: 'What happens to my data after cancellation?',
                a: 'Your data remains accessible and exportable for 90 days after cancellation. After that period, it may be permanently deleted. We recommend exporting your data from Settings before your access expires.',
            },
        ],
    },
    {
        category: 'Features',
        questions: [
            {
                q: 'What are Collections?',
                a: 'Collections let you group episodes by topic. Once you have 2+ episodes in a collection, you can generate an AI synthesis that compares viewpoints across episodes. You can also chat with a collection to ask questions across all its episodes.',
            },
            {
                q: 'What are Custom Prompts?',
                a: 'Custom prompts let you run your own AI analysis on episodes. For example, "Extract all book recommendations" or "Summarize the marketing strategies discussed." Create prompts in Settings > Prompt Library.',
            },
            {
                q: 'What is Brand Voice?',
                a: 'Brand Voice lets you define your writing style. When set, AI-generated social content (tweets, LinkedIn posts) will match your tone and style preferences.',
            },
            {
                q: 'How does the email digest work?',
                a: 'Go to Settings and choose Daily or Weekly under Email Digest. You will receive a summary of newly processed episodes at 8am UTC with key takeaways from each episode.',
            },
        ],
    },
    {
        category: 'Your Data & Privacy',
        questions: [
            {
                q: 'How do I export my data?',
                a: 'Go to Settings and click "Export My Data." This downloads a JSON file containing all your subscriptions, episodes, transcripts, insights, collections, custom prompts, and snips.',
            },
            {
                q: 'How do I delete my account?',
                a: 'Go to Settings and scroll to the Danger Zone. Click "Delete Account" and type the confirmation phrase. All your data will be permanently and irreversibly destroyed.',
            },
            {
                q: 'Do you track my activity or sell my data?',
                a: 'No. Podcatch has zero analytics tracking, no advertising SDKs, and no data sharing with advertisers or data brokers. The only third parties that see your data are our AI providers (to generate insights) and Stripe (to process payments).',
            },
            {
                q: 'Is my data used to train AI models?',
                a: 'No. We do not use your private notes or custom prompts to train public models without your explicit consent. Transcripts are sent to AI providers for processing only.',
            },
        ],
    },
    {
        category: 'Technical Information',
        questions: [
            {
                q: 'How much storage does Podcatch use?',
                a: 'Podcatch is a web application (PWA). The service worker cache uses approximately 2-5 MB. Offline transcript caching via IndexedDB varies based on how many episodes you have viewed. Storage is managed by your browser and can be cleared at any time via your browser settings.',
            },
            {
                q: 'What browsers are supported?',
                a: 'Podcatch works in all modern browsers including Chrome, Firefox, Safari, and Edge. We support the current version and two prior major releases. No proprietary plugins are required.',
            },
            {
                q: 'Where is the data export format documented?',
                a: 'Full documentation of the JSON export schema is available at the Data Export Format page, accessible from Help > Data Export Format.',
            },
        ],
    },
    {
        category: 'Troubleshooting',
        questions: [
            {
                q: 'Episode processing failed — what should I do?',
                a: 'Try processing the episode again. If it fails repeatedly, the audio file may be unavailable or in an unsupported format. Check that the podcast feed is still active.',
            },
            {
                q: 'The app is not loading or looks broken.',
                a: 'Try clearing your browser cache and refreshing. Podcatch works best in modern browsers (Chrome, Firefox, Safari, Edge). If the issue persists, contact support@podcatch.app.',
            },
        ],
    },
];

export default function HelpPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4 space-y-8">
            <div className="space-y-4">
                <Link href="/" className="text-sm text-primary hover:underline">&larr; Back to Home</Link>
                <h1 className="text-4xl font-bold tracking-tight">Help & FAQ</h1>
                <p className="text-muted-foreground">
                    Find answers to common questions. Need more help? Email <a href="mailto:support@podcatch.app" className="text-primary hover:underline">support@podcatch.app</a>.
                </p>
            </div>

            <div className="space-y-10">
                {faqs.map(section => (
                    <section key={section.category}>
                        <h2 className="text-xl font-semibold mb-4">{section.category}</h2>
                        <div className="space-y-4">
                            {section.questions.map((faq, i) => (
                                <details key={i} className="group border rounded-lg">
                                    <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-sm hover:bg-muted/50 rounded-lg transition-colors">
                                        {faq.q}
                                        <span className="text-muted-foreground group-open:rotate-180 transition-transform ml-2">&#9660;</span>
                                    </summary>
                                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                                        {faq.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
