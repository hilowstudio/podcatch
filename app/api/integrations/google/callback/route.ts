
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getTokens } from '@/lib/drive';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return new NextResponse(`Google Auth Error: ${error}`, { status: 400 });
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

        // Ideally we also save the access_token, but for this "occasional" job,
        // using the refresh token to get a fresh access token on demand is safer/easier.
        // Google doesn't always return a refresh token unless 'access_type=offline' 
        // and 'prompt=consent' are set (which we did).

    } catch (e) {
        console.error('Failed to exchange Google token:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    redirect('/settings?google_drive=connected');
}
