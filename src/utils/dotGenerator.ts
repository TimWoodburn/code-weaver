import { Artifact } from '@/types/config';

type TierType = 'system' | 'subsystem' | 'component';

export function generateDOT(artifacts: Artifact[]): string {
  const lines: string[] = [];
  
  lines.push('digraph DependencyHierarchy {');
  lines.push('  rankdir=TB;');
  lines.push('  node [shape=box, style=filled, fontname="Arial"];');
  lines.push('  edge [color="#666666"];');
  lines.push('');
  
  // Group artifacts by tier
  const tierGroups = new Map<TierType, Artifact[]>();
  artifacts.forEach(artifact => {
    const tier = artifact.tier;
    if (!tierGroups.has(tier)) {
      tierGroups.set(tier, []);
    }
    tierGroups.get(tier)!.push(artifact);
  });
  
  // Define tier order and colors
  const tierOrder: TierType[] = ['system', 'subsystem', 'component'];
  const tierColors: Record<TierType, string> = {
    'system': '#E3F2FD',
    'subsystem': '#BBDEFB',
    'component': '#90CAF9'
  };
  
  // Create a map for quick artifact lookup by ID
  const artifactMap = new Map<string, Artifact>();
  artifacts.forEach(a => artifactMap.set(a.id, a));
  
  // Create subgraphs for each tier
  tierOrder.forEach((tier) => {
    const tierArtifacts = tierGroups.get(tier);
    if (!tierArtifacts || tierArtifacts.length === 0) return;
    
    const color = tierColors[tier];
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    
    lines.push(`  subgraph cluster_${tier} {`);
    lines.push(`    label="${tierLabel} Tier";`);
    lines.push(`    style=filled;`);
    lines.push(`    color="${color}";`);
    lines.push(`    fontname="Arial Bold";`);
    lines.push('');
    
    // Add nodes for this tier
    tierArtifacts.forEach(artifact => {
      const nodeId = sanitizeNodeId(artifact.id);
      const label = artifact.name;
      const nodeColor = getTypeColor(artifact.type);
      lines.push(`    "${nodeId}" [label="${label}", fillcolor="${nodeColor}"];`);
    });
    
    lines.push('  }');
    lines.push('');
  });
  
  // Add edges for dependencies
  lines.push('  // Dependencies');
  artifacts.forEach(artifact => {
    const sourceId = sanitizeNodeId(artifact.id);
    
    artifact.dependencies.forEach(depId => {
      const targetArtifact = artifactMap.get(depId);
      if (targetArtifact) {
        const targetId = sanitizeNodeId(depId);
        const isCrossTier = artifact.tier !== targetArtifact.tier;
        const edgeStyle = isCrossTier ? ' [style=bold, color="#E91E63"]' : '';
        lines.push(`  "${sourceId}" -> "${targetId}"${edgeStyle};`);
      }
    });
  });
  
  lines.push('}');
  
  return lines.join('\n');
}

function sanitizeNodeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'executable': '#C8E6C9',
    'static-lib': '#FFECB3',
    'shared-lib': '#D1C4E9'
  };
  return colors[type] || '#FFFFFF';
}
