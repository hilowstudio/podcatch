// Languages offered for chat localization and on-demand summary translation.
// Gemini handles these natively, so the list is about UX, not capability.

export const LANGUAGES: { code: string; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
];

const NAME_BY_CODE = new Map(LANGUAGES.map(l => [l.code, l.name]));

export function languageName(code?: string | null): string | null {
    if (!code) return null;
    return NAME_BY_CODE.get(code) ?? null;
}

/** True when a language is set and is something other than English. */
export function isTranslatable(code?: string | null): boolean {
    return !!code && code !== 'en' && NAME_BY_CODE.has(code);
}
