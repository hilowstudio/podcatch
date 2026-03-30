import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4 space-y-8">
            <div className="space-y-4">
                <Link href="/" className="text-sm text-primary hover:underline">&larr; Back to Home</Link>
                <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                <p className="text-muted-foreground">Last Updated: January 13, 2026</p>
            </div>

            <article className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <section className="bg-muted/50 rounded-lg p-6 border">
                    <h2 className="text-2xl font-semibold mt-0">Plain-Language Summary</h2>
                    <p>Here is the short version of our privacy policy:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>What we collect:</strong> Your name, email, and the podcast content you process (transcripts, notes, prompts). We also collect basic technical data like your browser type.</li>
                        <li><strong>Why we collect it:</strong> To run the service — manage your account, process episodes, display your library, and handle payments through Stripe.</li>
                        <li><strong>Who can see it:</strong> Only our AI providers (Google, Anthropic) see your transcripts to generate insights. Stripe sees your payment info. We never sell your data to advertisers.</li>
                        <li><strong>How long we keep it:</strong> We keep your data as long as your account is active. After you cancel a subscription, your data stays accessible for 90 days. After account deletion, all data is permanently destroyed.</li>
                        <li><strong>How to delete it:</strong> Go to Settings and click "Delete Account" to permanently remove all your data. You can also export your data as JSON first from the same page.</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4">The full policy below provides complete legal details.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">1. Introduction</h2>
                    <p>
                        Welcome to Podcatch ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">2. The Data We Collect</h2>
                    <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Identity Data:</strong> includes name, username, or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes email address.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform.</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our website, products, and services (e.g., listening history, reading habits).</li>
                        <li><strong>Content Data:</strong> includes transcripts, notes, and custom prompts you process through the Service.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">3. How We Use Your Data</h2>
                    <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>To provide the Service:</strong> To manage your account, process podcast episodes, and display your library.</li>
                        <li><strong>To improve our AI Algorithms:</strong> We may use anonymized usage patterns to improve the relevance of our insights, but we do NOT use your private notes or private prompts to train public models without your explicit consent.</li>
                        <li><strong>To process payments:</strong> We use Stripe to handle payment processing. We do not store your credit card details.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">4. Disclosure of Your Data</h2>
                    <p>
                        We may share your data with the following third parties:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>AI Service Providers:</strong> We send podcast transcripts and prompts to third-party AI providers (such as Anthropic and Google) to generate summaries and insights. These providers are bound by confidentiality agreements.</li>
                        <li><strong>Service Providers:</strong> Companies that provide IT and system administration services.</li>
                        <li><strong>Professional Advisers:</strong> Lawyers, bankers, auditors and insurers.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">5. Data Retention & Deletion</h2>
                    <p>We retain different categories of data for different periods:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Account & Content Data</strong> (profile, episodes, transcripts, insights, collections, prompts, snips): Retained while your account is active. Deleted immediately upon account deletion.</li>
                        <li><strong>Notification History:</strong> Automatically purged after 90 days.</li>
                        <li><strong>Usage Logs</strong> (episode processing counts for billing): Retained for 12 months, then automatically purged.</li>
                        <li><strong>Rate Limit Records:</strong> Automatically purged after 24 hours.</li>
                        <li><strong>Post-Cancellation:</strong> After subscription cancellation, all data remains accessible and exportable for 90 days, after which it may be permanently deleted.</li>
                        <li><strong>Post-Deletion:</strong> Upon account deletion, all data is destroyed immediately from our primary systems and within 30 days from backups.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">6. Data Security</h2>
                    <p>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">7. Third-Party Links</h2>
                    <p>
                        Our Service may include links to third-party websites, plug-ins and applications (e.g., YouTube, RSS feeds). Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">8. Contact Details</h2>
                    <p>
                        If you have any questions about this privacy policy or our privacy practices, please contact us at support@podcatch.app.
                    </p>
                </section>
            </article>
        </div>
    );
}
