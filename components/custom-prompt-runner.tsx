'use client';

import { useState, useEffect } from 'react';
import { getUserPrompts, runCustomPromptOnEpisode } from '@/actions/studio-actions';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Sparkles, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownCopyButton } from '@/components/markdown-copy-button'; // Reuse if possible, or just copy text

export function CustomPromptRunner({ episodeId }: { episodeId: string }) {
    const [prompts, setPrompts] = useState<any[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string>('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch users prompts on mount
        getUserPrompts().then(setPrompts);
    }, []);

    const handleRun = async () => {
        if (!selectedPromptId) return;
        setIsLoading(true);
        setResult(null);

        try {
            const res = await runCustomPromptOnEpisode(selectedPromptId, episodeId);
            if (res.success && res.result) {
                setResult(res.result);
                toast.success('Prompt executed successfully');
            } else {
                toast.error(res.error || 'Failed to run prompt');
            }
        } catch (e) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Select onValueChange={setSelectedPromptId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a custom prompt..." />
                    </SelectTrigger>
                    <SelectContent>
                        {prompts.length === 0 ? (
                            <SelectItem value="none" disabled>No prompts found. Create one in Settings.</SelectItem>
                        ) : (
                            prompts.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button onClick={handleRun} disabled={!selectedPromptId || isLoading} className="shrink-0">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Run
                </Button>
            </div>

            {result && (
                <Card className="bg-muted/50 border-indigo-500/30">
                    <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium flex gap-2 items-center">
                            <Sparkles className="h-4 w-4 text-indigo-500" /> Result
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(result);
                                toast.success('Copied to clipboard');
                            }}
                        >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                    </CardHeader>
                    <CardContent className="text-sm whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                        {result}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
