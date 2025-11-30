import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeTypes,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { GeneratedCodebase } from '@/types/config';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const elk = new ELK();

interface DependencyGraphProps {
  codebase: GeneratedCodebase;
}

const nodeColors = {
  system: 'hsl(var(--primary))',
  subsystem: 'hsl(var(--secondary))',
  component: 'hsl(var(--accent))',
};

const CustomNode = ({ data }: any) => {
  return (
    <div className="px-4 py-2 rounded-lg border-2 bg-card text-card-foreground shadow-lg min-w-[160px] max-w-[200px]">
      <div className="font-semibold text-sm truncate" title={data.fullName}>
        {data.label}
      </div>
      <div className="text-xs text-muted-foreground capitalize">{data.tier}</div>
      <div className="flex items-center gap-2 mt-1">
        {data.moduleCount && (
          <Badge variant="secondary" className="text-xs">
            {data.moduleCount} modules
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {data.type}
        </Badge>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  artifact: CustomNode,
};

export const DependencyGraph = ({ codebase }: DependencyGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build graph data from codebase with ELK layout
  useEffect(() => {
    const layoutGraph = async () => {
      const artifactMap = new Map(codebase.artifacts.map(a => [a.id, a]));
      
      // Create nodes
      const elkNodes = codebase.artifacts.map(artifact => ({
        id: artifact.id,
        width: 180,
        height: 80,
      }));

      // Create edges for all dependencies
      const elkEdges: any[] = [];
      const newEdges: Edge[] = [];
      
      codebase.artifacts.forEach(artifact => {
        artifact.dependencies.forEach(depId => {
          const depArtifact = artifactMap.get(depId);
          
          // Add to ELK layout only if valid dependency
          if (depArtifact) {
            elkEdges.push({
              id: `${artifact.id}-${depId}`,
              sources: [artifact.id],
              targets: [depId],
            });
          }
          
          // Add to React Flow edges (including missing ones)
          if (depArtifact) {
            newEdges.push({
              id: `${artifact.id}-${depId}`,
              source: artifact.id,
              target: depId,
              type: 'smoothstep',
              animated: false,
              sourceHandle: 'right',
              targetHandle: 'left',
              style: { 
                stroke: 'hsl(var(--primary))', 
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'hsl(var(--primary))',
                width: 20,
                height: 20,
              },
            });
          } else {
            newEdges.push({
              id: `${artifact.id}-${depId}-missing`,
              source: artifact.id,
              target: depId,
              type: 'smoothstep',
              animated: true,
              style: { 
                stroke: 'hsl(var(--destructive))', 
                strokeWidth: 2, 
                strokeDasharray: '5,5' 
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'hsl(var(--destructive))',
              },
              label: 'missing',
              labelStyle: { fill: 'hsl(var(--destructive))', fontSize: 10 },
            });
          }
        });
      });

      // Use ELK to calculate layout
      const graph = await elk.layout({
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.spacing.nodeNode': '80',
          'elk.layered.spacing.nodeNodeBetweenLayers': '100',
          'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        },
        children: elkNodes,
        edges: elkEdges,
      });

      // Convert ELK layout to React Flow nodes
      const newNodes: Node[] = graph.children?.map((node) => {
        const artifact = artifactMap.get(node.id);
        if (!artifact) return null;
        
        const tier = artifact.tier;
        return {
          id: node.id,
          type: 'artifact',
          position: { x: node.x ?? 0, y: node.y ?? 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            label: artifact.name.replace(/_/g, ' ').split(' ').slice(-2).join(' '),
            fullName: artifact.name,
            tier: artifact.tier,
            moduleCount: artifact.modules.length,
            type: artifact.type,
          },
          style: {
            borderColor: nodeColors[tier],
            borderWidth: 3,
          },
        };
      }).filter(Boolean) as Node[];

      setNodes(newNodes);
      setEdges(newEdges);
    };

    layoutGraph();
  }, [codebase, setNodes, setEdges]);

  const stats = useMemo(() => ({
    systems: codebase.enterprise.systems.length,
    subsystems: codebase.artifacts.filter(a => a.tier === 'subsystem').length,
    components: codebase.artifacts.filter(a => a.tier === 'component').length,
    totalDependencies: edges.length,
  }), [codebase, edges]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.systems}</div>
          <div className="text-sm text-muted-foreground">Systems</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-secondary">{stats.subsystems}</div>
          <div className="text-sm text-muted-foreground">Subsystems</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-accent">{stats.components}</div>
          <div className="text-sm text-muted-foreground">Components</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{stats.totalDependencies}</div>
          <div className="text-sm text-muted-foreground">Dependencies</div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-2">
        <div className="h-[700px] w-full bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-right"
            minZoom={0.05}
            maxZoom={1.5}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
            }}
          >
            <Background color="hsl(var(--muted))" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const tier = node.data.tier as keyof typeof nodeColors;
                return nodeColors[tier] || 'hsl(var(--muted))';
              }}
              maskColor="hsl(var(--background) / 0.8)"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </Card>

      <div className="flex gap-4 items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.subsystem }} />
          <span>Subsystem</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.component }} />
          <span>Component</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-destructive rounded-full" />
          <span>Missing Dependency</span>
        </div>
      </div>
    </div>
  );
};
