import type { BusinessDna } from "@/src/business-dna/types";
import type { PremiumTemplate } from "@/src/template-marketplace/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type BusinessBlueprintIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface BusinessRequirement {
  id: string;
  title: string;
  description: string;
  priority: "Essencial" | "Importante" | "Opcional";
}

export interface BusinessModule {
  id: string;
  name: string;
  description: string;
  icon: BusinessBlueprintIconName;
  selected: boolean;
  category: "Produto" | "Operação" | "Crescimento" | "Inteligência";
}

export interface BusinessArchitecture {
  pattern: string;
  frontend: string[];
  backend: string[];
  data: string[];
  security: string[];
  publishing: string[];
}

export interface BusinessBlueprint {
  id: string;
  title: string;
  executiveSummary: string;
  idea: string;
  objective: string;
  businessDnaSlug: BusinessDna["slug"];
  businessDnaName: string;
  templateSlug: PremiumTemplate["slug"];
  templateName: string;
  architecture: BusinessArchitecture;
  requirements: BusinessRequirement[];
  modules: BusinessModule[];
  integrations: string[];
  resources: string[];
  schedule: Array<{
    phase: string;
    duration: string;
    deliverable: string;
  }>;
  recommendedPlan: string;
  suggestedTeam: Array<{
    role: string;
    responsibility: string;
  }>;
  plannedBuilds: string[];
  plannedPublications: string[];
  futureIntegrationContract: {
    expectedInputs: string[];
    expectedOutputs: string[];
    boundaries: string[];
  };
}
