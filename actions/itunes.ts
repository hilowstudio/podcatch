'use server'

import { searchPodcasts } from '@/lib/itunes';

export async function searchItunesAction(term: string) {
    return await searchPodcasts(term);
}
