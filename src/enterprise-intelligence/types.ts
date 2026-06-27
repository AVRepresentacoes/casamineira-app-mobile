import type { AiWorker } from "@/src/ai-workforce/types";
import type { BusinessProjectBuild } from "@/src/business-project/types";
import type { DigitalCompany } from "@/src/digital-company/types";

export type EnterpriseIntelligenceStatus = "ready" | "partial" | "mocked" | "blocked";

export type EnterpriseIntelligenceDeploy = {
  id: string;
  channel: BusinessProjectBuild["channel"] | "Admin";
  status: BusinessProjectBuild["status"] | "Planejado";
  version: string;
  source: "business-project" | "fabric-default";
};

export type EnterpriseIntelligenceAnalytics = {
  projects: number;
  users: number;
  activeModules: number;
  deploysReady: number;
  aiAgents: number;
  estimatedAiCost: string;
};

export type EnterpriseIntelligenceAgent = Pick<AiWorker, "id" | "name" | "specialty" | "status" | "progress" | "nextTask"> & {
  source: "ai-workforce" | "fabric-default";
};

export type EnterpriseIntelligenceReadiness = {
  tenantReady: boolean;
  companyReady: boolean;
  projectReady: boolean;
  dnaReady: boolean;
  templateReady: boolean;
  billingReady: boolean;
  aiReady: boolean;
};

export type EnterpriseIntelligenceFabric = {
  id: string;
  name: "Enterprise Intelligence Fabric™";
  acronym: "EIF™";
  status: EnterpriseIntelligenceStatus;
  digitalCompany: DigitalCompany;
  tenant: DigitalCompany["tenant"];
  company: DigitalCompany["empresa"];
  user: DigitalCompany["profile"];
  businessProject: DigitalCompany["project"];
  businessDna: DigitalCompany["businessDna"];
  template: DigitalCompany["template"];
  plan: DigitalCompany["plan"];
  subscription: DigitalCompany["billing"];
  marketplace: DigitalCompany["marketplace"];
  deploys: EnterpriseIntelligenceDeploy[];
  analytics: EnterpriseIntelligenceAnalytics;
  aiAgents: EnterpriseIntelligenceAgent[];
  readiness: EnterpriseIntelligenceReadiness;
  strategicRecommendations: string[];
  integrationTargets: string[];
  updatedAt: string;
};

export type EnterpriseIntelligenceContextValue = {
  fabric: EnterpriseIntelligenceFabric | null;
  digitalCompany: DigitalCompany | null;
  status: EnterpriseIntelligenceStatus | null;
  readiness: EnterpriseIntelligenceReadiness | null;
  analytics: EnterpriseIntelligenceAnalytics | null;
  deploys: EnterpriseIntelligenceDeploy[];
  aiAgents: EnterpriseIntelligenceAgent[];
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
