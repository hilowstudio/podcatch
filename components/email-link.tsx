// A mailto link that Cloudflare's Email Address Obfuscation leaves alone.
//
// That Cloudflare feature rewrites any address it finds in the HTML into a
// /cdn-cgi/l/email-protection link and decodes it again with a script, so the
// HTML React hydrates no longer matches what React rendered (React error #418).
// Cloudflare skips anything between <!--email_off--> and <!--/email_off-->,
// which React can only emit as raw HTML, so the link is written that way.
// Address, label and class come from our own code, never from user input,
// and are checked or escaped anyway.

const ALLOWED = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function EmailLink({ address, label, className }: { address: string; label?: string; className?: string }) {
    if (!ALLOWED.test(address)) throw new Error('EmailLink: not an email address');
    const cls = className ? ` class="${escapeHtml(className)}"` : '';
    const text = escapeHtml(label ?? address);
    return (
        <span
            dangerouslySetInnerHTML={{
                __html: `<!--email_off--><a href="mailto:${address}"${cls}>${text}</a><!--/email_off-->`,
            }}
        />
    );
}
