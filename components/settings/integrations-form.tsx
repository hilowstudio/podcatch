'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateWebhookUrl, updateReadwiseApiKey, updateNotionSettings, testWebhook } from '@/actions/integrations';
import { Loader2, Check, AlertCircle, Send, BookOpen, Database, FileText } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
    webhookUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    readwiseApiKey: z.string().optional(),
    notionAccessToken: z.string().optional(),
    notionPageId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface IntegrationsFormProps {
    initialWebhookUrl?: string | null;
    initialReadwiseApiKey?: string | null;
    initialNotionAccessToken?: string | null;
    initialNotionPageId?: string | null;
    isGoogleDriveConnected: boolean;
}

export function IntegrationsForm({
    initialWebhookUrl,
    initialReadwiseApiKey,
    initialNotionAccessToken,
    initialNotionPageId,
    isGoogleDriveConnected
}: IntegrationsFormProps) {
    const [isTesting, setIsTesting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            webhookUrl: initialWebhookUrl || '',
            readwiseApiKey: initialReadwiseApiKey || '',
            notionAccessToken: initialNotionAccessToken || '',
            notionPageId: initialNotionPageId || '',
        },
    });

    async function onSubmit(data: FormValues) {
        // Save all (could be optimized)
        const res1 = await updateWebhookUrl(data.webhookUrl || '');
        const res2 = await updateReadwiseApiKey(data.readwiseApiKey || '');
        const res3 = await updateNotionSettings(data.notionAccessToken || '', data.notionPageId || '');

        if (res1.success && res2.success && res3.success) {
            toast.success('Integration settings saved');
        } else {
            toast.error('Failed to save some settings');
        }
    }

    async function handleTest() {
        const url = form.getValues('webhookUrl');
        if (!url) {
            toast.error('Please enter a Webhook URL to test');
            return;
        }

        setIsTesting(true);
        const result = await testWebhook(url);
        setIsTesting(false);

        if (result.success) {
            toast.success(`Test successful! Received status ${result.status}`);
        } else {
            toast.error(`Test failed: ${result.error}`);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="webhookUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Webhook URL</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input
                                            placeholder="https://hooks.zapier.com/..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleTest}
                                        disabled={isTesting || !field.value}
                                        title="Send Test Webhook"
                                    >
                                        {isTesting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <FormDescription>
                                    We will send a JSON POST request to this URL whenever an episode finishes processing.
                                    Great for connecting to Zapier, Make, n8n, or Slack.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Readwise Reader</h3>
                    </div>
                    <FormField
                        control={form.control}
                        name="readwiseApiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Readwise Access Token</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Enter your Readwise Access Token"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Get your token from <a href="https://readwise.io/access_token" target="_blank" className="underline hover:text-foreground">readwise.io/access_token</a>.
                                    We will save the full transcript and summary to your Reader library.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Notion</h3>
                    </div>
                    <div className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="notionAccessToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Integration Token</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="secret_..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Create an Internal Integration at <a href="https://www.notion.so/my-integrations" target="_blank" className="underline hover:text-foreground">notion.so/my-integrations</a>.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notionPageId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Database ID</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="32 chars (from URL)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The ID of the Database where you want episodes to be saved.
                                        Make sure to "Add connection" to your integration on this database page!
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Google Drive</h3>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <div className="font-medium">Deep Research Export</div>
                            <div className="text-sm text-muted-foreground">
                                Save transcripts and insights to Google Docs (for NotebookLM).
                            </div>
                        </div>
                        {isGoogleDriveConnected ? (
                            <Button variant="outline" disabled className="text-green-600 border-green-200 bg-green-50">
                                <Check className="mr-2 h-4 w-4" />
                                Connected
                            </Button>
                        ) : (
                            <Button asChild variant="outline">
                                <a href="/api/integrations/google/auth">
                                    Connect Google Drive
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}
