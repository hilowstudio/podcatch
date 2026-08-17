'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { setPreferredLanguage } from '@/actions/language-actions';
import { LANGUAGES } from '@/lib/languages';

export function LanguageSettings({ initialLanguage }: { initialLanguage: string | null }) {
    const [lang, setLang] = useState(initialLanguage || 'en');
    const [busy, setBusy] = useState(false);

    async function handleChange(code: string) {
        setBusy(true);
        const prev = lang;
        setLang(code);
        const res = await setPreferredLanguage(code);
        setBusy(false);
        if (!res.success) {
            setLang(prev);
            toast.error(res.error || 'Failed to update');
            return;
        }
        toast.success(code === 'en' ? 'Set to English' : 'Language updated');
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="language-select">Language</Label>
            <Select value={lang} onValueChange={handleChange} disabled={busy}>
                <SelectTrigger id="language-select" className="w-64">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                Chat replies come back in this language, and episode summaries offer a one-tap translation. Transcripts stay in their original language.
            </p>
        </div>
    );
}
