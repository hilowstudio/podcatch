'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GraphData, GraphEntity } from '@/actions/graph-actions';
import { EntityDetailPanel } from '@/components/entity-detail-panel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading graph...
        </div>
    ),
});

interface KnowledgeGraphProps {
    initialData: GraphData;
}

type EntityType = 'PERSON' | 'BOOK' | 'CONCEPT' | 'ORGANIZATION' | 'TECHNOLOGY';

/** Resolve a CSS custom property to an rgb() string the canvas can use. */
function resolveColor(cssVar: string): string {
    const el = document.createElement('div');
    el.style.color = `var(${cssVar})`;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color;
    document.body.removeChild(el);
    return resolved;
}

function resolveThemeColors() {
    return {
        background: resolveColor('--background'),
        foreground: resolveColor('--foreground'),
        person: resolveColor('--primary'),
        concept: resolveColor('--status-success'),
        book: resolveColor('--chart-4'),
        organization: resolveColor('--chart-2'),
        technology: resolveColor('--chart-3'),
        muted: resolveColor('--muted-foreground'),
        border: resolveColor('--border'),
    };
}

export function KnowledgeGraph({ initialData }: KnowledgeGraphProps) {
    const fgRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(null);
    const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(new Set(['PERSON', 'BOOK', 'CONCEPT', 'ORGANIZATION', 'TECHNOLOGY']));
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
    const [themeColors, setThemeColors] = useState<ReturnType<typeof resolveThemeColors> | null>(null);

    // Resolve theme colors on mount and when theme changes
    useEffect(() => {
        const computeColors = () => setThemeColors(resolveThemeColors());
        computeColors();

        const observer = new MutationObserver(computeColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener('change', computeColors);

        return () => {
            observer.disconnect();
            mql.removeEventListener('change', computeColors);
        };
    }, []);

    // Track viewport size
    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Derive filtered graph data
    const graphData = useMemo(() => {
        const visibleIds = new Set<string>();
        const nodes = initialData.entities
            .filter(e => activeFilters.has(e.type))
            .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(e => {
                visibleIds.add(e.id);
                return {
                    id: e.id,
                    name: e.name,
                    type: e.type,
                    val: e.episodeCount,
                    episodeCount: e.episodeCount,
                };
            });

        const links = initialData.edges
            .filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target))
            .map(edge => ({
                source: edge.source,
                target: edge.target,
                weight: edge.weight,
            }));

        return { nodes, links };
    }, [initialData, activeFilters, searchQuery]);

    // Search: auto-focus when a single match is found
    useEffect(() => {
        if (!searchQuery || !fgRef.current) {
            setHighlightedNodeId(null);
            return;
        }
        const matches = initialData.entities.filter(e =>
            activeFilters.has(e.type) && e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matches.length === 1) {
            setHighlightedNodeId(matches[0].id);
            // Defer centering until force-graph has the node positioned
            setTimeout(() => {
                const node = fgRef.current?.graphData().nodes.find((n: any) => n.id === matches[0].id);
                if (node && node.x !== undefined) {
                    fgRef.current.centerAt(node.x, node.y, 500);
                    fgRef.current.zoom(3, 500);
                }
            }, 100);
        } else {
            setHighlightedNodeId(null);
        }
    }, [searchQuery, initialData, activeFilters]);

    const getNodeColor = useCallback((type: string) => {
        if (!themeColors) return '#888';
        if (type === 'PERSON') return themeColors.person;
        if (type === 'BOOK') return themeColors.book;
        if (type === 'ORGANIZATION') return themeColors.organization;
        if (type === 'TECHNOLOGY') return themeColors.technology;
        return themeColors.concept;
    }, [themeColors]);

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!themeColors) return;
        const radius = Math.sqrt(node.val || 1) * 3;
        const color = getNodeColor(node.type);
        const isHighlighted = node.id === highlightedNodeId;
        const isSelected = node.id === selectedEntity?.id;

        // Highlight ring
        if (isHighlighted || isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.25;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Label (only when zoomed in enough)
        const fontSize = Math.max(11 / globalScale, 2.5);
        if (fontSize > 2.5) {
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = themeColors.foreground;
            ctx.fillText(node.name, node.x, node.y + radius + 2);
        }
    }, [themeColors, highlightedNodeId, selectedEntity, getNodeColor]);

    const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
        const radius = Math.sqrt(node.val || 1) * 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }, []);

    const getLinkColor = useCallback((link: any) => {
        if (!themeColors) return 'rgba(128,120,110,0.15)';
        const opacity = Math.min(0.12 + link.weight * 0.08, 0.6);
        return themeColors.border.replace(')', ` / ${opacity})`).replace('rgb(', 'rgba(');
    }, [themeColors]);

    const getLinkWidth = useCallback((link: any) => Math.sqrt(link.weight) * 1.5, []);

    const handleNodeClick = useCallback((node: any) => {
        const entity = initialData.entities.find(e => e.id === node.id);
        if (entity) setSelectedEntity(entity);
    }, [initialData]);

    const handleBackgroundClick = useCallback(() => setSelectedEntity(null), []);

    const handleToggleFilter = useCallback((type: EntityType) => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                if (next.size > 1) next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    }, []);

    const getCoOccurringEntities = useCallback((entityId: string) => {
        return initialData.edges
            .filter(e => e.source === entityId || e.target === entityId)
            .map(e => {
                const otherId = e.source === entityId ? e.target : e.source;
                const other = initialData.entities.find(ent => ent.id === otherId);
                if (!other) return null;
                return { entity: other, sharedCount: e.weight, sharedEpisodes: e.sharedEpisodes };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
            .sort((a, b) => b.sharedCount - a.sharedCount);
    }, [initialData]);

    const handleEntityNavigation = useCallback((entityId: string) => {
        const entity = initialData.entities.find(e => e.id === entityId);
        if (entity) {
            setSelectedEntity(entity);
            setTimeout(() => {
                const node = fgRef.current?.graphData().nodes.find((n: any) => n.id === entityId);
                if (node && node.x !== undefined && fgRef.current) {
                    fgRef.current.centerAt(node.x, node.y, 500);
                    fgRef.current.zoom(2, 500);
                }
            }, 100);
        }
    }, [initialData]);

    const filterButtons: { type: EntityType; label: string }[] = [
        { type: 'PERSON', label: 'People' },
        { type: 'BOOK', label: 'Books' },
        { type: 'CONCEPT', label: 'Concepts' },
        { type: 'ORGANIZATION', label: 'Orgs' },
        { type: 'TECHNOLOGY', label: 'Tech' },
    ];

    return (
        <div className="relative w-full h-full">
            {themeColors && (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    backgroundColor={themeColors.background}
                    nodeCanvasObject={nodeCanvasObject}
                    nodeCanvasObjectMode={() => 'replace'}
                    nodePointerAreaPaint={nodePointerAreaPaint}
                    linkWidth={getLinkWidth}
                    linkColor={getLinkColor}
                    onNodeClick={handleNodeClick}
                    onBackgroundClick={handleBackgroundClick}
                    cooldownTicks={100}
                    onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                    enableNodeDrag={true}
                />
            )}

            {/* Controls overlay — top left */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-2rem)]">
                <Input
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-card/90 backdrop-blur-sm shadow-sm"
                />
                <div className="flex gap-1.5">
                    {filterButtons.map(({ type, label }) => (
                        <Button
                            key={type}
                            variant={activeFilters.has(type) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleFilter(type)}
                            className={cn(
                                'text-xs shadow-sm',
                                !activeFilters.has(type) && 'bg-card/80 backdrop-blur-sm',
                            )}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs text-muted-foreground shadow-sm w-fit">
                    {initialData.stats.totalEntities} entities &middot; {initialData.stats.totalEdges} connections
                </div>
            </div>

            {/* Legend — bottom left */}
            <div className="absolute bottom-4 left-4 z-10 bg-card/80 backdrop-blur-sm rounded-md px-3 py-2 pointer-events-none shadow-sm">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Person
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-chart-4" /> Book
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-status-success" /> Concept
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-chart-2" /> Org
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-chart-3" /> Tech
                    </span>
                </div>
            </div>

            {/* Entity detail panel */}
            {selectedEntity && (
                <EntityDetailPanel
                    entity={selectedEntity}
                    coOccurringEntities={getCoOccurringEntities(selectedEntity.id)}
                    onClose={() => setSelectedEntity(null)}
                    onEntityClick={handleEntityNavigation}
                />
            )}
        </div>
    );
}
