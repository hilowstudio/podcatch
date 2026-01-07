
export interface PodcastResult {
    title: string;
    author: string;
    image: string;
    feedUrl: string;
}

export async function searchPodcasts(term: string): Promise<PodcastResult[]> {
    if (!term) return [];

    try {
        const params = new URLSearchParams({
            term,
            media: 'podcast',
            entity: 'podcast',
            limit: '5'
        });

        const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`iTunes API error: ${response.statusText}`);
        }

        const data = await response.json();

        return data.results.map((item: any) => ({
            title: item.collectionName,
            author: item.artistName,
            image: item.artworkUrl600 || item.artworkUrl100,
            feedUrl: item.feedUrl
        })).filter((item: PodcastResult) => item.feedUrl); // Ensure feedUrl exists

    } catch (error) {
        console.error('iTunes Search Error:', error);
        return [];
    }
}
