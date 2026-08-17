import { ImageResponse } from 'next/og';
import { getPublicSnip } from '@/actions/snip-actions';

export const alt = 'Podcast highlight on Podcatch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generates the social-share card for a public highlight: the quote, big and
// centered, over the podcast provenance. Satori supports flexbox only — no grid.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const snip = await getPublicSnip(id);

    const quoteRaw = snip?.content?.trim() || snip?.note?.trim() || 'A highlighted moment';
    const quote = quoteRaw.length > 240 ? quoteRaw.slice(0, 237) + '…' : quoteRaw;
    const podcast = snip?.episode.feed.title || 'Podcatch';
    const episodeTitle = snip?.episode.title || '';
    const image = snip?.episode.feed.image || null;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #0d1015 0%, #14262a 100%)',
                    padding: '72px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            background: '#35b7c0',
                            color: '#0d1015',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '30px',
                            fontWeight: 800,
                        }}
                    >
                        P
                    </div>
                    <div style={{ color: '#8fb6ba', fontSize: '26px', fontWeight: 700, letterSpacing: '0.04em' }}>
                        PODCATCH · HIGHLIGHT
                    </div>
                </div>

                <div style={{ display: 'flex' }}>
                    <div
                        style={{
                            color: '#f2f5f6',
                            fontSize: quote.length > 140 ? '48px' : '60px',
                            fontWeight: 700,
                            lineHeight: 1.22,
                            display: 'flex',
                        }}
                    >
                        “{quote}”
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={image}
                            width={72}
                            height={72}
                            style={{ borderRadius: '12px', objectFit: 'cover' }}
                            alt=""
                        />
                    ) : null}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#ffffff', fontSize: '30px', fontWeight: 700 }}>{podcast}</div>
                        <div style={{ color: '#8a949e', fontSize: '24px', maxWidth: '820px' }}>
                            {episodeTitle.length > 70 ? episodeTitle.slice(0, 67) + '…' : episodeTitle}
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size },
    );
}
