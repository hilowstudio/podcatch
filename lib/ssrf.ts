import dns from 'node:dns/promises';
import net from 'node:net';

// Hostnames we refuse outright, independent of what they resolve to.
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',
]);

const MAX_REDIRECTS = 5;

/**
 * Is `ip` in a private / reserved / loopback / link-local range? String matching
 * on the hostname is not enough for SSRF defense (127.0.0.2, IPv6, and DNS names
 * that resolve to internal IPs all bypass it), so callers validate the *resolved*
 * address with this.
 */
export function isBlockedIp(ip: string): boolean {
    const version = net.isIP(ip);
    if (version === 4) {
        const [a, b] = ip.split('.').map(Number);
        if (a === 0) return true; // 0.0.0.0/8
        if (a === 10) return true; // 10.0.0.0/8
        if (a === 127) return true; // loopback 127.0.0.0/8 (all of it, not just 127.0.0.1)
        if (a === 169 && b === 254) return true; // link-local incl. cloud metadata 169.254.169.254
        if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
        if (a === 192 && b === 168) return true; // 192.168.0.0/16
        if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
        return false;
    }
    if (version === 6) {
        const ip6 = ip.toLowerCase();
        if (ip6 === '::1' || ip6 === '::') return true; // loopback / unspecified
        if (ip6.startsWith('fe80')) return true; // link-local fe80::/10
        if (ip6.startsWith('fc') || ip6.startsWith('fd')) return true; // unique-local fc00::/7
        const mapped = ip6.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/); // IPv4-mapped
        if (mapped) return isBlockedIp(mapped[1]);
        return false;
    }
    return true; // not a literal IP after resolution → refuse
}

/** Reject a host that is denylisted or resolves to any private/reserved address. */
export async function assertPublicHost(hostname: string): Promise<void> {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets
    if (BLOCKED_HOSTNAMES.has(host)) {
        throw new Error('Blocked host');
    }
    const addresses = net.isIP(host)
        ? [host]
        : (await dns.lookup(host, { all: true })).map((a) => a.address);
    if (addresses.length === 0 || addresses.some(isBlockedIp)) {
        throw new Error('Blocked address');
    }
    // Residual caveat: DNS rebinding between this lookup and fetch's own
    // resolution isn't fully closed without pinning the socket to the validated
    // IP. Redirect re-validation (safeFetch) covers the common metadata-exfil vector.
}

/**
 * fetch() that validates the target resolves to a public IP and re-validates
 * every redirect hop by hand — a public host that 30x-redirects to an internal
 * address (or an attacker DNS name) can't slip past a single up-front check the
 * way fetch's automatic redirects would. Throws on any blocked host/redirect.
 */
export async function safeFetch(url: string, init: RequestInit = {}): Promise<Response> {
    let currentUrl = new URL(url).toString();

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const parsed = new URL(currentUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Blocked protocol');
        }
        await assertPublicHost(parsed.hostname);

        const res = await fetch(currentUrl, { ...init, redirect: 'manual' });

        if ([301, 302, 303, 307, 308].includes(res.status)) {
            const location = res.headers.get('location');
            if (!location) throw new Error('Invalid redirect (no location)');
            currentUrl = new URL(location, currentUrl).toString();
            continue;
        }
        return res;
    }
    throw new Error('Too many redirects');
}
