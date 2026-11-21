// Which top-level routes need a signed-in person. Sign-in (auth.ts) asks
// needsSignIn(); anything not listed as private is public, so an unknown
// address reaches the real 404 page instead of the sign-in screen.
//
// Every top-level folder in app/ must appear in exactly one list. The test
// in route-access.test.ts fails when a new folder is added without being
// classified, so a new private page can't be left open by accident.

export const PRIVATE_ROUTES = [
    '/admin',
    '/brand-voice',
    '/briefings',
    '/chat',
    '/collections',
    '/episodes',
    '/feeds',
    '/graph',
    '/integrations',
    '/notifications',
    '/profile',
    '/search',
    '/settings',
    '/snips',
    '/up-next',
] as const;

// Public pages. Each one decides what it shows: /share and /snip load only
// items their owners made public, and return 404 otherwise.
export const PUBLIC_ROUTES = [
    '/auth',
    '/help',
    '/offline',
    '/pricing',
    '/privacy',
    '/share',
    '/snip',
    '/terms',
] as const;

const under = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);

export function needsSignIn(pathname: string): boolean {
    return PRIVATE_ROUTES.some((route) => under(pathname, route));
}
