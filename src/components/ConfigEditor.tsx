import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CodebaseConfig } from '@/types/config';

interface ConfigEditorProps {
  config: CodebaseConfig;
  onChange: (config: CodebaseConfig) => void;
}

export function ConfigEditor({ config, onChange }: ConfigEditorProps) {
  const updateConfig = (updates: Partial<CodebaseConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <Label htmlFor="name" className="text-terminal-cyan">Project Name</Label>
        <Input
          id="name"
          value={config.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          className="mt-2 bg-code-bg"
        />
      </div>

      <div>
        <Label htmlFor="modules" className="text-terminal-cyan">Total Modules</Label>
        <Input
          id="modules"
          type="number"
          min="1"
          max="10000"
          value={config.totalModules}
          onChange={(e) => updateConfig({ totalModules: parseInt(e.target.value) || 1 })}
          className="mt-2 bg-code-bg"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Number of C modules to generate (1-10,000)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minLines" className="text-terminal-cyan">Min Lines/File</Label>
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
          <Label htmlFor="maxLines" className="text-terminal-cyan">Max Lines/File</Label>
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
            <SelectItem value="low">Low (0-2 deps/module)</SelectItem>
            <SelectItem value="medium">Medium (0-5 deps/module)</SelectItem>
            <SelectItem value="high">High (0-8 deps/module)</SelectItem>
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
  );
}
