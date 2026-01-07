'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateWebhookUrl, testWebhook } from '@/actions/integrations';
import { Loader2, Check, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

const webhookSchema = z.object({
    webhookUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

interface IntegrationsFormProps {
    initialWebhookUrl?: string | null;
}

export function IntegrationsForm({ initialWebhookUrl }: IntegrationsFormProps) {
    const [isTesting, setIsTesting] = useState(false);

    const form = useForm<WebhookFormValues>({
        resolver: zodResolver(webhookSchema),
        defaultValues: {
            webhookUrl: initialWebhookUrl || '',
        },
    });

    async function onSubmit(data: WebhookFormValues) {
        const result = await updateWebhookUrl(data.webhookUrl || '');
        if (result.success) {
            toast.success('Integration settings saved');
        } else {
            toast.error(result.error || 'Failed to save settings');
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
