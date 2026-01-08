'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { updateWebhookUrl, updateReadwiseApiKey, updateNotionSettings, testWebhook } from '@/actions/integrations';
import { Loader2, Check, Send, BookOpen, Database, Globe, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface IntegrationProps {
    initialValue?: string | null;
}

// --- Components ---

export function WebhookCard({ initialValue }: IntegrationProps) {
    const [url, setUrl] = useState(initialValue || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    async function handleSave() {
        setIsLoading(true);
        const res = await updateWebhookUrl(url);
        setIsLoading(false);
        if (res.success) toast.success('Webhook URL saved');
        else toast.error('Failed to save webhook');
    }

    async function handleTest() {
        if (!url) return;
        setIsTesting(true);
        const res = await testWebhook(url);
        setIsTesting(false);
        if (res.success) toast.success(`Test sent: ${res.status}`);
        else toast.error(`Test failed: ${res.error}`);
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <CardTitle>Webhook</CardTitle>
                </div>
                <CardDescription>Receive JSON events when episodes are processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label>Callback URL</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://hooks.zapier.com/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <Button variant="outline" size="icon" onClick={handleTest} disabled={isTesting || !url}>
                            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={isLoading} size="sm">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Webhook
                </Button>
            </CardFooter>
        </Card>
    );
}

export function ReadwiseCard({ initialValue }: IntegrationProps) {
    const [key, setKey] = useState(initialValue || '');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSave() {
        setIsLoading(true);
        const res = await updateReadwiseApiKey(key);
        setIsLoading(false);
        if (res.success) toast.success('Readwise key saved');
        else toast.error('Failed to save Readwise key');
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Readwise Reader</CardTitle>
                </div>
                <CardDescription>Save full transcripts and summaries to your library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label>Access Token</Label>
                    <Input
                        type="password"
                        placeholder="Readwise Access Token"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        From <a href="https://readwise.io/access_token" target="_blank" className="underline">readwise.io/access_token</a>
                    </p>
                </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={isLoading} size="sm">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Token
                </Button>
            </CardFooter>
        </Card>
    );
}

export function NotionCard({ initialToken, initialPageId }: { initialToken?: string | null, initialPageId?: string | null }) {
    const [token, setToken] = useState(initialToken || '');
    const [pageId, setPageId] = useState(initialPageId || '');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSave() {
        setIsLoading(true);
        const res = await updateNotionSettings(token, pageId);
        setIsLoading(false);
        if (res.success) toast.success('Notion settings saved');
        else toast.error('Failed to save Notion settings');
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-slate-800 dark:text-slate-200" />
                    <CardTitle>Notion</CardTitle>
                </div>
                <CardDescription>Sync episodes to a Notion Database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label>Integration Secret</Label>
                    <Input
                        type="password"
                        placeholder="secret_..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label>Database ID</Label>
                    <Input
                        placeholder="Database ID (from URL)"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={isLoading} size="sm">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Notion
                </Button>
            </CardFooter>
        </Card>
    );
}

export function GoogleDriveCard({ isConnected }: { isConnected: boolean }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-green-600" />
                    <CardTitle>Google Drive</CardTitle>
                </div>
                <CardDescription>Export deep research docs for NotebookLM.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                    <span className="text-sm font-medium">Connection Status</span>
                    {isConnected ? (
                        <div className="flex items-center text-green-600 text-sm font-medium gap-2">
                            <Check className="h-4 w-4" /> Connected
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">Not Connected</span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                {isConnected ? (
                    <Button variant="outline" disabled size="sm">Connected</Button>
                ) : (
                    <Button asChild size="sm">
                        <a href="/api/integrations/google/auth">Connect Drive</a>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
