export interface SilenceRegion {
    start: number;
    end: number;
}

export function computeSilenceRegions(
    words: { start: number; end: number }[],
    threshold = 2 // seconds
): SilenceRegion[] {
    const regions: SilenceRegion[] = [];
    for (let i = 1; i < words.length; i++) {
        const gap = words[i].start - words[i - 1].end;
        if (gap >= threshold) {
            regions.push({
                start: words[i - 1].end + 0.1,
                end: words[i].start - 0.1,
            });
        }
    }
    return regions;
}
