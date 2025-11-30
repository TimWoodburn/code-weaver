import { CodebaseConfig, System, Subsystem, Component, Artifact, Module, ArtifactType, SupportedLanguage } from '@/types/config';

function selectLanguage(distribution: { language: SupportedLanguage; percentage: number }[]): SupportedLanguage {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const dist of distribution) {
    cumulative += dist.percentage;
    if (rand < cumulative) {
      return dist.language;
    }
  }
  
  return distribution[0]?.language || 'c';
}

export function generateHierarchy(config: CodebaseConfig) {
  const systems: System[] = [];
  const artifacts: Artifact[] = [];
  const modules: Module[] = [];
  
  let artifactCounter = 0;
  let moduleCounter = 0;
  
  // Generate systems
  for (let s = 0; s < config.tiers.enterprise.systems; s++) {
    const systemId = `sys_${String(s).padStart(3, '0')}`;
    const systemName = `${config.name}_system_${s}`;
    const subsystems: Subsystem[] = [];
    
    // Generate subsystems for this system
    const numSubsystems = config.tiers.subsystem.count;
    for (let ss = 0; ss < numSubsystems; ss++) {
      const subsystemId = `${systemId}_sub_${String(ss).padStart(3, '0')}`;
      const subsystemName = `${systemName}_subsystem_${ss}`;
      const components: Component[] = [];
      
      // Create artifact for subsystem
      const subsystemArtifact: Artifact = {
        id: `artifact_${artifactCounter++}`,
        name: subsystemName,
        type: config.tiers.subsystem.artifactType,
        tier: 'subsystem',
        path: `${systemName}/${subsystemName}`,
        modules: [],
        dependencies: [],
        parentId: systemId
      };
      
      // Generate components for this subsystem
      const numComponents = config.tiers.component.count;
      for (let c = 0; c < numComponents; c++) {
        const componentId = `${subsystemId}_comp_${String(c).padStart(3, '0')}`;
        const componentName = `${subsystemName}_component_${c}`;
        const moduleIds: string[] = [];
        
        // Create artifact for component
        const componentArtifact: Artifact = {
          id: `artifact_${artifactCounter++}`,
          name: componentName,
          type: config.tiers.component.artifactType,
          tier: 'component',
          path: `${systemName}/${subsystemName}/${componentName}`,
          modules: [],
          dependencies: [subsystemArtifact.id],
          parentId: subsystemId
        };
        
        // Generate modules for this component
        const modulesInComponent = Math.floor(
          Math.random() * (config.tiers.component.modulesPerArtifact.max - config.tiers.component.modulesPerArtifact.min) +
          config.tiers.component.modulesPerArtifact.min
        );
        
        for (let m = 0; m < modulesInComponent; m++) {
          const moduleId = `${componentId}_mod_${String(m).padStart(4, '0')}`;
          const moduleName = `${componentName}_module_${m}`;
          
          const module: Module = {
            id: moduleId,
            name: moduleName,
            path: `${componentArtifact.path}/${moduleName}`,
            language: selectLanguage(config.languageDistribution),
            headerContent: '',
            sourceContent: '',
            dependencies: [],
            linesOfCode: 0
          };
          
          moduleIds.push(moduleId);
          modules.push(module);
          componentArtifact.modules.push(module);
          moduleCounter++;
        }
        
        components.push({
          id: componentId,
          name: componentName,
          artifactId: componentArtifact.id,
          moduleIds
        });
        
        artifacts.push(componentArtifact);
        subsystemArtifact.dependencies.push(componentArtifact.id);
      }
      
      subsystems.push({
        id: subsystemId,
        name: subsystemName,
        artifactId: subsystemArtifact.id,
        components
      });
      
      artifacts.push(subsystemArtifact);
    }
    
    systems.push({
      id: systemId,
      name: systemName,
      subsystems
    });
  }
  
  return { systems, artifacts, modules };
}

export function generateDependencies(
  artifacts: Artifact[],
  complexity: 'low' | 'medium' | 'high'
) {
  const maxDeps = complexity === 'low' ? 2 : complexity === 'medium' ? 4 : 6;
  
  artifacts.forEach((artifact, index) => {
    // Can depend on artifacts from same tier or lower tiers
    const potentialDeps = artifacts.filter((other, otherIndex) => {
      if (otherIndex >= index) return false; // Only depend on earlier artifacts
      if (other.id === artifact.id) return false;
      if (artifact.dependencies.includes(other.id)) return false; // Already a dependency
      return true;
    });
    
    const numNewDeps = Math.floor(Math.random() * maxDeps);
    for (let i = 0; i < numNewDeps && potentialDeps.length > 0; i++) {
      const depIndex = Math.floor(Math.random() * potentialDeps.length);
      const dep = potentialDeps.splice(depIndex, 1)[0];
      artifact.dependencies.push(dep.id);
    }
  });
}

export function injectDependencyIssues(
  artifacts: Artifact[],
  modules: Module[],
  issueTypes: string[]
) {
  const issues: any[] = [];
  
  if (issueTypes.includes('circular')) {
    // Inject circular dependencies
    if (artifacts.length >= 3) {
      const a = artifacts[Math.floor(artifacts.length * 0.3)];
      const b = artifacts[Math.floor(artifacts.length * 0.5)];
      const c = artifacts[Math.floor(artifacts.length * 0.7)];
      
      if (!a.dependencies.includes(b.id)) a.dependencies.push(b.id);
      if (!b.dependencies.includes(c.id)) b.dependencies.push(c.id);
      if (!c.dependencies.includes(a.id)) c.dependencies.push(a.id);
      
      issues.push({
        type: 'circular',
        artifacts: [a.id, b.id, c.id],
        description: `Circular dependency: ${a.name} → ${b.name} → ${c.name} → ${a.name}`
      });
    }
  }
  
  if (issueTypes.includes('missing')) {
    // Reference non-existent dependencies
    const numMissing = Math.min(3, Math.floor(artifacts.length * 0.1));
    for (let i = 0; i < numMissing; i++) {
      const artifact = artifacts[Math.floor(Math.random() * artifacts.length)];
      const fakeDep = `missing_artifact_${i}`;
      artifact.dependencies.push(fakeDep);
      
      issues.push({
        type: 'missing',
        artifact: artifact.id,
        missing: fakeDep,
        description: `${artifact.name} depends on non-existent ${fakeDep}`
      });
    }
  }
  
  if (issueTypes.includes('version-conflict')) {
    // Same artifact referenced by multiple versions
    if (artifacts.length >= 5) {
      const target = artifacts[2];
      const user1 = artifacts[Math.floor(artifacts.length * 0.6)];
      const user2 = artifacts[Math.floor(artifacts.length * 0.8)];
      
      issues.push({
        type: 'version-conflict',
        artifact: target.id,
        users: [user1.id, user2.id],
        description: `Version conflict: ${user1.name} needs ${target.name} v1.0, ${user2.name} needs v2.0`
      });
    }
  }
  
  if (issueTypes.includes('transitive')) {
    // A → B → C, but A incompatible with C
    if (artifacts.length >= 3) {
      const a = artifacts[0];
      const b = artifacts[Math.floor(artifacts.length / 2)];
      const c = artifacts[artifacts.length - 1];
      
      if (!a.dependencies.includes(b.id)) a.dependencies.push(b.id);
      if (!b.dependencies.includes(c.id)) b.dependencies.push(c.id);
      
      issues.push({
        type: 'transitive',
        artifacts: [a.id, b.id, c.id],
        description: `Transitive conflict: ${a.name} → ${b.name} → ${c.name}, but ${a.name} incompatible with ${c.name}`
      });
    }
  }
  
  return issues;
}