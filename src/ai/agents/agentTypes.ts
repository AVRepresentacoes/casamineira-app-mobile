import type { AiFactoryContext } from "../schemas/briefingSchema";

export type AgentStage =
  | "intake"
  | "research"
  | "strategy"
  | "product"
  | "design"
  | "engineering"
  | "automation"
  | "quality"
  | "publishing"
  | "marketing"
  | "business"
  | "support";

export type AgentOutput = {
  summary: string;
  recommendations: string[];
  artifacts: Record<string, unknown>;
};

export type AgentDefinition = {
  id: string;
  order: number;
  fileName: string;
  name: string;
  stage: AgentStage;
  objective: string;
  outputContract: string;
  dependsOn: string[];
  capabilities: string[];
  run: (context: AiFactoryContext) => AgentOutput;
};

export function createAgentDefinition(
  definition: Omit<AgentDefinition, "run"> & {
    artifactKey: string;
    defaultRecommendations: string[];
  },
): AgentDefinition {
  return {
    ...definition,
    run: (context) => {
      const appName = context.briefing.appName || "Novo aplicativo";
      const segment = context.briefing.segment || "servicos";

      return {
        summary: `${definition.name} preparou ${definition.outputContract.toLowerCase()} para ${appName}.`,
        recommendations: definition.defaultRecommendations,
        artifacts: {
          [definition.artifactKey]: {
            appName,
            segment,
            agentId: definition.id,
            stage: definition.stage,
            generatedAt: context.generatedAt,
            dryRun: context.dryRun,
          },
        },
      };
    },
  };
}
