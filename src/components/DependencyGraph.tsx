import { useMemo } from 'react';
import { Canvas, Node, Edge, MarkerArrow, Label } from 'reaflow';
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


export const DependencyGraph = ({ codebase }: DependencyGraphProps) => {
  // Build nodes and edges for Reaflow
  const { nodes, edges } = useMemo(() => {
    const artifactMap = new Map(codebase.artifacts.map(a => [a.id, a]));
    
    const graphNodes = codebase.artifacts.map(artifact => ({
      id: artifact.id,
      text: artifact.name.replace(/_/g, ' ').split(' ').slice(-2).join(' '),
      data: {
        fullName: artifact.name,
        tier: artifact.tier,
        moduleCount: artifact.modules.length,
        type: artifact.type,
      },
    }));

    const graphEdges: any[] = [];
    codebase.artifacts.forEach(artifact => {
      artifact.dependencies.forEach(depId => {
        const depArtifact = artifactMap.get(depId);
        if (depArtifact) {
          graphEdges.push({
            id: `${artifact.id}-${depId}`,
            from: artifact.id,
            to: depId,
          });
        }
      });
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [codebase]);

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
          <Canvas
            nodes={nodes}
            edges={edges}
            direction="RIGHT"
            fit={true}
            maxWidth={250}
            maxHeight={100}
            node={(nodeProps) => {
              const nodeData = nodes.find(n => n.id === nodeProps.id);
              return (
                <Node
                  {...nodeProps}
                  style={{
                    fill: 'hsl(var(--card))',
                    stroke: nodeData?.data?.tier ? nodeColors[nodeData.data.tier as keyof typeof nodeColors] : 'hsl(var(--border))',
                    strokeWidth: 3,
                  }}
                  label={
                    <foreignObject width={nodeProps.width || 250} height={nodeProps.height || 100} x={0} y={0}>
                      <div className="px-3 py-2 h-full flex flex-col justify-center">
                        <div className="font-semibold text-xs truncate" title={nodeData?.data?.fullName}>
                          {nodeData?.text}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                          {nodeData?.data?.tier}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {nodeData?.data?.moduleCount && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">
                              {nodeData.data.moduleCount} modules
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {nodeData?.data?.type}
                          </Badge>
                        </div>
                      </div>
                    </foreignObject>
                  }
                />
              );
            }}
            edge={(edgeProps) => (
              <Edge
                {...edgeProps}
                style={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                }}
              >
                <MarkerArrow style={{ fill: 'hsl(var(--primary))' }} />
              </Edge>
            )}
          />
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
