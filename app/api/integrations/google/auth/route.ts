
import { auth } from '@/auth';
import { getAuthUrl } from '@/lib/drive';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const url = getAuthUrl();
    redirect(url);
}
