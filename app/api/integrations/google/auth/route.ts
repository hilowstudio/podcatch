import { randomUUID } from 'node:crypto';
import { auth } from '@/auth';
import { getAuthUrl } from '@/lib/drive';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Generate an anti-CSRF state nonce, stash it in an httpOnly cookie, and
    // require the callback to echo it back. Without this, an attacker can run
    // their own Google consent flow and CSRF a logged-in victim into linking the
    // attacker's Drive to the victim's account.
    const state = randomUUID();
    const url = getAuthUrl(state);

    const response = NextResponse.redirect(url);
    response.cookies.set('google_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600, // 10 minutes
    });
    return response;
}
