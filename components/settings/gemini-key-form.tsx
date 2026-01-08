'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateGeminiKey } from '@/actions/user-actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z.object({
    geminiApiKey: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface GeminiKeyFormProps {
    initialGeminiApiKey?: string | null;
}

export function GeminiKeyForm({
    initialGeminiApiKey,
}: GeminiKeyFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            geminiApiKey: initialGeminiApiKey || '',
        },
    });

    async function onSubmit(data: FormValues) {
        const formData = new FormData();
        formData.append('geminiApiKey', data.geminiApiKey || '');

        const result = await updateGeminiKey(formData);

        if (result.success) {
            toast.success('Gemini API key updated successfully');
        } else {
            toast.error(result.error || 'Failed to update Gemini API key');
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gemini</CardTitle>
                <CardDescription>
                    Configure Google Gemini for AI analysis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="geminiApiKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>API Key</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="AIzamSy..." {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a>.
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
                                Save Key
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
