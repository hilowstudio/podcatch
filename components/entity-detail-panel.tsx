'use client';

import { X, ExternalLink, User, BookOpen, Lightbulb, Building2, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import type { GraphEntity } from '@/actions/graph-actions';

interface CoOccurrence {
    entity: GraphEntity;
    sharedCount: number;
    sharedEpisodes: { id: string; title: string }[];
}

interface EntityDetailPanelProps {
    entity: GraphEntity;
    coOccurringEntities: CoOccurrence[];
    onClose: () => void;
    onEntityClick: (entityId: string) => void;
}

const typeConfig = {
    PERSON: { icon: User, label: 'Person' },
    BOOK: { icon: BookOpen, label: 'Book' },
    CONCEPT: { icon: Lightbulb, label: 'Concept' },
    ORGANIZATION: { icon: Building2, label: 'Organization' },
    TECHNOLOGY: { icon: Cpu, label: 'Technology' },
} as const;

export function EntityDetailPanel({ entity, coOccurringEntities, onClose, onEntityClick }: EntityDetailPanelProps) {
    const config = typeConfig[entity.type];
    const TypeIcon = config.icon;

    return (
        <div className="absolute z-20 bg-card border shadow-lg flex flex-col inset-x-0 bottom-0 h-[60vh] rounded-t-xl border-t md:inset-y-0 md:right-0 md:bottom-auto md:left-auto md:w-96 md:h-full md:rounded-t-none md:rounded-l-xl md:border-l md:border-t-0">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{entity.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-0.5">
                            {config.label}
                        </Badge>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Ask about entity */}
            <div className="px-4 py-3 border-b shrink-0">
                <Link href={`/chat?entity=${encodeURIComponent(entity.name)}&title=${encodeURIComponent(entity.name)}`}>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Ask about {entity.name}
                    </Button>
                </Link>
            </div>

            {/* Scrollable content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Description */}
                    {entity.description && (
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">About</h4>
                            <p className="text-sm leading-relaxed">{entity.description}</p>
                        </div>
                    )}

                    {/* Episodes */}
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            {entity.episodes.length} Episode{entity.episodes.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="space-y-0.5">
                            {entity.episodes.map(ep => (
                                <Link
                                    key={ep.id}
                                    href={`/episodes/${ep.id}`}
                                    className="flex items-center gap-2 text-sm hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="truncate">{ep.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Co-occurring entities */}
                    {coOccurringEntities.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                Connected
                            </h4>
                            <div className="space-y-0.5">
                                {coOccurringEntities.map(({ entity: coEntity, sharedCount }) => (
                                    <button
                                        key={coEntity.id}
                                        onClick={() => onEntityClick(coEntity.id)}
                                        className="flex items-center justify-between w-full text-sm hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors text-left"
                                    >
                                        <span className="truncate">{coEntity.name}</span>
                                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                                            {sharedCount}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
