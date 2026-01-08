'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateApiKeys } from '@/actions/user-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
    openaiApiKey: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ApiKeysFormProps {
    initialOpenaiApiKey?: string | null;
}

export function ApiKeysForm({
    initialOpenaiApiKey,
}: ApiKeysFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            openaiApiKey: initialOpenaiApiKey || '',
        },
    });

    async function onSubmit(data: FormValues) {
        const formData = new FormData();
        formData.append('openaiApiKey', data.openaiApiKey || '');

        const result = await updateApiKeys(formData);

        if (result.success) {
            toast.success('API keys updated successfully');
        } else {
            toast.error(result.error || 'Failed to update API keys');
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="openaiApiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>OpenAI API Key</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="sk-..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Required for "Chat with your Podcast" and Vector Store syncing.
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
                        Save API Keys
                    </Button>
                </div>
            </form>
        </Form>
    );
}
