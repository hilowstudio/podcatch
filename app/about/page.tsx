import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About - Podcatch',
    description: 'About Podcatch — our mission, funding, and commitments.',
};

export default function AboutPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4 space-y-8">
            <div className="space-y-4">
                <Link href="/" className="text-sm text-primary hover:underline">&larr; Back to Home</Link>
                <h1 className="text-4xl font-bold tracking-tight">About Podcatch</h1>
            </div>

            <article className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                <section>
                    <h2 className="text-2xl font-semibold">Our Mission</h2>
                    <p>
                        Podcatch turns podcast audio into searchable, structured knowledge. We believe the insights buried in long-form audio deserve better tools — tools that respect your time and attention rather than competing for it.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Design Philosophy</h2>
                    <p>
                        Podcatch is built on Calm Technology principles. We do not use dark patterns, gamification, infinite scroll, streak mechanics, or engagement-maximizing design. Our interface is designed for the smallest possible amount of your attention — get in, get your insights, get out.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Funding & Independence</h2>
                    <p>
                        Podcatch is independently bootstrapped. We are entirely funded by subscription revenue from our users. We have:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>No venture capital investors</li>
                        <li>No advertising partners or sponsorships</li>
                        <li>No board members with interests in advertising, data brokerage, or attention-extraction industries</li>
                        <li>No external funding that creates misaligned incentives</li>
                    </ul>
                    <p>
                        This means our only financial incentive is to build a product worth paying for. We do not sell your data, show you ads, or optimize for engagement metrics.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Privacy Commitments</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Zero analytics tracking — no Google Analytics, Mixpanel, or any telemetry SDKs</li>
                        <li>No advertising networks or tracking pixels</li>
                        <li>Your private notes and prompts are never used to train public AI models without your explicit consent</li>
                        <li>Full data export available at any time from Settings</li>
                        <li>Account deletion is permanent and immediate</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold">Contact</h2>
                    <p>
                        Questions, feedback, or concerns: <a href="mailto:support@podcatch.app" className="text-primary hover:underline">support@podcatch.app</a>
                    </p>
                </section>
            </article>
        </div>
    );
}
