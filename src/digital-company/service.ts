import { getMyEmpresaContext, getMyEmpresaSaasSubscription, type EmpresaContextRow } from "@/lib/tenant";
import { findBusinessDnaBySlug } from "@/src/business-dna/catalog";
import { getProjectProgress } from "@/src/business-project/mock";
import { BusinessProjectService } from "@/services/business-project";
import { findPremiumTemplateBySlug, premiumTemplates } from "@/src/template-marketplace/catalog";
import type { PremiumTemplate } from "@/src/template-marketplace/types";
import type {
  DigitalCompany,
  DigitalCompanyBilling,
  DigitalCompanyModule,
  DigitalCompanyProgress,
  DigitalCompanySource,
  DigitalCompanyStatus,
  DigitalCompanyTenant,
} from "./types";

function fallbackEmpresa(): EmpresaContextRow {
  return {
    empresa_id: "digital-company-fallback",
    tenant_id: "tenant-fallback",
    slug: "casa-mineira-saas",
    tenant_slug: "casa-mineira-saas",
    nome: "Casa Mineira SaaS",
    nome_exibicao: "Casa Mineira SaaS",
    descricao: "Empresa digital em preparação.",
    logo_url: null,
    cor_primaria: null,
    cor_secundaria: null,
    telefone: null,
    email: null,
    dominio: null,
    whatsapp: null,
    ativa: true,
    modo_marketplace: true,
    modo_white_label: true,
    role: "owner",
  };
}

function resolveStatus(source: DigitalCompanySource): DigitalCompanyStatus {
  if (!source.empresa.ativa) return "inactive";
  if (source.assinaturaSaas?.trial_ativo) return "trial";
  if (source.assinaturaSaas?.assinatura_status === "active") return "active";
  return "pending";
}

function buildTenant(source: DigitalCompanySource): DigitalCompanyTenant {
  return {
    id: source.empresa.tenant_id || source.empresa.empresa_id,
    slug: source.empresa.tenant_slug || source.empresa.slug,
    label: source.empresa.tenant_slug || source.empresa.slug || source.empresa.nome,
    role: source.empresa.role,
  };
}

function buildBilling(source: DigitalCompanySource): DigitalCompanyBilling {
  return {
    planName: source.assinaturaSaas?.plano_nome || source.project?.plan || "Starter",
    planSlug: source.assinaturaSaas?.plano_slug || null,
    status: source.assinaturaSaas?.assinatura_status || "pending",
    trialActive: Boolean(source.assinaturaSaas?.trial_ativo),
  };
}

function buildModules(source: DigitalCompanySource): DigitalCompanyModule[] {
  if (!source.project?.modules.length) {
    return [
      { id: "business-dna", name: "Business DNA™", status: "Indisponível", source: "fallback" },
      { id: "marketplace", name: "Marketplace", status: "Indisponível", source: "fallback" },
      { id: "ai", name: "IA", status: "Indisponível", source: "fallback" },
    ];
  }

  return source.project.modules.map((module) => ({
    id: module.id,
    name: module.title,
    status: module.status,
    source: "business-project",
  }));
}

function buildProgress(source: DigitalCompanySource): DigitalCompanyProgress {
  if (!source.project) {
    return {
      percent: 0,
      completedSteps: 0,
      totalSteps: 0,
      label: "Aguardando Business Project™",
    };
  }

  const completedSteps = source.project.timeline.filter((item) => item.status === "done").length;
  const totalSteps = source.project.timeline.length;

  return {
    percent: getProjectProgress(source.project),
    completedSteps,
    totalSteps,
    label: `${completedSteps}/${totalSteps} etapas concluídas`,
  };
}

function getRecommendedTemplates(templateSlug?: string | null) {
  const current = templateSlug ? findPremiumTemplateBySlug(templateSlug) : null;
  const slugs = current?.recommendedTemplateSlugs || [];
  const recommended = slugs
    .map((slug) => findPremiumTemplateBySlug(slug))
    .filter((template): template is PremiumTemplate => Boolean(template));

  return recommended.length ? recommended.slice(0, 3) : premiumTemplates.filter((template) => template.isBestSeller).slice(0, 3);
}

export const DigitalCompanyService = {
  compose(source: DigitalCompanySource): DigitalCompany {
    const businessDna = source.project ? findBusinessDnaBySlug(source.project.businessDnaSlug) ?? null : null;
    const template = source.project ? findPremiumTemplateBySlug(source.project.templateSlug) ?? null : null;
    const tenant = buildTenant(source);
    const billing = buildBilling(source);
    const modules = buildModules(source);
    const progress = buildProgress(source);

    return {
      id: source.empresa.empresa_id,
      name: source.empresa.nome,
      displayName: source.empresa.nome_exibicao || source.empresa.nome,
      status: resolveStatus(source),
      empresa: source.empresa,
      tenant,
      profile: {
        id: source.project?.owner_id || "",
        role: source.empresa.role,
        label: source.empresa.role ? source.empresa.role.toUpperCase() : "OWNER",
      },
      project: source.project,
      businessDna,
      template,
      plan: billing,
      progress,
      modules,
      marketplace: {
        currentTemplate: template,
        recommendedTemplates: getRecommendedTemplates(source.project?.templateSlug),
      },
      billing,
      ai: {
        copilotReady: true,
        workforceReady: true,
        orchestrationMode: "mock",
        recommendations: [
          source.project?.executiveSummary.nextDecision || "Definir Business DNA™ antes de avançar.",
          "Usar templates antes de geração do zero.",
          "Manter aprovação humana antes de publicação.",
        ],
      },
      updatedAt: source.project?.updated_at || new Date().toISOString(),
    };
  },

  getFallback(): DigitalCompany {
    return this.compose({
      empresa: fallbackEmpresa(),
      assinaturaSaas: null,
      project: null,
    });
  },

  async getCurrent(): Promise<DigitalCompany> {
    const [empresa, assinaturaSaas, project] = await Promise.all([
      getMyEmpresaContext(),
      getMyEmpresaSaasSubscription().catch(() => null),
      BusinessProjectService.getCurrent().catch(() => null),
    ]);

    return this.compose({ empresa, assinaturaSaas, project });
  },

  async getCurrentSafe(): Promise<DigitalCompany> {
    try {
      return await this.getCurrent();
    } catch (error) {
      console.log("DIGITAL COMPANY FALLBACK WARNING:", error);
      return this.getFallback();
    }
  },
};
