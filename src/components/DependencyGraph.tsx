// path: src/components/DependencyGraph.tsx

import { useMemo, useState } from "react";
import { Canvas, Node, Edge, MarkerArrow } from "reaflow";
import { GeneratedCodebase } from "@/types/config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DependencyGraphProps {
  codebase: GeneratedCodebase;
}

const nodeColors = {
  system: "hsl(var(--primary))",
  subsystem: "hsl(var(--secondary))",
  component: "hsl(var(--accent))",
};

export const DependencyGraph = ({ codebase }: DependencyGraphProps) => {
  const [zoom, setZoom] = useState(1.5);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Build nodes and edges for Reaflow
  const { nodes, edges } = useMemo(() => {
    const artifactMap = new Map(codebase.artifacts.map((a) => [a.id, a]));

    // Filter artifacts based on selections
    const filteredArtifacts = codebase.artifacts.filter((artifact) => {
      const tierMatch = filterTier === "all" || artifact.tier === filterTier;
      const typeMatch = filterType === "all" || artifact.type === filterType;
      return tierMatch && typeMatch;
    });

    const filteredIds = new Set(filteredArtifacts.map((a) => a.id));

    const graphNodes = filteredArtifacts.map((artifact) => ({
      id: artifact.id,
      text: artifact.name
        .replace(/_/g, " ")
        .split(" ")
        .slice(-2)
        .join(" "),
      data: {
        fullName: artifact.name,
        tier: artifact.tier,
        moduleCount: artifact.modules.length,
        type: artifact.type,
      },
    }));

    const graphEdges: any[] = [];
    filteredArtifacts.forEach((artifact) => {
      artifact.dependencies.forEach((depId) => {
        // Only show edge if both nodes are visible
        if (filteredIds.has(depId)) {
          const depArtifact = artifactMap.get(depId);
          if (depArtifact) {
            graphEdges.push({
              id: `${artifact.id}-${depId}`,
              from: artifact.id,
              to: depId,
            });
          }
        }
      });
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [codebase, filterTier, filterType]);

  const stats = useMemo(
    () => ({
      systems: codebase.enterprise.systems.length,
      subsystems: codebase.artifacts.filter((a) => a.tier === "subsystem")
        .length,
      components: codebase.artifacts.filter((a) => a.tier === "component")
        .length,
      totalDependencies: edges.length,
    }),
    [codebase, edges]
  );

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.3));
  const handleZoomReset = () => setZoom(1.5);

  return (
    <div className="flex flex-col space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button onClick={handleZoomOut} size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button onClick={handleZoomIn} size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={handleZoomReset} size="sm" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="subsystem">Subsystem</SelectItem>
            <SelectItem value="component">Component</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="executable">Executable</SelectItem>
            <SelectItem value="static-lib">Static Lib</SelectItem>
            <SelectItem value="shared-lib">Shared Lib</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.systems}</div>
          <div className="text-sm text-muted-foreground">Systems</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-secondary">
            {stats.subsystems}
          </div>
          <div className="text-sm text-muted-foreground">Subsystems</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-accent">
            {stats.components}
          </div>
          <div className="text-sm text-muted-foreground">Components</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">
            {stats.totalDependencies}
          </div>
          <div className="text-sm text-muted-foreground">Dependencies</div>
        </Card>
      </div>

      {/* Graph area */}
      <Card className="p-0 overflow-hidden border-2 h-[480px] md:h-[600px]">
        <div className="w-full h-full bg-background">
          <Canvas
            nodes={nodes}
            edges={edges}
            direction="RIGHT"
            fit={false}
            zoom={zoom}
            onZoomChange={setZoom}
            pannable={true}
            zoomable={true}
            maxZoom={3}
            minZoom={0.3}
            node={(nodeProps) => {
              const nodeData = nodes.find((n) => n.id === nodeProps.id);
              return (
                <Node
                  {...nodeProps}
                  width={260}
                  height={120}
                  style={{
                    fill: "hsl(var(--card))",
                    stroke: nodeData?.data?.tier
                      ? nodeColors[
                          nodeData.data.tier as keyof typeof nodeColors
                        ]
                      : "hsl(var(--border))",
                    strokeWidth: 3,
                  }}
                  label={
                    <foreignObject
                      width={260}
                      height={120}
                      x={0}
                      y={0}
                    >
                      <div className="px-3 py-2 h-full flex flex-col justify-center">
                        <div
                          className="font-semibold text-xs truncate"
                          title={nodeData?.data?.fullName}
                        >
                          {nodeData?.text}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                          {nodeData?.data?.tier}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {nodeData?.data?.moduleCount && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0"
                            >
                              {nodeData.data.moduleCount} modules
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0"
                          >
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
                  stroke: "hsl(var(--primary))",
                  strokeWidth: 2,
                }}
              >
                <MarkerArrow style={{ fill: "hsl(var(--primary))" }} />
              </Edge>
            )}
          />
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodeColors.subsystem }}
          />
          <span>Subsystem</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodeColors.component }}
          />
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
