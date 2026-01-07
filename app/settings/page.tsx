import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ClaudeProjectsForm } from '@/components/settings/claude-projects-form';
import { IntegrationsForm } from '@/components/settings/integrations-form';
import { BillingForm } from '@/components/billing-form';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            claudeApiKey: true,
            claudeProjectId: true,
            autoSyncToClaude: true,
            webhookUrl: true,
            readwiseApiKey: true,
        },
    });

    if (!user) {
        redirect('/auth/signin');
    }

    const subscriptionPlan = await getUserSubscriptionPlan();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <main className="container mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your subscription and integrations</p>
                </div>

                <div className="grid gap-8">
                    <BillingForm subscriptionPlan={subscriptionPlan} />

                    <div className="relative">
                        {!subscriptionPlan.isPro && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
                                <div className="rounded-lg border bg-background p-6 shadow-lg text-center">
                                    <h3 className="font-semibold mb-2">Pro Feature</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Upgrade to enable automatic Claude integration
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className={!subscriptionPlan.isPro ? 'opacity-50 pointer-events-none filter grayscale-[0.5]' : ''}>
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-2xl">
                                        Claude Projects Integration
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Automatically sync episode transcripts and insights to your Claude Project.
                                        No more manual copying - just paste a podcast URL and it appears in Claude.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ClaudeProjectsForm
                                        userId={user.id}
                                        initialSettings={{
                                            claudeApiKey: user.claudeApiKey || '',
                                            claudeProjectId: user.claudeProjectId || '',
                                            autoSyncToClaude: user.autoSyncToClaude || false,
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="relative">
                        {!subscriptionPlan.isPro && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
                                {/* Reusing the same gate overlay */}
                            </div>
                        )}
                        <div className={!subscriptionPlan.isPro ? 'opacity-50 pointer-events-none filter grayscale-[0.5]' : ''}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Workflow Integrations</CardTitle>
                                    <CardDescription>
                                        Connect Podcatch to your other tools (Zapier, Make, etc).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <IntegrationsForm
                                        initialWebhookUrl={user.webhookUrl}
                                        initialReadwiseApiKey={user.readwiseApiKey}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
