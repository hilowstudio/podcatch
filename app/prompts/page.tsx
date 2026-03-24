import { getPublicPrompts } from '@/actions/prompt-gallery-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClonePromptButton } from '@/components/clone-prompt-button';
import { Sparkles } from 'lucide-react';

export const metadata = {
    title: 'Prompt Gallery - Podcatch',
    description: 'Discover and clone community prompts for podcast analysis.',
};

const CATEGORIES = [
    { value: 'all', label: 'All' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'research', label: 'Research' },
    { value: 'content', label: 'Content' },
];

export default async function PromptGalleryPage() {
    const prompts = await getPublicPrompts();

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Prompt Gallery</h1>
                <p className="text-muted-foreground">
                    Discover community prompts for podcast analysis. Clone any prompt to your library.
                </p>
            </div>

            <Tabs defaultValue="all">
                <TabsList className="mb-6">
                    {CATEGORIES.map(cat => (
                        <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                    ))}
                </TabsList>

                {CATEGORIES.map(cat => (
                    <TabsContent key={cat.value} value={cat.value}>
                        <PromptGrid
                            prompts={cat.value === 'all'
                                ? prompts
                                : prompts.filter(p => p.category === cat.value)}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

function PromptGrid({ prompts }: { prompts: Awaited<ReturnType<typeof getPublicPrompts>> }) {
    if (prompts.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/50">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No prompts yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    Share your custom prompts from Settings to see them here.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {prompts.map(prompt => (
                <Card key={prompt.id}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-base">{prompt.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={prompt.user.image || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                            {prompt.user.name?.[0] || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">{prompt.user.name || 'Anonymous'}</span>
                                    {prompt.category && (
                                        <Badge variant="secondary" className="text-xs">{prompt.category}</Badge>
                                    )}
                                    {prompt.useCount > 0 && (
                                        <span className="text-xs text-muted-foreground">{prompt.useCount} clone{prompt.useCount !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                            </div>
                            <ClonePromptButton promptId={prompt.id} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted p-3 rounded-md font-mono text-xs whitespace-pre-wrap line-clamp-4">
                            {prompt.prompt}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
