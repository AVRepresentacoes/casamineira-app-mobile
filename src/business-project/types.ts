import type { BusinessDna } from "@/src/business-dna/types";
import type { PremiumTemplate } from "@/src/template-marketplace/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type BusinessProjectIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type BusinessProjectStatus = "draft" | "planning" | "in_progress" | "review" | "published";
export type BusinessProjectPlan = "Starter" | "Professional" | "Premium" | "Enterprise";
export type BusinessProjectEnvironment = "Sandbox" | "Staging" | "Production";
export type BusinessProjectTeamRole = "Owner" | "Admin" | "Builder" | "Marketing" | "Viewer";

export type BusinessProjectModuleId =
  | "overview"
  | "business-dna"
  | "app"
  | "website"
  | "panel"
  | "marketplace"
  | "marketing"
  | "publishing"
  | "ai"
  | "analytics"
  | "team"
  | "settings";

export interface BusinessProjectTeamMember {
  id: string;
  name: string;
  role: BusinessProjectTeamRole;
  status: "Ativo" | "Convidado";
}

export interface BusinessProjectBuild {
  id: string;
  channel: "Web" | "Android" | "iOS";
  status: "Planejado" | "Em andamento" | "Aguardando revisão" | "Pronto";
  version: string;
}

export interface BusinessProjectTask {
  id: string;
  title: string;
  owner: string;
  dueLabel: string;
  status: "Pendente" | "Em andamento" | "Revisão";
}

export interface BusinessProjectTimelineItem {
  id: string;
  label: string;
  description: string;
  status: "done" | "current" | "next";
}

export interface BusinessProjectModule {
  id: BusinessProjectModuleId;
  title: string;
  description: string;
  icon: BusinessProjectIconName;
  status: "Ativo" | "Planejado" | "Pendente";
  placeholderHighlights: string[];
}

export interface BusinessProject {
  id: string;
  name: string;
  slug: string;
  businessDnaSlug: BusinessDna["slug"];
  businessDnaName: string;
  templateSlug: PremiumTemplate["slug"];
  templateName: string;
  plan: BusinessProjectPlan;
  status: BusinessProjectStatus;
  createdAtLabel: string;
  updatedAtLabel: string;
  version: string;
  team: BusinessProjectTeamMember[];
  environment: BusinessProjectEnvironment;
  companyName: string;
  tenantLabel: string;
  modules: BusinessProjectModule[];
  nextTasks: BusinessProjectTask[];
  timeline: BusinessProjectTimelineItem[];
  builds: BusinessProjectBuild[];
  executiveSummary: {
    health: string;
    goal: string;
    risk: string;
    nextDecision: string;
  };
}
