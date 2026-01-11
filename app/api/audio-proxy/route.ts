import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        // Validate URL
        const parsedUrl = new URL(url);

        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return new NextResponse('Invalid URL protocol', { status: 400 });
        }

        // Fetch the audio with streaming
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Podcatch/1.0',
            },
        });

        if (!response.ok) {
            return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
        }

        // Get content type from upstream response
        const contentType = response.headers.get('content-type') || 'audio/mpeg';
        const contentLength = response.headers.get('content-length');

        // Create response headers with CORS
        const headers = new Headers({
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
            'Cache-Control': 'public, max-age=3600',
        });

        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        // Support range requests for audio seeking
        const range = request.headers.get('range');
        if (range && response.headers.get('accept-ranges') === 'bytes') {
            headers.set('Accept-Ranges', 'bytes');
            const contentRange = response.headers.get('content-range');
            if (contentRange) {
                headers.set('Content-Range', contentRange);
            }
        }

        // Stream the response
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        });

    } catch (error) {
        console.error('Audio proxy error:', error);
        return new NextResponse('Failed to fetch audio', { status: 500 });
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
