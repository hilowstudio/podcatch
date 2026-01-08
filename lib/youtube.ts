import { google } from 'googleapis';

// Helper to get authenticated client lazily
function getYoutubeClient() {
    if (!process.env.YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY is not defined');
    }
    return google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
    });
}

export interface YouTubeChannelDetails {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    customUrl?: string; // e.g. @handle
    uploadPlaylistId: string; // "UU..." ID for uploads
}

export interface YouTubeVideoDetails {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedAt: string | null;
    channelId: string;
}

/**
 * Identify a channel from various input formats:
 * - Channel ID: UC...
 * - Handle: @username
 * - User URL: youtube.com/user/username
 * - Custom URL: youtube.com/c/customname
 * 
 * NOTE: For simplicity, we primarily support Handles and Channel IDs.
 */
export async function getChannelDetails(input: string): Promise<YouTubeChannelDetails | null> {
    try {
        let channelId = input;

        // If input contains youtube.com or @, try to resolve it
        if (input.includes('youtube.com') || input.startsWith('@')) {
            // Handle search
            const handle = input.includes('@') ? input.split('@')[1].split('/')[0] : null;
            if (handle) {
                const searchRes = await getYoutubeClient().search.list({
                    part: ['snippet'],
                    q: `@${handle}`,
                    type: ['channel'],
                    maxResults: 1,
                });
                if (searchRes.data.items?.[0]?.id?.channelId) {
                    channelId = searchRes.data.items[0].id.channelId;
                }
            }
        }

        // Fetch channel details
        const res = await getYoutubeClient().channels.list({
            part: ['snippet', 'contentDetails'],
            id: [channelId],
        });

        const item = res.data.items?.[0];
        if (!item || !item.snippet || !item.contentDetails) {
            return null;
        }

        return {
            id: item.id!,
            title: item.snippet.title!,
            description: item.snippet.description!,
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url!,
            customUrl: item.snippet.customUrl || undefined,
            uploadPlaylistId: item.contentDetails.relatedPlaylists?.uploads!,
        };
    } catch (error) {
        console.error('Error fetching YouTube channel:', error);
        return null;
    }
}

/**
 * Fetch latest videos from a channel's "Uploads" playlist.
 * This is more efficient than 'search'.
 */
export async function getLatestVideos(uploadPlaylistId: string, limit = 10): Promise<YouTubeVideoDetails[]> {
    try {
        const res = await getYoutubeClient().playlistItems.list({
            part: ['snippet', 'contentDetails'],
            playlistId: uploadPlaylistId,
            maxResults: limit,
        });

        return (res.data.items || [])
            .map(item => ({
                id: item.contentDetails?.videoId!,
                title: item.snippet?.title!,
                description: item.snippet?.description!,
                thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url!,
                publishedAt: item.snippet?.publishedAt || null,
                channelId: item.snippet?.channelId!,
            }))
            .filter(v => v.id); // Filter out any missing IDs
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}
