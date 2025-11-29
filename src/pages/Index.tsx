import { useState } from 'react';
import { Download, Code, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfigUpload } from '@/components/ConfigUpload';
import { ConfigEditor } from '@/components/ConfigEditor';
import { CodebaseStats } from '@/components/CodebaseStats';
import { CodebaseConfig } from '@/types/config';
import { generateCodebase } from '@/utils/codeGenerator';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

const DEFAULT_CONFIG: CodebaseConfig = {
  name: 'test_codebase',
  totalModules: 100,
  linesPerFile: { min: 50, max: 200 },
  buildSystem: 'make',
  includeVulnerabilities: false,
  dependencyComplexity: 'medium',
};

const Index = () => {
  const [config, setConfig] = useState<CodebaseConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Generating Codebase",
        description: `Creating ${config.totalModules} modules...`,
      });

      const codebase = generateCodebase(config);
      
      // Create ZIP file
      const zip = new JSZip();
      
      // Add source files
      const srcFolder = zip.folder('src');
      codebase.modules.forEach(module => {
        srcFolder?.file(`${module.name}.h`, module.headerContent);
        srcFolder?.file(`${module.name}.c`, module.sourceContent);
      });
      
      // Add build files
      codebase.buildFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      
      // Add README
      const readme = `# ${config.name}

Generated C codebase for SBOM/CVE testing.

## Build Instructions

${config.buildSystem === 'make' ? `\`\`\`bash
make
./test_program
\`\`\`` : `\`\`\`bash
mkdir build && cd build
cmake ..
make
./test_program
\`\`\``}

## Statistics

- Total Modules: ${config.totalModules}
- Build System: ${config.buildSystem.toUpperCase()}
- Dependency Complexity: ${config.dependencyComplexity}
- Includes Vulnerabilities: ${config.includeVulnerabilities ? 'Yes' : 'No'}

## SBOM

See \`sbom.json\` for the Software Bill of Materials in CycloneDX format.
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
        description: "Codebase generated and downloaded",
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
                C Codebase Generator
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate stubbed C code for SBOM & CVE experimentation
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
                <li>C source & header files</li>
                <li>Module dependency graph</li>
                <li>Build system files</li>
                <li>CycloneDX SBOM (JSON)</li>
                <li>README with build instructions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
