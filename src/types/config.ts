export type ArtifactType = 'executable' | 'static-lib' | 'shared-lib';
export type DependencyIssueType = 'version-conflict' | 'circular' | 'missing' | 'transitive';
export type SupportedLanguage = 'c' | 'cpp';

export interface LanguageDistribution {
  language: SupportedLanguage;
  percentage: number;
}

export interface TierConfig {
  count: number;
  artifactType: ArtifactType;
  modulesPerArtifact: { min: number; max: number };
}

export interface CodebaseConfig {
  name: string;
  buildSystem: 'make' | 'cmake';
  includeVulnerabilities: boolean;
  dependencyComplexity: 'low' | 'medium' | 'high';
  linesPerFile: { min: number; max: number };
  dependencyIssues: DependencyIssueType[];
  languageDistribution: LanguageDistribution[];
  
  // 5-tier hierarchy
  tiers: {
    enterprise: { systems: number };
    system: TierConfig;
    subsystem: TierConfig;
    component: TierConfig;
    module: { linesPerFile: { min: number; max: number } };
  };
}

export interface Module {
  id: string;
  name: string;
  path: string;
  language: SupportedLanguage;
  headerContent: string;
  sourceContent: string;
  dependencies: string[];
  linesOfCode: number;
}

export interface Artifact {
  id: string;
  name: string;
  type: ArtifactType;
  tier: 'system' | 'subsystem' | 'component';
  path: string;
  modules: Module[];
  dependencies: string[];
  parentId?: string;
}

export interface GeneratedCodebase {
  enterprise: {
    name: string;
    systems: System[];
  };
  artifacts: Artifact[];
  modules: Module[];
  buildFiles: { name: string; path: string; content: string }[];
  sbom: any;
  stats: {
    totalArtifacts: number;
    totalModules: number;
    totalLines: number;
    executables: number;
    libraries: number;
  };
}

export interface System {
  id: string;
  name: string;
  subsystems: Subsystem[];
}

export interface Subsystem {
  id: string;
  name: string;
  artifactId: string;
  components: Component[];
}

export interface Component {
  id: string;
  name: string;
  artifactId: string;
  moduleIds: string[];
}
