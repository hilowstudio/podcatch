'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export interface GraphEntity {
    id: string;
    name: string;
    type: 'PERSON' | 'BOOK' | 'CONCEPT' | 'ORGANIZATION' | 'TECHNOLOGY';
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
        organizationCount: number;
        technologyCount: number;
    };
}

const EMPTY_GRAPH: GraphData = {
    entities: [],
    edges: [],
    stats: {
        totalEntities: 0,
        totalEdges: 0,
        personCount: 0,
        bookCount: 0,
        conceptCount: 0,
        organizationCount: 0,
        technologyCount: 0,
    },
};

export async function getGraphData(): Promise<GraphData> {
    const session = await auth();
    if (!session?.user?.id) return EMPTY_GRAPH;

    // Scope to the caller's own subscribed feeds — the graph must not expose
    // entities or episode titles from other users' libraries.
    const episodes = await prisma.episode.findMany({
        where: {
            status: 'COMPLETED',
            feed: { subscriptions: { some: { userId: session.user.id } } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 1000, // safety bound — the co-occurrence edge build is O(entities²) per episode
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

    // Build the entity map keyed by NAME (lowercased) so the user's own graph
    // merges the same entity across their episodes. Entities are per-episode rows
    // now, so a name in one user's library is independent of another's.
    const entityMap = new Map<string, GraphEntity>();

    for (const ep of episodes) {
        for (const entity of ep.entities) {
            const key = entity.name.trim().toLowerCase();
            if (!key) continue;
            const epRef = { id: ep.id, title: ep.title, feedTitle: ep.feed.title, feedImage: ep.feed.image };
            const existing = entityMap.get(key);
            if (existing) {
                existing.episodeCount++;
                existing.episodes.push(epRef);
                if (!existing.description && entity.description) existing.description = entity.description;
                if (!existing.image && entity.image) existing.image = entity.image;
            } else {
                entityMap.set(key, {
                    id: key,
                    name: entity.name,
                    type: entity.type as GraphEntity['type'],
                    description: entity.description,
                    image: entity.image,
                    episodeCount: 1,
                    episodes: [epRef],
                });
            }
        }
    }

    // Build co-occurrence edges between entity NAMES.
    const edgeMap = new Map<string, GraphEdge>();

    for (const ep of episodes) {
        const names = [...new Set(ep.entities.map(e => e.name.trim().toLowerCase()).filter(Boolean))];
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const [a, b] = [names[i], names[j]].sort();
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
            organizationCount: entities.filter(e => e.type === 'ORGANIZATION').length,
            technologyCount: entities.filter(e => e.type === 'TECHNOLOGY').length,
        },
    };
}
