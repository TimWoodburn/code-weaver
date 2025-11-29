import { Card } from '@/components/ui/card';
import { CodebaseConfig } from '@/types/config';

interface CodebaseStatsProps {
  config: CodebaseConfig;
}

export function CodebaseStats({ config }: CodebaseStatsProps) {
  const avgLines = (config.linesPerFile.min + config.linesPerFile.max) / 2;
  const estimatedLines = config.totalModules * avgLines * 2; // header + source
  const estimatedSize = Math.round(estimatedLines * 40 / 1024); // ~40 bytes per line avg

  return (
    <Card className="p-6">
      <h3 className="text-terminal-green font-bold mb-4">Estimated Output</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Files:</span>
          <span className="text-foreground font-mono">
            {config.totalModules * 2 + 2}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Lines of Code:</span>
          <span className="text-foreground font-mono">
            ~{Math.round(estimatedLines / 1000)}K
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Size:</span>
          <span className="text-foreground font-mono">
            ~{estimatedSize}KB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Build System:</span>
          <span className="text-foreground font-mono">
            {config.buildSystem === 'make' ? 'Makefile' : 'CMake'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">SBOM Format:</span>
          <span className="text-foreground font-mono">CycloneDX 1.4</span>
        </div>
      </div>
    </Card>
  );
}
