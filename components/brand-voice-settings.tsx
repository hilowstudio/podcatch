'use client';

import { useState } from 'react';
import { updateBrandVoice } from '@/actions/settings-actions'; // We need to create this action
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles } from 'lucide-react';

export function BrandVoiceSettings({ initialVoice }: { initialVoice: string }) {
    const [voice, setVoice] = useState(initialVoice || '');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSave() {
        setIsLoading(true);
        try {
            const result = await updateBrandVoice(voice);
            if (result.success) {
                toast.success('Brand Voice updated');
            } else {
                toast.error('Failed to update settings');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="border-indigo-500/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    <CardTitle>Brand Voice & Style Guide</CardTitle>
                </div>
                <CardDescription>
                    Define your persona, tone, and formatting rules. This will be applied to all AI-generated content.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="voice">System Instructions</Label>
                    <Textarea
                        id="voice"
                        placeholder="e.g. You are a witty tech blogger. Use short sentences. Avoid corporate jargon like 'synergy'. Always conclude with a question."
                        className="min-h-[200px] font-mono text-sm leading-relaxed"
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Tip: Include details about tone (formal vs casual), perspective (I vs We), and forbidden words.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Brand Voice
                </Button>
            </CardContent>
        </Card>
    );
}
