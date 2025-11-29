export interface CodebaseConfig {
  name: string;
  totalModules: number;
  linesPerFile: {
    min: number;
    max: number;
  };
  buildSystem: 'make' | 'cmake';
  includeVulnerabilities: boolean;
  vulnerabilityTypes?: string[];
  dependencyComplexity: 'low' | 'medium' | 'high';
}

export interface GeneratedModule {
  name: string;
  path: string;
  headerContent: string;
  sourceContent: string;
  dependencies: string[];
}

export interface GeneratedCodebase {
  modules: GeneratedModule[];
  buildFiles: { name: string; content: string }[];
  sbom: any;
}
