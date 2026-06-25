export type BuildCommandPlan = {
  command: string;
  args: string[];
  requiresHumanApproval: boolean;
  blockedUntil?: string;
};

export function planClientBuild(slug: string): BuildCommandPlan {
  return {
    command: "npm",
    args: ["run", "client:build:android", slug],
    requiresHumanApproval: true,
    blockedUntil: "Artefatos materializados, client:validate aprovado e revisao operacional concluida.",
  };
}

export function planClientValidation(slug: string): BuildCommandPlan {
  return {
    command: "npm",
    args: ["run", "client:validate", slug],
    requiresHumanApproval: false,
  };
}
