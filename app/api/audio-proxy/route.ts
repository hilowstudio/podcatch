import { NextRequest, NextResponse } from 'next/server';

const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254', // Cloud metadata (AWS/GCP)
    'metadata.google.internal',
]);

function isPrivateIP(hostname: string): boolean {
    if (BLOCKED_HOSTNAMES.has(hostname)) return true;
    // Block private IPv4 ranges
    if (/^10\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    // Block link-local
    if (/^169\.254\./.test(hostname)) return true;
    return false;
}

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

        // Block internal/private network access (SSRF protection)
        if (isPrivateIP(parsedUrl.hostname)) {
            return new NextResponse('Invalid URL', { status: 400 });
        }

        // Fetch the audio with streaming and timeout
        const response = await fetch(url, {
            signal: AbortSignal.timeout(30000),
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
