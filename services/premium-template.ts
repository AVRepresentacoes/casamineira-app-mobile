import { supabase } from "@/lib/supabase";
import { findPremiumTemplateBySlug, getPremiumTemplatesBySlugs, premiumTemplates } from "@/src/template-marketplace/catalog";
import type { PremiumTemplate, TemplateBadge, TemplateCategory, TemplatePriceTier, TemplateSegment } from "@/src/template-marketplace/types";
import type { BusinessDnaIconName } from "@/src/business-dna/types";

type PremiumTemplateRow = {
  id: string;
  slug: string;
  name: string;
  segment: string | null;
  category: string;
  business_dna_id: string | null;
  business_dna?: { slug: string; name: string } | null;
  description: string;
  long_description: string | null;
  image_url: string | null;
  icon: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  badge: string | null;
  price_tier: string | null;
  price_label: string | null;
  popularity_score: number | null;
  is_best_seller: boolean | null;
  is_new: boolean | null;
  rating: number | null;
  downloads: number | null;
  deployments: number | null;
  gallery: unknown;
  modules_count: number | null;
  compatibility: unknown;
  average_implementation_time: string | null;
  features: unknown;
  modules: unknown;
  integrations: unknown;
  technologies: unknown;
  version: string | null;
  recommended_plan: string | null;
  recommended_template_slugs: unknown;
  related_template_slugs: unknown;
  ai_integration_contract: unknown;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toAiContract(value: unknown): PremiumTemplate["aiIntegrationContract"] {
  const contract = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    recommendedPromptContext: toStringArray(contract.recommendedPromptContext),
    personalizationInputs: toStringArray(contract.personalizationInputs),
    generationBoundaries: toStringArray(contract.generationBoundaries),
  };
}

function warnFallback(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(message);
  }
}

function toPremiumTemplate(row: PremiumTemplateRow): PremiumTemplate {
  const fallback = findPremiumTemplateBySlug(row.slug);
  const dnaSlug = row.business_dna?.slug || fallback?.businessDnaSlug || String(row.business_dna_id || "").replace(/^dna-/, "");
  const dnaName = row.business_dna?.name ? `${row.business_dna.name} DNA™` : fallback?.businessDnaName || `${dnaSlug} DNA™`;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    segment: (row.segment || fallback?.segment || "Aplicativo") as TemplateSegment,
    category: (row.category || fallback?.category || "Serviços") as TemplateCategory,
    businessDnaSlug: dnaSlug,
    businessDnaName: dnaName,
    description: row.description,
    longDescription: row.long_description || fallback?.longDescription || row.description,
    image: row.image_url || fallback?.image || `placeholder://templates/${row.slug}`,
    icon: (row.icon || fallback?.icon || "apps") as BusinessDnaIconName,
    primaryColor: row.primary_color || fallback?.primaryColor || "#facc15",
    secondaryColor: row.secondary_color || fallback?.secondaryColor || "#111827",
    modulesCount: row.modules_count ?? fallback?.modulesCount ?? 0,
    compatibility: toStringArray(row.compatibility).length ? toStringArray(row.compatibility) : fallback?.compatibility || [],
    averageImplementationTime: row.average_implementation_time || fallback?.averageImplementationTime || "Sob análise",
    badge: (row.badge || fallback?.badge || "Premium") as TemplateBadge,
    priceTier: (row.price_tier || fallback?.priceTier || "Premium") as TemplatePriceTier,
    priceLabel: row.price_label || fallback?.priceLabel || "Sob consulta",
    popularityScore: row.popularity_score ?? fallback?.popularityScore ?? 0,
    isBestSeller: row.is_best_seller ?? fallback?.isBestSeller ?? false,
    isNew: row.is_new ?? fallback?.isNew ?? false,
    rating: Number(row.rating ?? fallback?.rating ?? 4.8),
    downloads: row.downloads ?? fallback?.downloads ?? 0,
    deployments: row.deployments ?? fallback?.deployments ?? 0,
    gallery: toStringArray(row.gallery).length ? toStringArray(row.gallery) : fallback?.gallery || [],
    features: toStringArray(row.features).length ? toStringArray(row.features) : fallback?.features || [],
    includedModules: toStringArray(row.modules).length ? toStringArray(row.modules) : fallback?.includedModules || [],
    integrations: toStringArray(row.integrations).length ? toStringArray(row.integrations) : fallback?.integrations || [],
    technologies: toStringArray(row.technologies).length ? toStringArray(row.technologies) : fallback?.technologies || [],
    version: row.version || fallback?.version || "1.0.0",
    recommendedPlan: row.recommended_plan || fallback?.recommendedPlan || "Premium",
    recommendedTemplateSlugs: toStringArray(row.recommended_template_slugs).length ? toStringArray(row.recommended_template_slugs) : fallback?.recommendedTemplateSlugs || [],
    relatedTemplateSlugs: toStringArray(row.related_template_slugs).length ? toStringArray(row.related_template_slugs) : fallback?.relatedTemplateSlugs || [],
    aiIntegrationContract: toAiContract(row.ai_integration_contract),
  };
}

const templateSelect = `
  id,
  slug,
  name,
  segment,
  category,
  business_dna_id,
  business_dna:business_dna_id(slug, name),
  description,
  long_description,
  image_url,
  icon,
  primary_color,
  secondary_color,
  badge,
  price_tier,
  price_label,
  popularity_score,
  is_best_seller,
  is_new,
  rating,
  downloads,
  deployments,
  gallery,
  modules_count,
  compatibility,
  average_implementation_time,
  features,
  modules,
  integrations,
  technologies,
  version,
  recommended_plan,
  recommended_template_slugs,
  related_template_slugs,
  ai_integration_contract
`;

export const PremiumTemplateService = {
  async list(): Promise<PremiumTemplate[]> {
    const { data, error } = await supabase
      .from("premium_templates")
      .select(templateSelect)
      .eq("is_active", true)
      .order("popularity_score", { ascending: false });

    if (error) {
      warnFallback(`PREMIUM TEMPLATE SUPABASE FALLBACK: ${error.message}`);
      return premiumTemplates;
    }

    const mapped = ((data || []) as unknown as PremiumTemplateRow[]).map(toPremiumTemplate);
    return mapped.length ? mapped : premiumTemplates;
  },

  async findBySlug(slug: string): Promise<PremiumTemplate | undefined> {
    const { data, error } = await supabase
      .from("premium_templates")
      .select(templateSelect)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      warnFallback(`PREMIUM TEMPLATE DETAIL FALLBACK: ${error.message}`);
      return findPremiumTemplateBySlug(slug);
    }

    return data ? toPremiumTemplate(data as unknown as PremiumTemplateRow) : findPremiumTemplateBySlug(slug);
  },

  async getBySlugs(slugs: string[]): Promise<PremiumTemplate[]> {
    if (!slugs.length) return [];

    const { data, error } = await supabase
      .from("premium_templates")
      .select(templateSelect)
      .in("slug", slugs)
      .eq("is_active", true);

    if (error) {
      warnFallback(`PREMIUM TEMPLATE RELATED FALLBACK: ${error.message}`);
      return getPremiumTemplatesBySlugs(slugs);
    }

    const mapped = ((data || []) as unknown as PremiumTemplateRow[]).map(toPremiumTemplate);
    return slugs
      .map((slug) => mapped.find((template) => template.slug === slug) || findPremiumTemplateBySlug(slug))
      .filter((template): template is PremiumTemplate => Boolean(template));
  },
};
