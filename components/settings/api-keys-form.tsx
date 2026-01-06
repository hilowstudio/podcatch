'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateApiKeys } from '@/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type ApiKeysFormProps = {
    userId: string;
    initialKeys: {
        geminiApiKey: string;
        deepgramApiKey: string;
        openaiApiKey: string;
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
                'Save API Keys'
            )}
        </Button>
    );
}

export function ApiKeysForm({ userId, initialKeys }: ApiKeysFormProps) {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showKeys, setShowKeys] = useState({
        gemini: false,
        deepgram: false,
        openai: false,
    });

    async function handleSubmit(formData: FormData) {
        setSuccess(false);
        setError(null);

        const result = await updateApiKeys(formData);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(result.error || 'Failed to save API keys');
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="userId" value={userId} />

            {/* Gemini API Key */}
            <div className="space-y-2">
                <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                <div className="relative">
                    <Input
                        id="geminiApiKey"
                        name="geminiApiKey"
                        type={showKeys.gemini ? 'text' : 'password'}
                        placeholder="AIza..."
                        defaultValue={initialKeys.geminiApiKey}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowKeys((prev) => ({ ...prev, gemini: !prev.gemini }))}
                    >
                        {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Get your key at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline">ai.google.dev</a>
                </p>
            </div>

            {/* Deepgram API Key */}
            <div className="space-y-2">
                <Label htmlFor="deepgramApiKey">Deepgram API Key</Label>
                <div className="relative">
                    <Input
                        id="deepgramApiKey"
                        name="deepgramApiKey"
                        type={showKeys.deepgram ? 'text' : 'password'}
                        placeholder="..."
                        defaultValue={initialKeys.deepgramApiKey}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowKeys((prev) => ({ ...prev, deepgram: !prev.deepgram }))}
                    >
                        {showKeys.deepgram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Get your key at <a href="https://deepgram.com" target="_blank" rel="noopener noreferrer" className="underline">deepgram.com</a>
                </p>
            </div>

            {/* OpenAI API Key */}
            <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI API Key (Optional)</Label>
                <div className="relative">
                    <Input
                        id="openaiApiKey"
                        name="openaiApiKey"
                        type={showKeys.openai ? 'text' : 'password'}
                        placeholder="sk-..."
                        defaultValue={initialKeys.openaiApiKey}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowKeys((prev) => ({ ...prev, openai: !prev.openai }))}
                    >
                        {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    For future OpenAI integration. Get your key at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a>
                </p>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    API keys saved successfully!
                </div>
            )}

            <SubmitButton />
        </form>
    );
}
