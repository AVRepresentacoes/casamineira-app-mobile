import type { BusinessDnaIconName } from "@/src/business-dna/types";

export type TemplateBadge = "Novo" | "Popular" | "Premium" | "Enterprise";
export type TemplatePriceTier = "Starter" | "Premium" | "Enterprise";
export type TemplateSegment = "Aplicativo" | "Site" | "Sistema Web" | "Marketplace" | "Empresa Digital";
export type TemplateCategory =
  | "Hospitalidade"
  | "Saúde"
  | "Alimentação"
  | "Comércio"
  | "Serviços"
  | "Educação"
  | "Finanças"
  | "Comunidade"
  | "Construção"
  | "Turismo";

export type PremiumTemplate = {
  id: string;
  name: string;
  slug: string;
  segment: TemplateSegment;
  category: TemplateCategory;
  businessDnaSlug: string;
  businessDnaName: string;
  description: string;
  longDescription: string;
  image: string;
  icon: BusinessDnaIconName;
  primaryColor: string;
  secondaryColor: string;
  modulesCount: number;
  compatibility: string[];
  averageImplementationTime: string;
  badge: TemplateBadge;
  priceTier: TemplatePriceTier;
  priceLabel: string;
  popularityScore: number;
  isBestSeller: boolean;
  isNew: boolean;
  rating: number;
  downloads: number;
  deployments: number;
  gallery: string[];
  features: string[];
  includedModules: string[];
  integrations: string[];
  technologies: string[];
  version: string;
  recommendedPlan: string;
  recommendedTemplateSlugs: string[];
  relatedTemplateSlugs: string[];
  aiIntegrationContract: {
    recommendedPromptContext: string[];
    personalizationInputs: string[];
    generationBoundaries: string[];
  };
};
