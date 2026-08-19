'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export interface GraphEntity {
    id: string;
    name: string;
    type: 'PERSON' | 'BOOK' | 'CONCEPT' | 'ORGANIZATION' | 'TECHNOLOGY';
    description: string | null;
    image: string | null;
    salience: number; // 0-1, peak centrality across episodes — for node sizing
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
    relations: string[]; // typed relationship labels (AUTHORED, HEALS, ...); empty for co-occurrence edges
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
                where: { excluded: false }, // hide incidental / filtered entities
                select: {
                    id: true,
                    name: true,
                    canonicalName: true,
                    type: true,
                    description: true,
                    image: true,
                    salience: true,
                }
            },
            entityRelations: {
                select: { source: true, relation: true, target: true },
            },
        }
    });

    // Build the entity map keyed by NAME (lowercased) so the user's own graph
    // merges the same entity across their episodes. Entities are per-episode rows
    // now, so a name in one user's library is independent of another's.
    const entityMap = new Map<string, GraphEntity>();

    for (const ep of episodes) {
        for (const entity of ep.entities) {
            // Group by the canonical form so variants ("Jesus" / "Jesus Christ")
            // collapse to one node; fall back to the raw name when uncanonicalized.
            const display = entity.canonicalName || entity.name;
            const key = display.trim().toLowerCase();
            if (!key) continue;
            const epRef = { id: ep.id, title: ep.title, feedTitle: ep.feed.title, feedImage: ep.feed.image };
            const salience = entity.salience ?? 0;
            const existing = entityMap.get(key);
            if (existing) {
                existing.episodeCount++;
                existing.episodes.push(epRef);
                if (salience > existing.salience) existing.salience = salience;
                if (!existing.description && entity.description) existing.description = entity.description;
                if (!existing.image && entity.image) existing.image = entity.image;
            } else {
                entityMap.set(key, {
                    id: key,
                    name: display,
                    type: entity.type as GraphEntity['type'],
                    description: entity.description,
                    image: entity.image,
                    salience,
                    episodeCount: 1,
                    episodes: [epRef],
                });
            }
        }
    }

    // Resolve any entity name (raw or canonical) to its canonical node key.
    const nameToKey = new Map<string, string>();
    for (const ep of episodes) {
        for (const e of ep.entities) {
            const canonKey = (e.canonicalName || e.name).trim().toLowerCase();
            nameToKey.set(e.name.trim().toLowerCase(), canonKey);
            if (e.canonicalName) nameToKey.set(e.canonicalName.trim().toLowerCase(), canonKey);
        }
    }

    const edgeMap = new Map<string, GraphEdge>();
    const addEdge = (a: string, b: string, ep: { id: string; title: string }, relation?: string) => {
        if (!a || !b || a === b) return;
        const [s, t] = [a, b].sort();
        const key = `${s}::${t}`;
        let edge = edgeMap.get(key);
        if (!edge) {
            edge = { source: s, target: t, weight: 0, relations: [], sharedEpisodes: [] };
            edgeMap.set(key, edge);
        }
        edge.weight++;
        edge.sharedEpisodes.push({ id: ep.id, title: ep.title });
        if (relation && !edge.relations.includes(relation)) edge.relations.push(relation);
    };

    for (const ep of episodes) {
        // Prefer the extracted, typed relationships. Fall back to co-occurrence
        // only for episodes that have none (e.g. feeds still on the old extraction).
        if (ep.entityRelations.length > 0) {
            for (const rel of ep.entityRelations) {
                const a = nameToKey.get(rel.source.trim().toLowerCase());
                const b = nameToKey.get(rel.target.trim().toLowerCase());
                if (a && b) addEdge(a, b, ep, rel.relation);
            }
        } else {
            const names = [...new Set(ep.entities.map(e => (e.canonicalName || e.name).trim().toLowerCase()).filter(Boolean))];
            for (let i = 0; i < names.length; i++) {
                for (let j = i + 1; j < names.length; j++) {
                    addEdge(names[i], names[j], ep);
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
