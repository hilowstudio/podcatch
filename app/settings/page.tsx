import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ClaudeProjectsForm } from '@/components/settings/claude-projects-form';
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
        },
    });

    if (!user) {
        redirect('/auth/signin');
    }

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
                    <p className="text-muted-foreground mt-2">Connect your Claude Project for automatic podcast insights</p>
                </div>

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
                                autoSyncToClaude: user.autoSyncToClaude,
                            }}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
