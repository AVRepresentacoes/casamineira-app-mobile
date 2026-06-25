export type BuildStatusSchema = {
  status: "draft" | "waiting_approval" | "ready_for_generation" | "blocked";
  checklist: string[];
  blockers: string[];
};

export function createInitialBuildStatus(): BuildStatusSchema {
  return {
    status: "waiting_approval",
    checklist: [
      "Briefing estruturado",
      "Template sugerido",
      "Arquitetura planejada",
      "Plano de marketing inicial",
      "Aprovacao humana antes de gerar codigo ou build",
    ],
    blockers: [],
  };
}
