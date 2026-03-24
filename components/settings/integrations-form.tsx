'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { updateWebhookUrl, updateReadwiseApiKey, updateNotionSettings, testWebhook, updateTanaToken, updateLogseqGraph } from '@/actions/integrations';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function ConnectionBadge({ connected }: { connected: boolean }) {
    return connected ? (
        <Badge variant="secondary" className="bg-status-success/10 text-status-success border-status-success/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Connected
        </Badge>
    ) : (
        <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1">
            <Circle className="h-3 w-3" />
            Not configured
        </Badge>
    );
}

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
                <div className="flex items-center justify-between">
                    <CardTitle>Webhook</CardTitle>
                    <ConnectionBadge connected={!!initialValue} />
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
                        <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting || !url}>
                            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
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
                <div className="flex items-center justify-between">
                    <CardTitle>Readwise Reader</CardTitle>
                    <ConnectionBadge connected={!!initialValue} />
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
                <div className="flex items-center justify-between">
                    <CardTitle>Notion</CardTitle>
                    <ConnectionBadge connected={!!(initialToken && initialPageId)} />
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
                <div className="flex items-center justify-between">
                    <CardTitle>Google Drive</CardTitle>
                    <ConnectionBadge connected={isConnected} />
                </div>
                <CardDescription>Export deep research docs for NotebookLM.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {isConnected
                        ? 'Your Google Drive is connected and ready to receive exports.'
                        : 'Connect your Google account to export research documents.'}
                </p>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                <Button
                    size="sm"
                    variant={isConnected ? "outline" : "default"}
                    onClick={() => signIn('google', {
                        callbackUrl: '/integrations',
                        scope: 'https://www.googleapis.com/auth/drive.file'
                    })}
                >
                    {isConnected ? 'Reconnect' : 'Connect'}
                </Button>
            </CardFooter>
        </Card>
    );
}

export function TanaCard({ initialValue }: IntegrationProps) {
    const [token, setToken] = useState(initialValue || '');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSave() {
        setIsLoading(true);
        const res = await updateTanaToken(token);
        setIsLoading(false);
        if (res.success) toast.success('Tana token saved');
        else toast.error('Failed to save Tana token');
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Tana</CardTitle>
                    <ConnectionBadge connected={!!initialValue} />
                </div>
                <CardDescription>Send nodes to Tana via Input API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label>API Token</Label>
                    <Input
                        type="password"
                        placeholder="Tana Input API Token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
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

export function LogseqCard({ initialValue }: IntegrationProps) {
    const [graphName, setGraphName] = useState(initialValue || '');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSave() {
        setIsLoading(true);
        const res = await updateLogseqGraph(graphName);
        setIsLoading(false);
        if (res.success) toast.success('Logseq graph saved');
        else toast.error('Failed to save Logseq graph');
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Logseq</CardTitle>
                    <ConnectionBadge connected={!!initialValue} />
                </div>
                <CardDescription>Configure deep links to your local graph.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label>Graph Name</Label>
                    <Input
                        placeholder="e.g. my-knowledge-base"
                        value={graphName}
                        onChange={(e) => setGraphName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Your local graph name for <code>logseq://graph/NAME</code> links.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={isLoading} size="sm">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Graph
                </Button>
            </CardFooter>
        </Card>
    );
}
