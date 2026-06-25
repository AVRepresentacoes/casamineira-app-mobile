import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type BusinessDnaIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type BusinessDnaMaturity = "starter" | "validated" | "premium" | "enterprise";

export type BusinessDnaCategory =
  | "Hospitalidade"
  | "Saúde"
  | "Comércio"
  | "Serviços"
  | "Educação"
  | "Finanças"
  | "Comunidade"
  | "Construção"
  | "Turismo";

export type BusinessDnaSegment =
  | "B2C"
  | "B2B"
  | "Marketplace"
  | "Operação Local"
  | "Assinatura"
  | "Gestão Interna";

export type BusinessDna = {
  id: string;
  name: string;
  slug: string;
  category: BusinessDnaCategory;
  segment: BusinessDnaSegment;
  description: string;
  commercialDescription: string;
  icon: BusinessDnaIconName;
  primaryColor: string;
  secondaryColor: string;
  image: string;
  maturity: BusinessDnaMaturity;
  defaultFeatures: string[];
  availableModules: string[];
  supportedIntegrations: string[];
  premiumResources: string[];
  averageImplementationTime: string;
  benefits: string[];
  useCases: string[];
  recommendedPlan: string;
  aiPreparationContract: {
    briefingHints: string[];
    requiredInputs: string[];
    suggestedOutputs: string[];
  };
};
