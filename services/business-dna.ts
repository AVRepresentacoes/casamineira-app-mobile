import { supabase } from "@/lib/supabase";
import { businessDnaCatalog, findBusinessDnaBySlug } from "@/src/business-dna/catalog";
import type { BusinessDna, BusinessDnaCategory, BusinessDnaIconName, BusinessDnaMaturity, BusinessDnaSegment } from "@/src/business-dna/types";

type BusinessDnaRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  segment: string | null;
  description: string;
  commercial_description: string | null;
  icon: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  image_url: string | null;
  maturity_level: string | null;
  features: unknown;
  modules: unknown;
  integrations: unknown;
  premium_features: unknown;
  benefits: unknown;
  use_cases: unknown;
  recommended_plan: string | null;
  ai_preparation_contract: unknown;
  implementation_time: string | null;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toAiContract(value: unknown): BusinessDna["aiPreparationContract"] {
  const contract = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    briefingHints: toStringArray(contract.briefingHints),
    requiredInputs: toStringArray(contract.requiredInputs),
    suggestedOutputs: toStringArray(contract.suggestedOutputs),
  };
}

function warnFallback(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(message);
  }
}

function toBusinessDna(row: BusinessDnaRow): BusinessDna {
  const fallback = findBusinessDnaBySlug(row.slug);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: (row.category || fallback?.category || "Serviços") as BusinessDnaCategory,
    segment: (row.segment || fallback?.segment || "B2C") as BusinessDnaSegment,
    description: row.description,
    commercialDescription: row.commercial_description || fallback?.commercialDescription || row.description,
    icon: (row.icon || fallback?.icon || "apps") as BusinessDnaIconName,
    primaryColor: row.primary_color || fallback?.primaryColor || "#facc15",
    secondaryColor: row.secondary_color || fallback?.secondaryColor || "#111827",
    image: row.image_url || fallback?.image || `placeholder://business-dna/${row.slug}`,
    maturity: (row.maturity_level || fallback?.maturity || "starter") as BusinessDnaMaturity,
    defaultFeatures: toStringArray(row.features).length ? toStringArray(row.features) : fallback?.defaultFeatures || [],
    availableModules: toStringArray(row.modules).length ? toStringArray(row.modules) : fallback?.availableModules || [],
    supportedIntegrations: toStringArray(row.integrations).length ? toStringArray(row.integrations) : fallback?.supportedIntegrations || [],
    premiumResources: toStringArray(row.premium_features).length ? toStringArray(row.premium_features) : fallback?.premiumResources || [],
    averageImplementationTime: row.implementation_time || fallback?.averageImplementationTime || "Sob análise",
    benefits: toStringArray(row.benefits).length ? toStringArray(row.benefits) : fallback?.benefits || [],
    useCases: toStringArray(row.use_cases).length ? toStringArray(row.use_cases) : fallback?.useCases || [],
    recommendedPlan: row.recommended_plan || fallback?.recommendedPlan || "Starter",
    aiPreparationContract: toAiContract(row.ai_preparation_contract),
  };
}

export const BusinessDnaService = {
  async list(): Promise<BusinessDna[]> {
    const { data, error } = await supabase
      .from("business_dna")
      .select(
        "id, slug, name, category, segment, description, commercial_description, icon, primary_color, secondary_color, image_url, maturity_level, features, modules, integrations, premium_features, benefits, use_cases, recommended_plan, ai_preparation_contract, implementation_time",
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      warnFallback(`BUSINESS DNA SUPABASE FALLBACK: ${error.message}`);
      return businessDnaCatalog;
    }

    const mapped = ((data || []) as BusinessDnaRow[]).map(toBusinessDna);
    return mapped.length ? mapped : businessDnaCatalog;
  },

  async findBySlug(slug: string): Promise<BusinessDna | undefined> {
    const { data, error } = await supabase
      .from("business_dna")
      .select(
        "id, slug, name, category, segment, description, commercial_description, icon, primary_color, secondary_color, image_url, maturity_level, features, modules, integrations, premium_features, benefits, use_cases, recommended_plan, ai_preparation_contract, implementation_time",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      warnFallback(`BUSINESS DNA DETAIL FALLBACK: ${error.message}`);
      return findBusinessDnaBySlug(slug);
    }

    return data ? toBusinessDna(data as BusinessDnaRow) : findBusinessDnaBySlug(slug);
  },
};
