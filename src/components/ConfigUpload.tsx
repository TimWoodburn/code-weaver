import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CodebaseConfig } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

interface ConfigUploadProps {
  onConfigLoad: (config: CodebaseConfig) => void;
}

export function ConfigUpload({ onConfigLoad }: ConfigUploadProps) {
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let config: CodebaseConfig;

      if (file.name.endsWith('.json')) {
        config = JSON.parse(text);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        // Basic YAML parsing - for production use a proper YAML library
        toast({
          title: "YAML Support",
          description: "Please use JSON format for now. YAML parsing requires additional dependencies.",
          variant: "destructive"
        });
        return;
      } else {
        throw new Error('Unsupported file format');
      }

      // Validate config
      if (!config.name || !config.totalModules) {
        throw new Error('Invalid config format');
      }

      onConfigLoad(config);
      toast({
        title: "Config Loaded",
        description: `Configuration for "${config.name}" loaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : 'Failed to parse config file',
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-2 border-dashed border-border hover:border-primary transition-colors">
      <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
        <Upload className="w-12 h-12 mb-4 text-primary" />
        <span className="text-sm text-muted-foreground mb-2">
          Click to upload or drag & drop
        </span>
        <span className="text-xs text-muted-foreground">
          JSON or YAML configuration file
        </span>
        <input
          type="file"
          className="hidden"
          accept=".json,.yaml,.yml"
          onChange={handleFileUpload}
        />
      </label>
    </Card>
  );
}
