import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4 space-y-8">
            <div className="space-y-4">
                <Link href="/" className="text-sm text-primary hover:underline">&larr; Back to Home</Link>
                <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
                <p className="text-muted-foreground">Last Updated: January 13, 2026</p>
            </div>

            <article className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <section className="bg-muted/50 rounded-lg p-6 border">
                    <h2 className="text-2xl font-semibold mt-0">Plain-Language Summary</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>What Podcatch does:</strong> Turns podcast audio into searchable text, summaries, and insights using AI.</li>
                        <li><strong>Your content:</strong> You own everything you create (notes, collections, prompts). We do not claim ownership of your content.</li>
                        <li><strong>AI accuracy:</strong> AI-generated summaries and insights can contain errors. Always verify important information against the original audio.</li>
                        <li><strong>Payments:</strong> Paid plans are billed monthly or annually. You can cancel anytime — your access continues through the paid period.</li>
                        <li><strong>After cancellation:</strong> Your data stays accessible for 90 days so you can export it.</li>
                        <li><strong>Deleting your account:</strong> You can permanently delete your account and all data from Settings at any time.</li>
                        <li><strong>If we shut down:</strong> We will give you at least 30 days notice and keep data export working so you can get your data out.</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4">The full terms below provide complete legal details.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Podcatch ("the Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">2. Description of Service</h2>
                    <p>
                        Podcatch is an AI-powered podcast player and knowledge management tool. We provide features including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Podcast aggregation and playback via RSS feeds.</li>
                        <li>Automated transcription and summarization using Artificial Intelligence.</li>
                        <li>Knowledge graph generation and entity tracking.</li>
                        <li>Integration with third-party tools (e.g., Notion, Readwise, Claude).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">3. User Accounts and Subscriptions</h2>
                    <p>
                        <strong>3.1 Account Security:</strong> You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                    </p>
                    <p>
                        <strong>3.2 Subscriptions:</strong> Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis (such as monthly or annually).
                    </p>
                    <p>
                        <strong>3.3 Cancellations:</strong> You may cancel your Subscription renewal at any time through your account management page. You will not receive a refund for the fees you already paid for your current subscription period, and you will be able to access the Service until the end of your current subscription period. After cancellation, your data (including episodes, transcripts, insights, collections, and custom prompts) remains accessible and exportable for a minimum of 90 days. After 90 days, your data may be permanently deleted.
                    </p>
                    <p>
                        <strong>3.4 Free Trials:</strong> We may, at our sole discretion, offer a Subscription with a free trial for a limited period of time. You may be required to enter your billing information in order to sign up for the free trial.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">4. AI and Content Accuracy</h2>
                    <p>
                        <strong>4.1 AI Generations:</strong> The Service uses artificial intelligence to generate transcripts, summaries, and insights. You acknowledge that AI systems are prone to errors ("hallucinations") and may produce inaccurate or misleading information. You should verify any critical information generated by the Service against the original audio source.
                    </p>
                    <p>
                        <strong>4.2 No Reliance:</strong> The Service is provided for informational and educational purposes only. It is not intended to be a substitute for professional advice.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
                    <p>
                        <strong>5.1 Your Content:</strong> You retain ownership of any notes, collections, or custom prompts you create within the Service.
                    </p>
                    <p>
                        <strong>5.2 Service Content:</strong> The Service and its original content (excluding Content provided by users or third-party podcast feeds), features, and functionality are and will remain the exclusive property of Podcatch and its licensors.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">6. Termination</h2>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                    <p>
                        <strong>6.1 Account Deletion:</strong> You may permanently delete your account at any time from your Settings page. Deletion is immediate and irreversible — all your data including subscriptions, episodes, transcripts, insights, collections, custom prompts, and notification history will be permanently destroyed. We recommend exporting your data before deletion.
                    </p>
                    <p>
                        <strong>6.2 Service Discontinuation:</strong> If we discontinue the Service, we will provide at least 30 days advance notice via email and in-app notification. During that period, all data export features will remain fully functional so you can retrieve your data.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">7. Limitation of Liability</h2>
                    <p>
                        In no event shall Podcatch, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">8. Support & Security Policy</h2>
                    <p>
                        <strong>8.1 Security Updates:</strong> The current version of Podcatch will receive security updates for a minimum of 12 months from its release date. Critical security vulnerabilities will be patched within 7 calendar days of discovery.
                    </p>
                    <p>
                        <strong>8.2 End-of-Life:</strong> Before deprecating any version, we will provide at least 90 days advance notice via email and changelog. During that period, all features including data export will remain functional.
                    </p>
                    <p>
                        <strong>8.3 Support Response:</strong> We aim to respond to all support requests within 2 business days. Contact us at support@podcatch.app.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">9. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at support@podcatch.app.
                    </p>
                </section>
            </article>
        </div>
    );
}
