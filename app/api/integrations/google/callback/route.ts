import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getTokens } from '@/lib/drive';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
        return new NextResponse(`Google Auth Error: ${error}`, { status: 400 });
    }

    // CSRF defense: the state must match the nonce set on the initiate request.
    const expectedState = req.cookies.get('google_oauth_state')?.value;
    if (!state || !expectedState || state !== expectedState) {
        return new NextResponse('Invalid OAuth state', { status: 400 });
    }

    if (!code) {
        return new NextResponse('Missing code', { status: 400 });
    }

    try {
        const tokens = await getTokens(code);

        if (tokens.refresh_token) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { googleDriveRefreshToken: tokens.refresh_token },
            });
        }
    } catch (e) {
        console.error('Failed to exchange Google token:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Clear the one-time state cookie and redirect back to settings.
    const response = NextResponse.redirect(new URL('/settings?google_drive=connected', req.nextUrl.origin));
    response.cookies.delete('google_oauth_state');
    return response;
}
