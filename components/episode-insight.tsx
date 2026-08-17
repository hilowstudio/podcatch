'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Lightbulb, Languages, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { translateEpisode } from '@/actions/language-actions';
import { LANGUAGES, isTranslatable } from '@/lib/languages';

type Content = { summary: string; keyTakeaways: string[] };

interface Props {
    episodeId: string;
    summary: string;
    keyTakeaways: string[];
    defaultLanguage: string | null;
}

export function EpisodeInsight({ episodeId, summary, keyTakeaways, defaultLanguage }: Props) {
    const original: Content = { summary, keyTakeaways };
    const [lang, setLang] = useState('en');
    const [content, setContent] = useState<Content>(original);
    const [loading, setLoading] = useState(false);
    const [cache, setCache] = useState<Record<string, Content>>({ en: original });

    const applyLanguage = useCallback(async (code: string) => {
        setLang(code);
        if (code === 'en' || !isTranslatable(code)) {
            setContent(original);
            return;
        }
        if (cache[code]) {
            setContent(cache[code]);
            return;
        }
        setLoading(true);
        const res = await translateEpisode(episodeId, code);
        setLoading(false);
        if (res.success) {
            setCache(prev => ({ ...prev, [code]: res.translation }));
            setContent(res.translation);
        } else {
            toast.error(res.error);
            setLang('en');
            setContent(original);
        }
        // original/cache are stable enough for this handler; episodeId is the key input
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [episodeId, cache]);

    // Auto-apply the user's preferred language once on mount (served from the
    // shared cache after the first viewer warms it).
    useEffect(() => {
        if (defaultLanguage && isTranslatable(defaultLanguage)) {
            applyLanguage(defaultLanguage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <CardTitle>AI Summary</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
                            <Select value={lang} onValueChange={applyLanguage} disabled={loading}>
                                <SelectTrigger className="h-8 w-[150px]" aria-label="Translate insights">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(l => (
                                        <SelectItem key={l.code} value={l.code}>
                                            {l.code === 'en' ? 'English (original)' : l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-lg leading-relaxed">{content.summary}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <CardTitle>Key Takeaways</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {content.keyTakeaways.map((takeaway, index) => (
                            <li key={index} className="flex gap-3">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                    {index + 1}
                                </span>
                                <span className="leading-relaxed">{takeaway}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}
