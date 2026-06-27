import type { EmpresaContextRow, EmpresaSaasSubscriptionRow } from "@/lib/tenant";
import type { BusinessDna } from "@/src/business-dna/types";
import type { BusinessProject, BusinessProjectModule } from "@/src/business-project/types";
import type { PremiumTemplate } from "@/src/template-marketplace/types";

export type DigitalCompanyStatus = "active" | "trial" | "pending" | "inactive";

export type DigitalCompanyTenant = {
  id: string;
  slug: string;
  label: string;
  role: string;
};

export type DigitalCompanyProfile = {
  id: string;
  role: string;
  label: string;
};

export type DigitalCompanyBilling = {
  planName: string;
  planSlug: string | null;
  status: string;
  trialActive: boolean;
};

export type DigitalCompanyPlan = DigitalCompanyBilling;

export type DigitalCompanyModule = {
  id: BusinessProjectModule["id"] | string;
  name: string;
  status: BusinessProjectModule["status"] | "Indisponível";
  source: "business-project" | "fallback";
};

export type DigitalCompanyProgress = {
  percent: number;
  completedSteps: number;
  totalSteps: number;
  label: string;
};

export type DigitalCompanyMarketplace = {
  currentTemplate: PremiumTemplate | null;
  recommendedTemplates: PremiumTemplate[];
};

export type DigitalCompanyAi = {
  copilotReady: boolean;
  workforceReady: boolean;
  orchestrationMode: "mock" | "backend-ready";
  recommendations: string[];
};

export type DigitalCompany = {
  id: string;
  name: string;
  displayName: string;
  status: DigitalCompanyStatus;
  empresa: EmpresaContextRow;
  tenant: DigitalCompanyTenant;
  profile: DigitalCompanyProfile;
  project: BusinessProject | null;
  businessDna: BusinessDna | null;
  template: PremiumTemplate | null;
  plan: DigitalCompanyPlan;
  progress: DigitalCompanyProgress;
  modules: DigitalCompanyModule[];
  marketplace: DigitalCompanyMarketplace;
  billing: DigitalCompanyBilling;
  ai: DigitalCompanyAi;
  updatedAt: string;
};

export type DigitalCompanySource = {
  empresa: EmpresaContextRow;
  assinaturaSaas: EmpresaSaasSubscriptionRow | null;
  project: BusinessProject | null;
};

export type DigitalCompanyContextValue = {
  company: DigitalCompany | null;
  currentProject: BusinessProject | null;
  currentTenant: DigitalCompanyTenant | null;
  currentPlan: DigitalCompanyPlan | null;
  progress: DigitalCompanyProgress | null;
  modules: DigitalCompanyModule[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  digitalCompany: DigitalCompany | null;
  empresaAtual: EmpresaContextRow | null;
  tenantAtual: DigitalCompanyTenant | null;
  projetoAtual: BusinessProject | null;
  businessDnaAtual: BusinessDna | null;
  templateAtual: PremiumTemplate | null;
  plano: DigitalCompanyBilling | null;
  status: DigitalCompanyStatus | null;
  loadingDigitalCompany: boolean;
  refreshDigitalCompany: () => Promise<void>;
};
