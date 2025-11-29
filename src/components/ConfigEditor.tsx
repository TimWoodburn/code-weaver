import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CodebaseConfig, ArtifactType } from '@/types/config';
import { Badge } from '@/components/ui/badge';

interface ConfigEditorProps {
  config: CodebaseConfig;
  onChange: (config: CodebaseConfig) => void;
}

export function ConfigEditor({ config, onChange }: ConfigEditorProps) {
  const updateConfig = (updates: Partial<CodebaseConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateTier = (tier: 'system' | 'subsystem' | 'component', updates: any) => {
    onChange({
      ...config,
      tiers: {
        ...config.tiers,
        [tier]: { ...config.tiers[tier], ...updates }
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-terminal-cyan">Basic Configuration</h3>
        
        <div>
          <Label htmlFor="name" className="text-terminal-cyan">Enterprise Name</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            className="mt-2 bg-code-bg"
          />
        </div>

        <div>
          <Label htmlFor="systems" className="text-terminal-cyan">Number of Systems</Label>
          <Input
            id="systems"
            type="number"
            min="1"
            max="100"
            value={config.tiers.enterprise.systems}
            onChange={(e) => updateConfig({
              tiers: { ...config.tiers, enterprise: { systems: parseInt(e.target.value) || 1 } }
            })}
            className="mt-2 bg-code-bg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Top-level systems in the enterprise (1-100)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minLines" className="text-terminal-cyan">Min Lines/Module</Label>
            <Input
              id="minLines"
              type="number"
              min="10"
              value={config.linesPerFile.min}
              onChange={(e) => updateConfig({
                linesPerFile: { ...config.linesPerFile, min: parseInt(e.target.value) || 10 }
              })}
              className="mt-2 bg-code-bg"
            />
          </div>
          <div>
            <Label htmlFor="maxLines" className="text-terminal-cyan">Max Lines/Module</Label>
            <Input
              id="maxLines"
              type="number"
              min="10"
              value={config.linesPerFile.max}
              onChange={(e) => updateConfig({
                linesPerFile: { ...config.linesPerFile, max: parseInt(e.target.value) || 100 }
              })}
              className="mt-2 bg-code-bg"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="buildSystem" className="text-terminal-cyan">Build System</Label>
          <Select
            value={config.buildSystem}
            onValueChange={(value) => updateConfig({ buildSystem: value as 'make' | 'cmake' })}
          >
            <SelectTrigger className="mt-2 bg-code-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="make">Makefile</SelectItem>
              <SelectItem value="cmake">CMake</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="complexity" className="text-terminal-cyan">Dependency Complexity</Label>
          <Select
            value={config.dependencyComplexity}
            onValueChange={(value) => updateConfig({ 
              dependencyComplexity: value as 'low' | 'medium' | 'high' 
            })}
          >
            <SelectTrigger className="mt-2 bg-code-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (0-2 deps/artifact)</SelectItem>
              <SelectItem value="medium">Medium (0-4 deps/artifact)</SelectItem>
              <SelectItem value="high">High (0-6 deps/artifact)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="vulns" className="text-terminal-cyan">Include CVE Patterns</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Add known vulnerability patterns for testing
            </p>
          </div>
          <Switch
            id="vulns"
            checked={config.includeVulnerabilities}
            onCheckedChange={(checked) => updateConfig({ includeVulnerabilities: checked })}
          />
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-terminal-cyan">Tier Configuration</h3>
          <Badge variant="outline" className="text-xs">5-Tier Hierarchy</Badge>
        </div>
        
        {(['system', 'subsystem', 'component'] as const).map((tier) => (
          <div key={tier} className="border border-border/30 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-terminal-green capitalize">{tier} Tier</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Count per Parent</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={config.tiers[tier].count}
                  onChange={(e) => updateTier(tier, { count: parseInt(e.target.value) || 1 })}
                  className="mt-1 bg-code-bg"
                />
              </div>
              
              <div>
                <Label className="text-sm">Artifact Type</Label>
                <Select
                  value={config.tiers[tier].artifactType}
                  onValueChange={(value: ArtifactType) => updateTier(tier, { artifactType: value })}
                >
                  <SelectTrigger className="mt-1 bg-code-bg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executable">Executable</SelectItem>
                    <SelectItem value="static-lib">Static Library (.a)</SelectItem>
                    <SelectItem value="shared-lib">Shared Library (.so)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Min Modules</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.tiers[tier].modulesPerArtifact.min}
                  onChange={(e) => updateTier(tier, {
                    modulesPerArtifact: { 
                      ...config.tiers[tier].modulesPerArtifact,
                      min: parseInt(e.target.value) || 1 
                    }
                  })}
                  className="mt-1 bg-code-bg"
                />
              </div>
              <div>
                <Label className="text-sm">Max Modules</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.tiers[tier].modulesPerArtifact.max}
                  onChange={(e) => updateTier(tier, {
                    modulesPerArtifact: {
                      ...config.tiers[tier].modulesPerArtifact,
                      max: parseInt(e.target.value) || 10
                    }
                  })}
                  className="mt-1 bg-code-bg"
                />
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
