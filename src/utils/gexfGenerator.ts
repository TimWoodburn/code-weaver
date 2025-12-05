import { Artifact, System } from '@/types/config';

// Helper to derive system ID from artifact path
function getSystemIdFromPath(path: string): string {
  const parts = path.split('/');
  return parts[0] || 'unknown';
}

export function generateGEXF(
  projectName: string,
  artifacts: Artifact[],
  systems: System[]
): string {
  const timestamp = new Date().toISOString();
  
  // Build nodes XML
  const nodes = artifacts.map(artifact => {
    const systemId = getSystemIdFromPath(artifact.path);
    const system = systems.find(s => s.id === systemId);
    const tierLevel = getTierLevel(artifact.tier);
    
    return `      <node id="${escapeXml(artifact.id)}" label="${escapeXml(artifact.name)}">
        <attvalues>
          <attvalue for="tier" value="${escapeXml(artifact.tier)}"/>
          <attvalue for="tier_level" value="${tierLevel}"/>
          <attvalue for="type" value="${escapeXml(artifact.type)}"/>
          <attvalue for="system" value="${escapeXml(system?.name || 'unknown')}"/>
          <attvalue for="system_id" value="${escapeXml(systemId)}"/>
          <attvalue for="path" value="${escapeXml(artifact.path)}"/>
          <attvalue for="modules_count" value="${artifact.modules.length}"/>
          <attvalue for="lines_of_code" value="${artifact.modules.reduce((sum, m) => sum + m.linesOfCode, 0)}"/>
        </attvalues>
        <viz:size value="${10 + artifact.modules.length * 2}"/>
        <viz:position x="${getXPosition(artifact, systems)}" y="${tierLevel * 150}" z="0"/>
        <viz:color r="${getTierColor(artifact.tier).r}" g="${getTierColor(artifact.tier).g}" b="${getTierColor(artifact.tier).b}"/>
      </node>`;
  }).join('\n');

  // Build edges XML (dependencies)
  const edges: string[] = [];
  let edgeId = 0;
  
  artifacts.forEach(artifact => {
    const artifactSystemId = getSystemIdFromPath(artifact.path);
    artifact.dependencies.forEach(depId => {
      const depArtifact = artifacts.find(a => a.id === depId);
      if (depArtifact) {
        const depSystemId = getSystemIdFromPath(depArtifact.path);
        const isCrossDep = artifactSystemId !== depSystemId;
        edges.push(`      <edge id="e${edgeId++}" source="${escapeXml(artifact.id)}" target="${escapeXml(depId)}" weight="1">
        <attvalues>
          <attvalue for="cross_dependency" value="${isCrossDep}"/>
          <attvalue for="source_tier" value="${escapeXml(artifact.tier)}"/>
          <attvalue for="target_tier" value="${escapeXml(depArtifact.tier)}"/>
        </attvalues>
        <viz:color r="${isCrossDep ? 255 : 100}" g="${isCrossDep ? 100 : 100}" b="${isCrossDep ? 100 : 100}" a="0.7"/>
      </edge>`);
      }
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://gexf.net/1.3" xmlns:viz="http://gexf.net/1.3/viz" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://gexf.net/1.3 http://gexf.net/1.3/gexf.xsd" version="1.3">
  <meta lastmodifieddate="${timestamp.split('T')[0]}">
    <creator>C/C++ Codebase Generator</creator>
    <description>Dependency graph for ${escapeXml(projectName)}</description>
    <keywords>dependencies, hierarchy, ${systems.map(s => s.name).join(', ')}</keywords>
  </meta>
  <graph mode="static" defaultedgetype="directed">
    <attributes class="node">
      <attribute id="tier" title="Tier" type="string"/>
      <attribute id="tier_level" title="Tier Level" type="integer"/>
      <attribute id="type" title="Artifact Type" type="string"/>
      <attribute id="system" title="System" type="string"/>
      <attribute id="system_id" title="System ID" type="string"/>
      <attribute id="path" title="Path" type="string"/>
      <attribute id="modules_count" title="Modules Count" type="integer"/>
      <attribute id="lines_of_code" title="Lines of Code" type="integer"/>
    </attributes>
    <attributes class="edge">
      <attribute id="cross_dependency" title="Cross Dependency" type="boolean"/>
      <attribute id="source_tier" title="Source Tier" type="string"/>
      <attribute id="target_tier" title="Target Tier" type="string"/>
    </attributes>
    <nodes>
${nodes}
    </nodes>
    <edges>
${edges.join('\n')}
    </edges>
  </graph>
</gexf>`;
}

function getTierLevel(tier: string): number {
  switch (tier) {
    case 'system': return 0;
    case 'subsystem': return 1;
    case 'component': return 2;
    default: return 3;
  }
}

function getTierColor(tier: string): { r: number; g: number; b: number } {
  switch (tier) {
    case 'system': return { r: 65, g: 105, b: 225 };     // Royal Blue
    case 'subsystem': return { r: 50, g: 205, b: 50 };   // Lime Green
    case 'component': return { r: 255, g: 165, b: 0 };   // Orange
    default: return { r: 128, g: 128, b: 128 };          // Gray
  }
}

function getXPosition(artifact: Artifact, systems: System[]): number {
  const systemId = getSystemIdFromPath(artifact.path);
  const systemIndex = systems.findIndex(s => s.id === systemId);
  const baseX = systemIndex * 400;
  // Add some variation based on artifact id hash
  const hash = artifact.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return baseX + (hash % 300) - 150;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
