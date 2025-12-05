import { createContext, useContext, useState, ReactNode } from 'react';
import { Artifact } from '@/types/config';

interface GeneratedDataContextType {
  artifacts: Artifact[] | null;
  setArtifacts: (artifacts: Artifact[] | null) => void;
}

const GeneratedDataContext = createContext<GeneratedDataContextType | undefined>(undefined);

export const GeneratedDataProvider = ({ children }: { children: ReactNode }) => {
  const [artifacts, setArtifacts] = useState<Artifact[] | null>(null);

  return (
    <GeneratedDataContext.Provider value={{ artifacts, setArtifacts }}>
      {children}
    </GeneratedDataContext.Provider>
  );
};

export const useGeneratedData = () => {
  const context = useContext(GeneratedDataContext);
  if (!context) {
    throw new Error('useGeneratedData must be used within a GeneratedDataProvider');
  }
  return context;
};
