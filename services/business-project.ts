import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { getMyEmpresaContext, getMyEmpresaSaasSubscription } from "@/lib/tenant";
import { businessDnaCatalog, findBusinessDnaBySlug } from "@/src/business-dna/catalog";
import { businessProjectModules } from "@/src/business-project/mock";
import type { BusinessProject, BusinessProjectPlan, BusinessProjectStatus } from "@/src/business-project/types";
import { findPremiumTemplateBySlug, premiumTemplates } from "@/src/template-marketplace/catalog";

export type BusinessProjectCore = {
  id: string;
  tenant_id: string;
  owner_id: string;
  nome: string;
  description: string;
  segmento: string;
  business_dna_id: string;
  template_id: string;
  status: BusinessProjectStatus;
  created_at: string;
  updated_at: string;
};

type SaasProductRow = {
  id: string;
  name: string;
  slug: string;
  product_type: string | null;
  status: string | null;
  tenant_slug: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectDraftState = Partial<Pick<BusinessProjectCore, "business_dna_id" | "template_id" | "description" | "segmento">> & {
  blueprintId?: string | null;
};

const DEFAULT_DNA = "servicos-locais";
const DEFAULT_TEMPLATE = "servicos-locais";

function storageKey(tenantId: string) {
  return `@casa_mineira_business_project:${tenantId}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeProjectStatus(status?: string | null): BusinessProjectStatus {
  if (status === "active") return "in_progress";
  if (status === "archived") return "published";
  if (status === "paused") return "review";
  if (status === "failed") return "review";
  if (status === "provisioning") return "planning";
  if (status === "draft" || status === "planning" || status === "in_progress" || status === "review" || status === "published") {
    return status;
  }
  return "draft";
}

function normalizePlan(planSlug?: string | null): BusinessProjectPlan {
  const value = String(planSlug || "").toLowerCase();
  if (value.includes("enterprise")) return "Enterprise";
  if (value.includes("premium") || value.includes("pro")) return "Premium";
  if (value.includes("professional") || value.includes("growth")) return "Professional";
  return "Starter";
}

function labelDate(value?: string | null) {
  if (!value) return "Hoje";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Hoje";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

async function loadDraftState(tenantId: string): Promise<ProjectDraftState> {
  const raw = await AsyncStorage.getItem(storageKey(tenantId)).catch(() => null);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProjectDraftState;
  } catch {
    return {};
  }
}

async function saveDraftState(tenantId: string, patch: ProjectDraftState) {
  const current = await loadDraftState(tenantId);
  await AsyncStorage.setItem(storageKey(tenantId), JSON.stringify({ ...current, ...patch }));
}

async function getCurrentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || "";
}

async function loadSaasProducts(tenantSlug: string): Promise<SaasProductRow[]> {
  const { data, error } = await supabase
    .from("saas_products")
    .select("id, name, slug, product_type, status, tenant_slug, created_at, updated_at")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("BUSINESS PROJECT SAAS_PRODUCTS READ WARNING:", error.message);
    return [];
  }

  return (data || []) as SaasProductRow[];
}

async function buildCoreFromEmpresa(row?: SaasProductRow | null): Promise<BusinessProjectCore> {
  const [empresa, assinatura, ownerId] = await Promise.all([
    getMyEmpresaContext(),
    getMyEmpresaSaasSubscription().catch(() => null),
    getCurrentUserId(),
  ]);
  const draft = await loadDraftState(empresa.empresa_id);
  const name = row?.name || `${empresa.nome_exibicao || empresa.nome} - Projeto Empresarial`;
  const now = new Date().toISOString();

  return {
    id: row?.id || `bp-${empresa.empresa_id}`,
    tenant_id: empresa.empresa_id,
    owner_id: ownerId,
    nome: name,
    description: draft.description || "Projeto empresarial central da Casa Mineira SaaS.",
    segmento: draft.segmento || empresa.descricao || "Empresa Digital",
    business_dna_id: draft.business_dna_id || DEFAULT_DNA,
    template_id: draft.template_id || DEFAULT_TEMPLATE,
    status: normalizeProjectStatus(row?.status || "draft"),
    created_at: row?.created_at || assinatura?.data_inicio || now,
    updated_at: row?.updated_at || now,
  };
}

export function toBusinessProjectView(core: BusinessProjectCore, tenantSlug?: string | null, planSlug?: string | null): BusinessProject {
  const dna = findBusinessDnaBySlug(core.business_dna_id) || findBusinessDnaBySlug(DEFAULT_DNA) || businessDnaCatalog[0];
  const template = findPremiumTemplateBySlug(core.template_id) || findPremiumTemplateBySlug(DEFAULT_TEMPLATE) || premiumTemplates[0];
  const updatedLabel = labelDate(core.updated_at);

  return {
    id: core.id,
    tenant_id: core.tenant_id,
    owner_id: core.owner_id,
    nome: core.nome,
    description: core.description,
    segmento: core.segmento,
    business_dna_id: core.business_dna_id,
    template_id: core.template_id,
    created_at: core.created_at,
    updated_at: core.updated_at,
    name: core.nome,
    slug: slugify(core.nome) || core.id,
    businessDnaSlug: dna.slug,
    businessDnaName: `${dna.name} DNA™`,
    templateSlug: template.slug,
    templateName: template.name,
    plan: normalizePlan(planSlug || template.recommendedPlan),
    status: core.status,
    createdAtLabel: labelDate(core.created_at),
    updatedAtLabel: updatedLabel === labelDate(new Date().toISOString()) ? "Hoje" : updatedLabel,
    version: "v0.1.0",
    companyName: core.nome,
    tenantLabel: tenantSlug || core.tenant_id,
    environment: "Sandbox",
    team: [{ id: core.owner_id || "owner", name: "Owner", role: "Owner", status: "Ativo" }],
    modules: businessProjectModules,
    nextTasks: [
      { id: "task-dna", title: "Confirmar Business DNA™", owner: "Owner", dueLabel: "Hoje", status: "Pendente" },
      { id: "task-template", title: "Escolher ou revisar template", owner: "Owner", dueLabel: "Hoje", status: "Pendente" },
      { id: "task-blueprint", title: "Aprovar Blueprint™", owner: "Casa Mineira SaaS", dueLabel: "Próximo passo", status: "Revisão" },
    ],
    timeline: [
      { id: "created", label: "Projeto criado", description: "Business Project™ derivado da empresa SaaS ativa.", status: "done" },
      { id: "dna", label: "Business DNA aplicado", description: `${dna.name} DNA™ associado ao projeto.`, status: "done" },
      { id: "template", label: "Template escolhido", description: `${template.name} associado ao projeto.`, status: "done" },
      { id: "blueprint", label: "Blueprint", description: "Próxima etapa: revisar arquitetura e módulos.", status: "current" },
      { id: "publishing", label: "Publicação", description: "Publicação depende de revisão humana e billing real.", status: "next" },
    ],
    builds: [
      { id: "build-web", channel: "Web", status: "Planejado", version: "0.1.0" },
      { id: "build-android", channel: "Android", status: "Planejado", version: "0.1.0" },
      { id: "build-ios", channel: "iOS", status: "Planejado", version: "0.1.0" },
    ],
    executiveSummary: {
      health: "Projeto conectado ao tenant ativo e pronto para receber DNA, template e Blueprint.",
      goal: core.description,
      risk: "Persistência granular de DNA/template ainda depende de schema dedicado de Business Project.",
      nextDecision: "Aprovar Blueprint™ e definir módulos prioritários.",
    },
  };
}

export const BusinessProjectService = {
  async listCurrent(): Promise<BusinessProject[]> {
    const [empresa, assinatura] = await Promise.all([
      getMyEmpresaContext(),
      getMyEmpresaSaasSubscription().catch(() => null),
    ]);
    const rows = await loadSaasProducts(empresa.tenant_slug || empresa.slug);
    const sourceRows = rows.length ? rows : [null];
    const projects = await Promise.all(sourceRows.map((row) => buildCoreFromEmpresa(row)));
    return projects.map((project) => toBusinessProjectView(project, empresa.tenant_slug || empresa.slug, assinatura?.plano_slug));
  },

  async getCurrent(): Promise<BusinessProject> {
    const projects = await this.listCurrent();
    return projects[0];
  },

  async getById(id?: string | string[]): Promise<BusinessProject> {
    const normalized = Array.isArray(id) ? id[0] : id;
    const projects = await this.listCurrent();
    return projects.find((project) => project.id === normalized || project.slug === normalized) || projects[0];
  },

  async ensureCurrent(): Promise<BusinessProject> {
    const [empresa, ownerId] = await Promise.all([getMyEmpresaContext(), getCurrentUserId()]);
    const rows = await loadSaasProducts(empresa.tenant_slug || empresa.slug);
    if (!rows.length) {
      const name = `${empresa.nome_exibicao || empresa.nome} - Projeto Inicial`;
      const { error } = await supabase.from("saas_products").insert({
        name,
        slug: `${slugify(empresa.slug || empresa.tenant_slug || name)}-projeto-inicial`,
        product_type: "business_project",
        status: "draft",
        tenant_slug: empresa.tenant_slug || empresa.slug,
        requires_dedicated_supabase: false,
      });
      if (error) {
        console.log("BUSINESS PROJECT CREATE WARNING:", error.message);
      }
    }

    const core = await buildCoreFromEmpresa(rows[0] || null);
    const assinatura = await getMyEmpresaSaasSubscription().catch(() => null);
    return toBusinessProjectView({ ...core, owner_id: core.owner_id || ownerId }, empresa.tenant_slug || empresa.slug, assinatura?.plano_slug);
  },

  async associateBusinessDna(businessDnaId: string): Promise<BusinessProject> {
    const empresa = await getMyEmpresaContext();
    await saveDraftState(empresa.empresa_id, { business_dna_id: businessDnaId, segmento: findBusinessDnaBySlug(businessDnaId)?.category });
    return this.getCurrent();
  },

  async associateTemplate(templateId: string): Promise<BusinessProject> {
    const empresa = await getMyEmpresaContext();
    const template = findPremiumTemplateBySlug(templateId);
    await saveDraftState(empresa.empresa_id, {
      template_id: templateId,
      business_dna_id: template?.businessDnaSlug,
      segmento: template?.category,
      description: template?.longDescription || template?.description,
    });
    return this.getCurrent();
  },

  async associateBlueprint(blueprintId: string): Promise<BusinessProject> {
    const empresa = await getMyEmpresaContext();
    await saveDraftState(empresa.empresa_id, { blueprintId });
    return this.getCurrent();
  },
};

