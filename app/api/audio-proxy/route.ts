import { NextRequest, NextResponse } from 'next/server';
import { safeFetch } from '@/lib/ssrf';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    let target: string;
    try {
        target = new URL(url).toString();
    } catch {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    try {
        const range = request.headers.get('range');

        // safeFetch validates the resolved IP and re-validates every redirect hop,
        // so a URL that resolves or redirects to an internal / metadata address is
        // refused (SSRF defense). /api/* is exempt from middleware, so this route
        // is otherwise unauthenticated.
        const response = await safeFetch(target, {
            signal: AbortSignal.timeout(30000),
            headers: {
                'User-Agent': 'Podcatch/1.0',
                ...(range ? { Range: range } : {}),
            },
        });

        if (!response.ok && response.status !== 206) {
            return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'audio/mpeg';

        const headers = new Headers({
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
            'Cache-Control': 'public, max-age=3600',
        });

        const contentLength = response.headers.get('content-length');
        if (contentLength) headers.set('Content-Length', contentLength);
        const acceptRanges = response.headers.get('accept-ranges');
        if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);
        const contentRange = response.headers.get('content-range');
        if (contentRange) headers.set('Content-Range', contentRange);

        return new NextResponse(response.body, {
            status: response.status,
            headers,
        });
    } catch (error) {
        console.error('Audio proxy error:', error);
        return new NextResponse('Failed to fetch audio', { status: 502 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
        },
    });
}
