import { onboardMySaasEmpresa } from "@/lib/saas-commercial";
import { supabase } from "@/lib/supabase";
import { getMeusTenants, getMyEmpresaContext, getMyEmpresaSaasSubscription } from "@/lib/tenant";

type EnsureSaasOnboardingInput = {
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
};

type InitialProjectStatus = "created" | "already_exists" | "not_allowed" | "skipped";

export type EnsureSaasOnboardingResult = {
  onboarded: boolean;
  empresaId: string | null;
  tenantSlug: string | null;
  assinaturaId: string | null;
  planoSlug: string | null;
  initialProjectStatus: InitialProjectStatus;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function resolveCompanyName(input: EnsureSaasOnboardingInput, userEmail?: string | null) {
  const company = String(input.company || "").trim();
  if (company) return company;

  const name = String(input.name || "").trim();
  if (name) return `${name} Digital`;

  const emailPrefix = String(input.email || userEmail || "")
    .split("@")[0]
    ?.replace(/[._-]+/g, " ")
    .trim();

  return emailPrefix ? `${emailPrefix} Digital` : "Minha Empresa Digital";
}

function isAdminTenant(role?: string | null) {
  return ["owner", "admin", "admin_empresa"].includes(String(role || "").toLowerCase());
}

async function getExistingSaasTenant() {
  const tenants = await getMeusTenants().catch(() => []);
  return tenants.find((tenant) => tenant.slug !== "default" && isAdminTenant(tenant.role)) ?? null;
}

async function ensureInitialProject(tenantSlug: string | null, companyName: string): Promise<InitialProjectStatus> {
  if (!tenantSlug || tenantSlug === "default") return "skipped";

  const { data: existing, error: existingError } = await supabase
    .from("saas_products")
    .select("id")
    .eq("tenant_slug", tenantSlug)
    .limit(1);

  if (!existingError && Array.isArray(existing) && existing.length > 0) {
    return "already_exists";
  }

  const projectSlug = `${slugify(companyName) || tenantSlug}-projeto-inicial`;
  const { error } = await supabase.from("saas_products").insert({
    name: `${companyName} - Projeto Inicial`,
    slug: projectSlug,
    product_type: "business_project",
    status: "draft",
    tenant_slug: tenantSlug,
    requires_dedicated_supabase: false,
  });

  if (error) {
    console.log("INITIAL PROJECT REAL INSERT SKIPPED:", error.message);
    return "not_allowed";
  }

  return "created";
}

export async function ensureSaasOnboarding(input: EnsureSaasOnboardingInput = {}): Promise<EnsureSaasOnboardingResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário autenticado é obrigatório para concluir o onboarding.");
  }

  const metadata = (user.user_metadata || {}) as Record<string, string | undefined>;
  const name = input.name || metadata.name || metadata.full_name || metadata.nome || null;
  const company = input.company || metadata.company || metadata.empresa || null;
  const phone = input.phone || metadata.phone || metadata.telefone || null;
  const email = input.email || user.email || null;
  const companyName = resolveCompanyName({ name, company, email, phone }, user.email);

  const existingTenant = await getExistingSaasTenant();
  if (existingTenant) {
    const initialProjectStatus = await ensureInitialProject(existingTenant.slug, companyName);
    return {
      onboarded: false,
      empresaId: existingTenant.tenant_id,
      tenantSlug: existingTenant.slug,
      assinaturaId: null,
      planoSlug: existingTenant.plan_code || null,
      initialProjectStatus,
    };
  }

  const result = await onboardMySaasEmpresa({
    empresaNome: companyName,
    segmento: "Empresa digital",
    whatsapp: phone,
    empresaEmail: email,
    adminNome: name,
    planoSlug: "starter",
    trialDias: 14,
  });

  const initialProjectStatus = await ensureInitialProject(result.tenant_slug, companyName);

  await Promise.all([
    getMyEmpresaContext().catch(() => null),
    getMyEmpresaSaasSubscription().catch(() => null),
  ]);

  return {
    onboarded: true,
    empresaId: result.empresa_id,
    tenantSlug: result.tenant_slug,
    assinaturaId: result.assinatura_id,
    planoSlug: result.plano_slug,
    initialProjectStatus,
  };
}

