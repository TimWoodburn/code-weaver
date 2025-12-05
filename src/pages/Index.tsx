import { useState } from 'react';
import { Download, Code, FileCode, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigUpload } from '@/components/ConfigUpload';
import { ConfigEditor } from '@/components/ConfigEditor';
import { CodebaseStats } from '@/components/CodebaseStats';
import { ArtifactsTable } from '@/components/ArtifactsTable';
import { CodebaseConfig, GeneratedCodebase, Artifact } from '@/types/config';
import { generateCodebase } from '@/utils/codeGenerator';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

const DEFAULT_CONFIG: CodebaseConfig = {
  name: 'enterprise_system',
  tiers: {
    enterprise: { systems: 2 },
    system: { count: 3, artifactType: 'static-lib', modulesPerArtifact: { min: 5, max: 15 } },
    subsystem: { count: 4, artifactType: 'static-lib', modulesPerArtifact: { min: 3, max: 10 } },
    component: { count: 5, artifactType: 'static-lib', modulesPerArtifact: { min: 2, max: 8 } },
    module: { linesPerFile: { min: 50, max: 200 } }
  },
  linesPerFile: { min: 50, max: 200 },
  buildSystem: 'make',
  includeVulnerabilities: false,
  dependencyComplexity: 'medium',
  dependencyIssues: [],
  languageDistribution: [
    { language: 'c', percentage: 70 },
    { language: 'cpp', percentage: 30 }
  ],
  crossDependencies: {
    enabled: false,
    probability: 20,
    maxPerArtifact: 3,
    allowedTiers: {
      system: true,
      subsystem: true,
      component: true,
    },
    direction: 'both',
  },
};

const Index = () => {
  const [config, setConfig] = useState<CodebaseConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArtifacts, setGeneratedArtifacts] = useState<Artifact[] | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      toast({
        title: "Generating Codebase",
        description: "Building multi-tier system...",
      });

      const codebase = generateCodebase(config);
      
      // Store artifacts for table display
      setGeneratedArtifacts(codebase.artifacts);

      // Create ZIP file
      const zip = new JSZip();

      // Add all build files
      codebase.buildFiles.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Add README
      const langSummary = config.languageDistribution
        .map(l => `${l.language.toUpperCase()}: ${l.percentage}%`)
        .join(', ');

      const readme = `# ${config.name}

Generated multi-tier C/C++ codebase for SBOM/CVE testing.

## Languages
${langSummary}

## Architecture

- **Systems:** ${config.tiers.enterprise.systems}
- **Artifacts:** ${codebase.stats.totalArtifacts}
  - Executables: ${codebase.stats.executables}
  - Libraries: ${codebase.stats.libraries}
- **Modules:** ${codebase.stats.totalModules}
- **Lines of Code:** ${codebase.stats.totalLines.toLocaleString()}

## Build Instructions

${config.buildSystem === 'make' ? `\`\`\`bash
make
\`\`\`` : `\`\`\`bash
mkdir build && cd build
cmake ..
make
\`\`\``}

## Configuration

- Build System: ${config.buildSystem.toUpperCase()}
- Dependency Complexity: ${config.dependencyComplexity}
- Includes Vulnerabilities: ${config.includeVulnerabilities ? 'Yes' : 'No'}
${config.dependencyIssues.length > 0 ? `- Dependency Issues: ${config.dependencyIssues.join(', ')}` : ''}

## SBOM

See \`sbom.json\` for the Software Bill of Materials in CycloneDX format.

${config.dependencyIssues.length > 0 ? `## Dependency Issues\n\nSee \`DEPENDENCY_ISSUES.md\` for details on injected dependency problems.` : '' }
`;
      zip.file('README.md', readme);

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Generated ${codebase.stats.totalArtifacts} artifacts with ${codebase.stats.totalModules} modules`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name}-config.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Config Exported",
      description: "Configuration saved as JSON",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileCode className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                C/C++ Codebase Generator
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate stubbed C/C++ code for SBOM & CVE experimentation
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Config */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-terminal-cyan mb-4">
                <Code className="inline w-5 h-5 mr-2" />
                Configuration
              </h2>

              <div className="space-y-4">
                <ConfigUpload onConfigLoad={setConfig} />
                <ConfigEditor config={config} onChange={setConfig} />
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            <CodebaseStats config={config} />

            <div className="space-y-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate & Download'}
              </Button>

              <Button
                onClick={handleExportConfig}
                variant="outline"
                className="w-full"
              >
                Export Config
              </Button>
            </div>

            {/* Quick Info */}
            <div className="bg-code-bg border border-border rounded p-4 text-xs space-y-2">
              <div className="text-terminal-green font-bold">Output Includes:</div>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>C/C++ source & header files</li>
                <li>Build system files (Make)</li>
                <li>CycloneDX SBOM (JSON)</li>
                <li>Gephi graph (GEXF)</li>
                <li>README with build instructions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Generated Artifacts Table */}
        {generatedArtifacts && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-terminal-cyan mb-4 flex items-center gap-2">
              <TableIcon className="w-5 h-5" />
              Generated Artifacts ({generatedArtifacts.length})
            </h2>
            <ArtifactsTable artifacts={generatedArtifacts} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
