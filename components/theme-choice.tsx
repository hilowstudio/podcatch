'use client';

import { useSyncExternalStore } from 'react';
import { THEME_KEY, type ThemeChoice } from '@/components/theme-script';

// The saved choice lives in this browser's storage; read it as an external
// store so the radio buttons always match what the theme script applied.
const readChoice = (): ThemeChoice => {
    try { return (localStorage.getItem(THEME_KEY) as ThemeChoice | null) ?? 'system'; } catch { return 'system'; }
};
const subscribe = (onChange: () => void) => {
    window.addEventListener('podcatch-theme', onChange);
    window.addEventListener('storage', onChange);
    return () => {
        window.removeEventListener('podcatch-theme', onChange);
        window.removeEventListener('storage', onChange);
    };
};

const OPTIONS: { value: ThemeChoice; label: string; hint: string }[] = [
    { value: 'system', label: 'System', hint: 'Follows this device' },
    { value: 'light', label: 'Light', hint: 'Paper and ink' },
    { value: 'dark', label: 'Dark', hint: 'Easier at night' },
];

export function ThemeChoiceSetting() {
    const choice = useSyncExternalStore(subscribe, readChoice, () => 'system' as ThemeChoice);

    const pick = (value: ThemeChoice) => {
        try { localStorage.setItem(THEME_KEY, value); } catch { /* storage blocked */ }
        window.dispatchEvent(new Event('podcatch-theme'));
    };

    return (
        <fieldset className="space-y-3">
            <legend className="sr-only">Appearance</legend>
            <p className="text-sm text-muted-foreground">Saved on this device.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {OPTIONS.map((o) => (
                    <label
                        key={o.value}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                    >
                        <input
                            type="radio"
                            name="theme"
                            value={o.value}
                            checked={choice === o.value}
                            onChange={() => pick(o.value)}
                            className="size-4 accent-[var(--primary)]"
                        />
                        <span className="leading-tight">
                            <span className="block text-sm font-medium">{o.label}</span>
                            <span className="block text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
