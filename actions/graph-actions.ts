'use server';

import { prisma } from '@/lib/prisma';

export interface GraphEntity {
    id: string;
    name: string;
    type: 'PERSON' | 'BOOK' | 'CONCEPT';
    description: string | null;
    image: string | null;
    episodeCount: number;
    episodes: {
        id: string;
        title: string;
        feedTitle: string | null;
        feedImage: string | null;
    }[];
}

export interface GraphEdge {
    source: string;
    target: string;
    weight: number;
    sharedEpisodes: {
        id: string;
        title: string;
    }[];
}

export interface GraphData {
    entities: GraphEntity[];
    edges: GraphEdge[];
    stats: {
        totalEntities: number;
        totalEdges: number;
        personCount: number;
        bookCount: number;
        conceptCount: number;
    };
}

export async function getGraphData(): Promise<GraphData> {
    const episodes = await prisma.episode.findMany({
        where: { status: 'COMPLETED' },
        select: {
            id: true,
            title: true,
            feed: { select: { title: true, image: true } },
            entities: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    description: true,
                    image: true,
                }
            }
        }
    });

    // Build entity map: accumulate episodes per entity
    const entityMap = new Map<string, GraphEntity>();

    for (const ep of episodes) {
        for (const entity of ep.entities) {
            const existing = entityMap.get(entity.id);
            if (existing) {
                existing.episodeCount++;
                existing.episodes.push({
                    id: ep.id,
                    title: ep.title,
                    feedTitle: ep.feed.title,
                    feedImage: ep.feed.image,
                });
            } else {
                entityMap.set(entity.id, {
                    id: entity.id,
                    name: entity.name,
                    type: entity.type as 'PERSON' | 'BOOK' | 'CONCEPT',
                    description: entity.description,
                    image: entity.image,
                    episodeCount: 1,
                    episodes: [{
                        id: ep.id,
                        title: ep.title,
                        feedTitle: ep.feed.title,
                        feedImage: ep.feed.image,
                    }],
                });
            }
        }
    }

    // Build co-occurrence edges
    const edgeMap = new Map<string, GraphEdge>();

    for (const ep of episodes) {
        const entityIds = ep.entities.map(e => e.id);
        for (let i = 0; i < entityIds.length; i++) {
            for (let j = i + 1; j < entityIds.length; j++) {
                const [a, b] = [entityIds[i], entityIds[j]].sort();
                const key = `${a}::${b}`;
                const existing = edgeMap.get(key);
                if (existing) {
                    existing.weight++;
                    existing.sharedEpisodes.push({ id: ep.id, title: ep.title });
                } else {
                    edgeMap.set(key, {
                        source: a,
                        target: b,
                        weight: 1,
                        sharedEpisodes: [{ id: ep.id, title: ep.title }],
                    });
                }
            }
        }
    }

    // Filter out singleton entities (no edges)
    const connectedIds = new Set<string>();
    for (const edge of edgeMap.values()) {
        connectedIds.add(edge.source);
        connectedIds.add(edge.target);
    }

    const entities = Array.from(entityMap.values()).filter(e => connectedIds.has(e.id));
    const edges = Array.from(edgeMap.values());

    return {
        entities,
        edges,
        stats: {
            totalEntities: entities.length,
            totalEdges: edges.length,
            personCount: entities.filter(e => e.type === 'PERSON').length,
            bookCount: entities.filter(e => e.type === 'BOOK').length,
            conceptCount: entities.filter(e => e.type === 'CONCEPT').length,
        },
    };
}
