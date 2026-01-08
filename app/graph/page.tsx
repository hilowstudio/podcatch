import { KnowledgeGraph } from '@/components/knowledge-graph';
import { getGraphData } from '@/actions/graph-actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Knowledge Graph - Podcatch',
    description: 'Visualize your library.',
};

export default async function GraphPage() {
    const data = await getGraphData();

    return (
        <div className="h-[calc(100vh-4rem)] w-full overflow-hidden bg-black relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 rounded backdrop-blur text-white pointer-events-none">
                <h1 className="text-2xl font-bold">Knowledge Graph</h1>
                <p className="text-sm opacity-70">
                    {data.nodes.filter(n => n.group === 'episode').length} Episodes • {data.nodes.filter(n => n.group !== 'episode').length} Entities
                </p>
                <div className="mt-2 flex gap-2 text-xs">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white"></div> Episode</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Person</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Book</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Concept</span>
                </div>
            </div>

            <KnowledgeGraph initialData={data} />
        </div>
    );
}
