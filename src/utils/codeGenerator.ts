import { CodebaseConfig, GeneratedCodebase, Artifact, Module } from '@/types/config';
import { generateHierarchy, generateDependencies, generateCrossDependencies, injectDependencyIssues } from './hierarchyGenerator';
import { generateModuleContent, generateArtifactMakefile, generateRootMakefile } from './codeContentGenerator';

export function generateCodebase(config: CodebaseConfig): GeneratedCodebase {
  // Generate hierarchy
  const { systems, artifacts, modules } = generateHierarchy(config);
  
  // Generate dependencies between artifacts
  generateDependencies(artifacts, config.dependencyComplexity);
  
  // Generate cross-project dependencies
  generateCrossDependencies(artifacts, config.crossDependencies);
  
  // Generate module dependencies
  modules.forEach((module, index) => {
    const artifact = artifacts.find(a => a.modules.some(m => m.id === module.id));
    if (!artifact) return;
    
    // Get modules from dependency artifacts
    const depModules: Module[] = [];
    artifact.dependencies.forEach(depArtifactId => {
      const depArtifact = artifacts.find(a => a.id === depArtifactId);
      if (depArtifact && depArtifact.modules.length > 0) {
        // Pick random module from dependency artifact
        const randomModule = depArtifact.modules[Math.floor(Math.random() * depArtifact.modules.length)];
        depModules.push(randomModule);
        if (!module.dependencies.includes(randomModule.id)) {
          module.dependencies.push(randomModule.id);
        }
      }
    });
    
    // Generate code content
    const targetLines = Math.floor(
      Math.random() * (config.linesPerFile.max - config.linesPerFile.min) + config.linesPerFile.min
    );
    
    generateModuleContent(module, depModules, targetLines, config.includeVulnerabilities);
  });
  
  // Inject dependency issues
  const issues = config.dependencyIssues.length > 0 
    ? injectDependencyIssues(artifacts, modules, config.dependencyIssues)
    : [];
  
  // Generate build files
  const buildFiles: { name: string; path: string; content: string }[] = [];
  
  // Root makefile
  buildFiles.push({
    name: 'Makefile',
    path: 'Makefile',
    content: generateRootMakefile(artifacts)
  });
  
  // Makefile for each artifact
  artifacts.forEach(artifact => {
    buildFiles.push({
      name: 'Makefile',
      path: `${artifact.path}/Makefile`,
      content: generateArtifactMakefile(artifact, artifacts)
    });
    
    // Add source files
    artifact.modules.forEach(module => {
      const ext = module.language === 'cpp' ? 'cpp' : 'c';
      const headerExt = module.language === 'cpp' ? 'hpp' : 'h';
      buildFiles.push({
        name: `${module.name}.${headerExt}`,
        path: `${artifact.path}/${module.name}.${headerExt}`,
        content: module.headerContent
      });
      buildFiles.push({
        name: `${module.name}.${ext}`,
        path: `${artifact.path}/${module.name}.${ext}`,
        content: module.sourceContent
      });
    });
  });
  
  // Generate SBOM
  const sbom = generateSBOM(config, systems, artifacts, modules, issues);
  
  buildFiles.push({
    name: 'sbom.json',
    path: 'sbom.json',
    content: JSON.stringify(sbom, null, 2)
  });
  
  // Add dependency issues report
  if (issues.length > 0) {
    buildFiles.push({
      name: 'DEPENDENCY_ISSUES.md',
      path: 'DEPENDENCY_ISSUES.md',
      content: generateIssuesReport(issues)
    });
  }
  
  // Calculate stats
  const totalLines = modules.reduce((sum, m) => sum + m.linesOfCode, 0);
  const executables = artifacts.filter(a => a.type === 'executable').length;
  const libraries = artifacts.filter(a => a.type !== 'executable').length;
  
  return {
    enterprise: {
      name: config.name,
      systems
    },
    artifacts,
    modules,
    buildFiles,
    sbom,
    stats: {
      totalArtifacts: artifacts.length,
      totalModules: modules.length,
      totalLines,
      executables,
      libraries
    }
  };
}

function generateSBOM(
  config: CodebaseConfig,
  systems: any[],
  artifacts: Artifact[],
  modules: Module[],
  issues: any[]
): any {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        name: config.name,
        version: "1.0.0",
        type: "application",
        description: `Multi-tier system with ${systems.length} systems, ${artifacts.length} artifacts, ${modules.length} modules`
      }
    },
    components: artifacts.map(artifact => ({
      type: artifact.type === 'executable' ? 'application' : 'library',
      "bom-ref": artifact.id,
      name: artifact.name,
      version: "1.0.0",
      description: `${artifact.tier} artifact at ${artifact.path}`,
      properties: [
        { name: "artifact-type", value: artifact.type },
        { name: "tier", value: artifact.tier },
        { name: "modules-count", value: artifact.modules.length.toString() },
        { name: "total-lines", value: artifact.modules.reduce((sum, m) => sum + m.linesOfCode, 0).toString() }
      ]
    })),
    dependencies: artifacts.map(artifact => ({
      ref: artifact.id,
      dependsOn: artifact.dependencies
    })),
    vulnerabilities: config.includeVulnerabilities ? generateVulnerabilities(modules) : [],
    annotations: issues.map(issue => ({
      timestamp: new Date().toISOString(),
      text: issue.description,
      subjects: [issue.artifact || issue.artifacts?.[0]].filter(Boolean)
    }))
  };
}

function generateVulnerabilities(modules: Module[]): any[] {
  const vulns: any[] = [];
  const vulnTypes = ['buffer_overflow', 'use_after_free', 'null_pointer', 'integer_overflow'];
  
  modules.forEach((module, index) => {
    if (module.sourceContent.includes('CVE-XXXX')) {
      const vulnType = vulnTypes[index % vulnTypes.length];
      vulns.push({
        id: `CVE-2024-${String(10000 + index).slice(-5)}`,
        source: { name: "NVD" },
        ratings: [{ severity: "high", method: "CVSSv3" }],
        description: `${vulnType.replace('_', ' ')} in ${module.name}`,
        affects: [{ ref: module.id }]
      });
    }
  });
  
  return vulns;
}

function generateIssuesReport(issues: any[]): string {
  let report = `# Dependency Issues Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total Issues: ${issues.length}\n\n`;
  
  issues.forEach((issue, index) => {
    report += `## Issue ${index + 1}: ${issue.type}\n\n`;
    report += `**Description:** ${issue.description}\n\n`;
    if (issue.artifacts) {
      report += `**Affected Artifacts:** ${issue.artifacts.join(', ')}\n\n`;
    }
    if (issue.artifact) {
      report += `**Artifact:** ${issue.artifact}\n\n`;
    }
    report += `---\n\n`;
  });
  
  return report;
}
