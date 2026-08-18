import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 is S3-compatible. Audio briefings are stored here and served
// publicly (via a custom domain) as podcast RSS enclosures — R2's zero egress
// is what makes serving podcast audio at scale affordable.
//
// Required env:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
//   R2_PUBLIC_BASE_URL  e.g. https://audio.podcatch.app  (custom domain on the bucket)

let client: S3Client | null = null;

export function isR2Configured(): boolean {
    return Boolean(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET &&
        process.env.R2_PUBLIC_BASE_URL,
    );
}

function getClient(): S3Client {
    if (!client) {
        client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
            },
        });
    }
    return client;
}

/** Upload a file to R2 and return its public URL (via the configured custom domain). */
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!isR2Configured()) {
        throw new Error('R2 is not configured (missing R2_* env vars).');
    }
    await getClient().send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Served through the CDN; briefings never change once written.
        CacheControl: 'public, max-age=31536000, immutable',
    }));
    const base = (process.env.R2_PUBLIC_BASE_URL as string).replace(/\/$/, '');
    return `${base}/${key}`;
}
