import { getUserPrompts } from '@/actions/studio-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { CreatePromptForm } from '@/components/create-prompt-form';
import { DeletePromptButton } from '@/components/delete-prompt-button';

export default async function PromptSettingsPage() {
    const prompts = await getUserPrompts();

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-semibold">Prompt Library</h2>
                    <p className="text-muted-foreground mt-1">Create custom AI prompts to run on your episodes.</p>
                </div>
                <CreatePromptForm />
            </div>

            <div className="grid gap-6">
                {prompts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No custom prompts yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                            Create a prompt like "Extract all book recommendations" or "Write a haiku about this".
                        </p>
                    </div>
                ) : (
                    prompts.map((prompt) => (
                        <Card key={prompt.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{prompt.title}</CardTitle>
                                        <CardDescription className="font-mono text-xs mt-1">ID: {prompt.id}</CardDescription>
                                    </div>
                                    <DeletePromptButton promptId={prompt.id} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                                    {prompt.prompt}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
