import { aiWorkers } from "@/src/ai-workforce/mock";
import { DigitalCompanyService } from "@/src/digital-company/service";
import type { DigitalCompany } from "@/src/digital-company/types";
import type {
  EnterpriseIntelligenceAgent,
  EnterpriseIntelligenceAnalytics,
  EnterpriseIntelligenceDeploy,
  EnterpriseIntelligenceFabric,
  EnterpriseIntelligenceReadiness,
  EnterpriseIntelligenceStatus,
} from "./types";

function buildDeploys(company: DigitalCompany): EnterpriseIntelligenceDeploy[] {
  const projectDeploys =
    company.project?.builds.map((build) => ({
      id: build.id,
      channel: build.channel,
      status: build.status,
      version: build.version,
      source: "business-project" as const,
    })) || [];

  return [
    ...projectDeploys,
    {
      id: "admin-console",
      channel: "Admin",
      status: company.modules.some((module) => module.id === "panel" && module.status === "Ativo") ? "Em andamento" : "Planejado",
      version: company.project?.version || "0.1.0",
      source: "fabric-default",
    },
  ];
}

function buildAgents(): EnterpriseIntelligenceAgent[] {
  return aiWorkers.slice(0, 8).map((worker) => ({
    id: worker.id,
    name: worker.name,
    specialty: worker.specialty,
    status: worker.status,
    progress: worker.progress,
    nextTask: worker.nextTask,
    source: "ai-workforce",
  }));
}

function buildReadiness(company: DigitalCompany): EnterpriseIntelligenceReadiness {
  return {
    tenantReady: Boolean(company.tenant.id),
    companyReady: Boolean(company.id && company.status !== "inactive"),
    projectReady: Boolean(company.project),
    dnaReady: Boolean(company.businessDna),
    templateReady: Boolean(company.template),
    billingReady: Boolean(company.plan.planName),
    aiReady: company.ai.copilotReady && company.ai.workforceReady,
  };
}

function buildStatus(readiness: EnterpriseIntelligenceReadiness): EnterpriseIntelligenceStatus {
  const values = Object.values(readiness);
  if (values.every(Boolean)) return "ready";
  if (readiness.tenantReady && readiness.companyReady) return "partial";
  return "mocked";
}

function buildAnalytics(company: DigitalCompany, deploys: EnterpriseIntelligenceDeploy[], agents: EnterpriseIntelligenceAgent[]): EnterpriseIntelligenceAnalytics {
  return {
    projects: company.project ? 1 : 0,
    users: company.project?.team.length || 1,
    activeModules: company.modules.filter((module) => module.status === "Ativo").length,
    deploysReady: deploys.filter((deploy) => deploy.status === "Pronto").length,
    aiAgents: agents.length,
    estimatedAiCost: "R$ 0,00",
  };
}

function buildRecommendations(company: DigitalCompany, readiness: EnterpriseIntelligenceReadiness) {
  const recommendations = [...company.ai.recommendations];

  if (!readiness.projectReady) {
    recommendations.unshift("Criar ou carregar o Business Project™ antes de acionar módulos avançados.");
  }

  if (!readiness.templateReady) {
    recommendations.push("Escolher um Template Premium para reduzir risco, custo e tempo de implantação.");
  }

  if (!readiness.billingReady) {
    recommendations.push("Confirmar plano/assinatura antes de materializar publicação.");
  }

  return recommendations.slice(0, 5);
}

export const EnterpriseIntelligenceService = {
  compose(company: DigitalCompany): EnterpriseIntelligenceFabric {
    const deploys = buildDeploys(company);
    const aiAgents = buildAgents();
    const readiness = buildReadiness(company);
    const status = buildStatus(readiness);

    return {
      id: `eif-${company.id}`,
      name: "Enterprise Intelligence Fabric™",
      acronym: "EIF™",
      status,
      digitalCompany: company,
      tenant: company.tenant,
      company: company.empresa,
      user: company.profile,
      businessProject: company.project,
      businessDna: company.businessDna,
      template: company.template,
      plan: company.plan,
      subscription: company.billing,
      marketplace: company.marketplace,
      deploys,
      analytics: buildAnalytics(company, deploys, aiAgents),
      aiAgents,
      readiness,
      strategicRecommendations: buildRecommendations(company, readiness),
      integrationTargets: ["AI Copilot™", "AI Workforce™", "Business Operating Center™", "Business Project™"],
      updatedAt: new Date().toISOString(),
    };
  },

  async getCurrent(): Promise<EnterpriseIntelligenceFabric> {
    const company = await DigitalCompanyService.getCurrentSafe();
    return this.compose(company);
  },
};
