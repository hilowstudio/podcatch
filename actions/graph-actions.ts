'use server';

import { prisma } from '@/lib/prisma';

export interface GraphNode {
    id: string;
    name: string;
    val: number; // size
    group: string; // 'episode', 'person', 'book', 'concept'
    color?: string;
    image?: string;
}

export interface GraphLink {
    source: string;
    target: string;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
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
                }
            }
        }
    });

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const entityMap = new Map<string, boolean>();

    // Process Episodes
    episodes.forEach(ep => {
        // Add Episode Node
        nodes.push({
            id: ep.id,
            name: ep.title,
            val: 20, // Larger size for episodes
            group: 'episode',
            color: '#ffffff', // White for episodes
            image: ep.feed.image || undefined
        });

        // Process Entities
        ep.entities.forEach(entity => {
            // Add Entity Node if not already added
            if (!entityMap.has(entity.id)) {
                nodes.push({
                    id: entity.id,
                    name: entity.name,
                    val: 5, // Smaller size for entities
                    group: entity.type.toLowerCase(),
                    // Colors handled by frontend or here? Let's generic 'group' handle auto-color for now
                });
                entityMap.set(entity.id, true);
            }

            // Add Link
            links.push({
                source: ep.id,
                target: entity.id
            });
        });
    });

    return { nodes, links };
}
