import { Card } from '@/components/ui/card';
import { CodebaseConfig } from '@/types/config';

interface CodebaseStatsProps {
  config: CodebaseConfig;
}

export function CodebaseStats({ config }: CodebaseStatsProps) {
  const totalArtifacts = config.tiers.enterprise.systems * 
    (config.tiers.subsystem.count + config.tiers.component.count);
  const estimatedModules = totalArtifacts * 
    ((config.tiers.component.modulesPerArtifact.min + config.tiers.component.modulesPerArtifact.max) / 2);
  const avgLines = (config.linesPerFile.min + config.linesPerFile.max) / 2;
  const estimatedLines = estimatedModules * avgLines * 2;
  const estimatedSize = Math.round(estimatedLines * 40 / 1024);

  return (
    <Card className="p-6">
      <h3 className="text-terminal-green font-bold mb-4">Estimated Output</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Systems:</span>
          <span className="text-foreground font-mono">
            {config.tiers.enterprise.systems}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Artifacts:</span>
          <span className="text-foreground font-mono">
            ~{Math.round(totalArtifacts)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Modules:</span>
          <span className="text-foreground font-mono">
            ~{Math.round(estimatedModules)}
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
          <span className="text-muted-foreground">SBOM Format:</span>
          <span className="text-foreground font-mono">CycloneDX 1.5</span>
        </div>
      </div>
    </Card>
  );
}
