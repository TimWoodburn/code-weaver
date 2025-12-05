import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CodebaseConfig, ArtifactType, SupportedLanguage, CrossDepDirection } from '@/types/config';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const addLanguage = () => {
    const usedPercentage = config.languageDistribution.reduce((sum, l) => sum + l.percentage, 0);
    const remaining = 100 - usedPercentage;
    if (remaining > 0) {
      onChange({
        ...config,
        languageDistribution: [
          ...config.languageDistribution,
          { language: 'cpp', percentage: Math.min(remaining, 50) }
        ]
      });
    }
  };

  const updateLanguage = (index: number, updates: { language?: SupportedLanguage; percentage?: number }) => {
    const newDist = [...config.languageDistribution];
    newDist[index] = { ...newDist[index], ...updates };
    onChange({ ...config, languageDistribution: newDist });
  };

  const removeLanguage = (index: number) => {
    onChange({
      ...config,
      languageDistribution: config.languageDistribution.filter((_, i) => i !== index)
    });
  };

  const totalPercentage = config.languageDistribution.reduce((sum, l) => sum + l.percentage, 0);

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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-terminal-cyan">Language Distribution</h3>
          <Badge variant={totalPercentage === 100 ? "default" : "destructive"} className="text-xs">
            {totalPercentage}% Total
          </Badge>
        </div>

        <div className="space-y-3">
          {config.languageDistribution.map((lang, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-sm">Language</Label>
                <Select
                  value={lang.language}
                  onValueChange={(value: SupportedLanguage) => updateLanguage(index, { language: value })}
                >
                  <SelectTrigger className="mt-1 bg-code-bg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label className="text-sm">Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={lang.percentage}
                  onChange={(e) => updateLanguage(index, { percentage: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-code-bg"
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeLanguage(index)}
                disabled={config.languageDistribution.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {totalPercentage < 100 && (
          <Button
            variant="outline"
            onClick={addLanguage}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Language
          </Button>
        )}

        {totalPercentage !== 100 && (
          <p className="text-xs text-destructive">
            Total percentage must equal 100%
          </p>
        )}
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

      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-terminal-cyan">Cross-Project Dependencies</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dependencies between artifacts in different systems/subsystems
            </p>
          </div>
          <Switch
            checked={config.crossDependencies.enabled}
            onCheckedChange={(checked) => updateConfig({
              crossDependencies: { ...config.crossDependencies, enabled: checked }
            })}
          />
        </div>

        {config.crossDependencies.enabled && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-terminal-cyan">Probability</Label>
                <Badge variant="outline">{config.crossDependencies.probability}%</Badge>
              </div>
              <Slider
                value={[config.crossDependencies.probability]}
                onValueChange={([value]) => updateConfig({
                  crossDependencies: { ...config.crossDependencies, probability: value }
                })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Chance each artifact gets cross-dependencies
              </p>
            </div>

            <div>
              <Label className="text-terminal-cyan">Max Per Artifact</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={config.crossDependencies.maxPerArtifact}
                onChange={(e) => updateConfig({
                  crossDependencies: { ...config.crossDependencies, maxPerArtifact: parseInt(e.target.value) || 1 }
                })}
                className="mt-2 bg-code-bg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum cross-dependencies per artifact
              </p>
            </div>

            <div>
              <Label className="text-terminal-cyan">Direction</Label>
              <Select
                value={config.crossDependencies.direction}
                onValueChange={(value: CrossDepDirection) => updateConfig({
                  crossDependencies: { ...config.crossDependencies, direction: value }
                })}
              >
                <SelectTrigger className="mt-2 bg-code-bg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same-tier">Same Tier Only</SelectItem>
                  <SelectItem value="higher-tier">Higher Tier Only</SelectItem>
                  <SelectItem value="both">Both (Same & Higher)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Which tiers can be depended upon (lower never depends on higher)
              </p>
            </div>

            <div>
              <Label className="text-terminal-cyan mb-3 block">Allowed Tiers</Label>
              <div className="space-y-3">
                {(['system', 'subsystem', 'component'] as const).map((tier) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{tier}</span>
                    <Switch
                      checked={config.crossDependencies.allowedTiers[tier]}
                      onCheckedChange={(checked) => updateConfig({
                        crossDependencies: {
                          ...config.crossDependencies,
                          allowedTiers: { ...config.crossDependencies.allowedTiers, [tier]: checked }
                        }
                      })}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Which tiers can have cross-dependencies
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
