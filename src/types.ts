// Shared types for the bitranger CLI

export interface BitrangerConfig {
  version: string;
  projectName: string;
  gitTracking: boolean;
  agents: {
    claudeCode: {
      enabled: boolean;
      rulesFile: string;
    };
    cursor: {
      enabled: boolean;
      rulesFile: string;
    };
  };
  contextTree: {
    autoOrganize: boolean;
    defaultDomains: string[];
  };
}

export interface ContextTreeStats {
  domains: number;
  topics: number;
  contextFiles: number;
  lastUpdated?: Date;
  totalSize: number;
}

export interface DomainInfo {
  name: string;
  topics: string[];
  contextFiles: number;
}
