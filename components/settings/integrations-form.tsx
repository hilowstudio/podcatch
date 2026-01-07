'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateWebhookUrl, updateReadwiseApiKey, testWebhook } from '@/actions/integrations';
import { Loader2, Check, AlertCircle, Send, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
    webhookUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    readwiseApiKey: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface IntegrationsFormProps {
    initialWebhookUrl?: string | null;
    initialReadwiseApiKey?: string | null;
}

export function IntegrationsForm({ initialWebhookUrl, initialReadwiseApiKey }: IntegrationsFormProps) {
    const [isTesting, setIsTesting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            webhookUrl: initialWebhookUrl || '',
            readwiseApiKey: initialReadwiseApiKey || '',
        },
    });

    async function onSubmit(data: FormValues) {
        // Save both (could be optimized to only save changed, but this is safe)
        const res1 = await updateWebhookUrl(data.webhookUrl || '');
        const res2 = await updateReadwiseApiKey(data.readwiseApiKey || '');

        if (res1.success && res2.success) {
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
