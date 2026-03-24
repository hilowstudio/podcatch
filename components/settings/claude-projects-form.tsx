'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateClaudeSettings } from '@/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, ExternalLink, Bot, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ClaudeProjectsFormProps = {
    userId: string;
    initialSettings: {
        claudeApiKey: string;
        claudeProjectId: string;
        autoSyncToClaude: boolean;
    };
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                'Save Claude Settings'
            )}
        </Button>
    );
}

export function ClaudeProjectsForm({ userId, initialSettings }: ClaudeProjectsFormProps) {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);
    const [autoSync, setAutoSync] = useState(initialSettings.autoSyncToClaude);

    async function handleSubmit(formData: FormData) {
        setSuccess(false);
        setError(null);

        const result = await updateClaudeSettings(formData);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(result.error || 'Failed to save Claude settings');
        }
    }

    return (
        <Card className="border-indigo-500/20 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle>Claude Projects</CardTitle>
                        <Badge variant="outline" className="text-xs border-status-warning/50 text-status-warning">Experimental</Badge>
                    </div>
                    {initialSettings.claudeApiKey && initialSettings.claudeProjectId ? (
                        <Badge variant="secondary" className="bg-status-success/10 text-status-success border-status-success/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1">
                            <Circle className="h-3 w-3" />
                            Not configured
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Send episode transcripts to Claude via the API. This is a best-effort sync and does not use a dedicated Projects API.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <input type="hidden" name="userId" value={userId} />

                    {/* Auto-sync toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                        <div className="space-y-0.5">
                            <Label htmlFor="autoSyncToClaude" className="text-base">
                                Auto-sync Episodes
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically add transcripts upon completion
                            </p>
                        </div>
                        <Switch
                            id="autoSyncToClaude"
                            name="autoSyncToClaude"
                            checked={autoSync}
                            onCheckedChange={setAutoSync}
                        />
                    </div>

                    {/* Claude API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="claudeApiKey">Claude API Key</Label>
                        <div className="relative">
                            <Input
                                id="claudeApiKey"
                                name="claudeApiKey"
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="sk-ant-..."
                                defaultValue={initialSettings.claudeApiKey}
                                className="pr-10"
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {/* Link helper */}
                        <p className="text-xs text-muted-foreground">
                            Get your key at{' '}
                            <a
                                href="https://console.anthropic.com/settings/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center underline hover:text-indigo-500"
                            >
                                console.anthropic.com
                                <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        </p>
                    </div>

                    {/* Claude Project ID */}
                    <div className="space-y-2">
                        <Label htmlFor="claudeProjectId">Claude Project ID</Label>
                        <Input
                            id="claudeProjectId"
                            name="claudeProjectId"
                            type="text"
                            placeholder="e.g. 5d5032c5-..."
                            defaultValue={initialSettings.claudeProjectId}
                        />
                        <p className="text-xs text-muted-foreground">
                            The ID from your Project URL: claude.ai/project/<strong>ID</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-md bg-status-danger/10 p-3 text-sm text-status-danger">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-md bg-status-success/10 p-3 text-sm text-status-success">
                            ✅ Saved!
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
