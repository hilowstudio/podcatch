'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateClaudeSettings } from '@/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';

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
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="userId" value={userId} />

            {/* Auto-sync toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="autoSyncToClaude" className="text-base">
                        Auto-sync to Claude Projects
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Automatically add episode transcripts and insights to your Claude Project after processing
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
                <p className="text-xs text-muted-foreground">
                    Get your key at{' '}
                    <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center underline"
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
                    placeholder="Find in your Claude Project URL"
                    defaultValue={initialSettings.claudeProjectId}
                />
                <div className="rounded-md bg-muted p-3 text-xs">
                    <p className="font-medium mb-1">How to find your Project ID:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Go to claude.ai and open your project</li>
                        <li>The URL will look like: claude.ai/project/<strong>abc123</strong></li>
                        <li>Copy the ID after "/project/"</li>
                    </ol>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    ✅ Claude settings saved! New episodes will automatically sync to your project.
                </div>
            )}

            <SubmitButton />
        </form>
    );
}
