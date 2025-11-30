import { useEffect, useMemo, useCallback } from 'react';
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
import { GeneratedCodebase } from '@/types/config';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="px-4 py-2 rounded-lg border-2 bg-card text-card-foreground shadow-lg min-w-[120px]">
      <div className="font-semibold text-sm truncate">{data.label}</div>
      <div className="text-xs text-muted-foreground">{data.tier}</div>
      {data.moduleCount && (
        <Badge variant="secondary" className="text-xs mt-1">
          {data.moduleCount} modules
        </Badge>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  artifact: CustomNode,
};

export const DependencyGraph = ({ codebase }: DependencyGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build graph data from codebase
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const artifactMap = new Map(codebase.artifacts.map(a => [a.id, a]));

    // Create nodes for each artifact
    codebase.artifacts.forEach((artifact, index) => {
      const tier = artifact.tier;
      const column = tier === 'subsystem' ? 0 : tier === 'component' ? 1 : 2;
      const row = index;

      newNodes.push({
        id: artifact.id,
        type: 'artifact',
        position: { 
          x: column * 300 + Math.random() * 50, 
          y: row * 150 + Math.random() * 50 
        },
        data: {
          label: artifact.name.split('_').pop() || artifact.name,
          tier: artifact.tier,
          moduleCount: artifact.modules.length,
          type: artifact.type,
        },
        style: {
          borderColor: nodeColors[tier],
          borderWidth: 2,
        },
      });
    });

    // Create edges for dependencies
    codebase.artifacts.forEach(artifact => {
      artifact.dependencies.forEach(depId => {
        const depArtifact = artifactMap.get(depId);
        if (depArtifact) {
          newEdges.push({
            id: `${artifact.id}-${depId}`,
            source: artifact.id,
            target: depId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'hsl(var(--muted-foreground))',
            },
          });
        } else {
          // Missing dependency - show in red
          newEdges.push({
            id: `${artifact.id}-${depId}`,
            source: artifact.id,
            target: depId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'hsl(var(--destructive))', strokeWidth: 2, strokeDasharray: '5,5' },
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

    setNodes(newNodes);
    setEdges(newEdges);
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
        <div className="h-[600px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const tier = node.data.tier as keyof typeof nodeColors;
                return nodeColors[tier] || 'hsl(var(--muted))';
              }}
              maskColor="hsl(var(--background) / 0.8)"
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
