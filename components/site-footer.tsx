import Link from 'next/link';
import { EmailLink } from '@/components/email-link';

const LINKS = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
];

export function SiteFooter() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div className="space-y-1">
                    <p>Podcatch is made by Hi Low Studio LLC.</p>
                    <p>It works online: playing, transcribing and syncing need an internet connection.</p>
                </div>
                <nav aria-label="Footer">
                    <ul className="flex flex-wrap gap-x-2">
                        {LINKS.map((l) => (
                            <li key={l.href}>
                                <Link href={l.href} className="inline-flex min-h-11 items-center px-2 hover:text-foreground">
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <EmailLink
                                address="support@podcatch.app"
                                label="Contact"
                                className="inline-flex min-h-11 items-center px-2 hover:text-foreground"
                            />
                        </li>
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
