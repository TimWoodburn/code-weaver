import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArtifactsTable } from '@/components/ArtifactsTable';
import { useGeneratedData } from '@/contexts/GeneratedDataContext';
import { useEffect } from 'react';

const Artifacts = () => {
  const navigate = useNavigate();
  const { artifacts } = useGeneratedData();

  useEffect(() => {
    if (!artifacts) {
      navigate('/');
    }
  }, [artifacts, navigate]);

  if (!artifacts) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Generator
            </Button>
            <div className="flex items-center gap-2">
              <TableIcon className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Generated Artifacts ({artifacts.length})
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="w-full">
          <ArtifactsTable artifacts={artifacts} />
        </div>
      </main>
    </div>
  );
};

export default Artifacts;
