import type { BusinessDna } from "@/src/business-dna/types";
import type { PremiumTemplate } from "@/src/template-marketplace/types";

export type ConsultantVisualState =
  | "nova_conversa"
  | "aguardando_resposta"
  | "digitando"
  | "resposta_recebida"
  | "erro";

export type ConsultantMessageRole = "assistant" | "user" | "system";

export interface ConsultantMessage {
  id: string;
  role: ConsultantMessageRole;
  content: string;
  timestampLabel: string;
  state?: ConsultantVisualState;
}

export interface ConsultantQuickSuggestion {
  id: string;
  label: string;
  intent: string;
}

export interface ConsultantRecommendation {
  businessDnaSlug: BusinessDna["slug"] | "placeholder";
  businessDnaName: string;
  templateSlugs: Array<PremiumTemplate["slug"]>;
  templateNames: string[];
  suggestedPlan: string;
  estimatedTime: string;
  includedResources: string[];
}

export interface ConsultantNextStep {
  id: string;
  title: string;
  description: string;
}

export interface ConsultantResponseContract {
  id: string;
  status: ConsultantVisualState;
  summary: string;
  recommendation: ConsultantRecommendation;
  nextSteps: ConsultantNextStep[];
  integrationNotes: string[];
}
