// One map of places, shared by the laptop header and the phone's bottom bar.
// Library covers everything a person has added (shows, episodes, collections,
// the map and briefings); each of those pages marks Library as current.
export type NavPlace = {
    href: string;
    label: string;
    match: (pathname: string) => boolean;
};

const startsWithAny = (pathname: string, prefixes: string[]) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const NAV_PLACES: NavPlace[] = [
    { href: '/up-next', label: 'Up next', match: (p) => startsWithAny(p, ['/up-next']) },
    {
        href: '/',
        label: 'Library',
        match: (p) => p === '/' || startsWithAny(p, ['/feeds', '/episodes', '/collections', '/graph', '/briefings']),
    },
    { href: '/snips', label: 'Highlights', match: (p) => startsWithAny(p, ['/snips']) },
    { href: '/search', label: 'Search', match: (p) => startsWithAny(p, ['/search']) },
    { href: '/chat', label: 'Ask', match: (p) => startsWithAny(p, ['/chat']) },
];

// Pages with no app chrome at all.
export const isBareRoute = (pathname: string) => pathname.startsWith('/auth');
