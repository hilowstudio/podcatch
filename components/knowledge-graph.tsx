'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { GraphData, GraphNode } from '@/actions/graph-actions';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="text-white p-4">Loading Graph Engine...</div>
});

interface KnowledgeGraphProps {
    initialData: GraphData;
}

export function KnowledgeGraph({ initialData }: KnowledgeGraphProps) {
    const router = useRouter();
    const fgRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        // Adjust to window size
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNodeClick = useCallback((node: any) => {
        if (node.group === 'episode') {
            router.push(`/episodes/${node.id}`);
        } else {
            // Search for entity
            router.push(`/search?q=${encodeURIComponent(node.name)}`);
        }
    }, [router]);

    // Color logic
    const getNodeColor = (node: any) => {
        switch (node.group) {
            case 'episode': return '#ffffff';
            case 'person': return '#3b82f6'; // blue-500
            case 'book': return '#22c55e'; // green-500
            case 'concept': return '#a855f7'; // purple-500
            default: return '#9ca3af'; // gray-400
        }
    };

    return (
        <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={initialData}
            nodeLabel="name"
            nodeColor={getNodeColor}
            nodeRelSize={6}
            linkColor={() => '#ffffff33'} // Translucent white links
            backgroundColor="#000000"
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            onEngineStop={() => fgRef.current.zoomToFit(400)}
        />
    );
}
