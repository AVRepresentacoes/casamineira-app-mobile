import { allAgents } from "../agents";
import type { AiFactoryInput, AiFactoryContext } from "../schemas/briefingSchema";
import { createBriefingFromPrompt } from "../schemas/briefingSchema";
import { estimatePricing } from "../schemas/pricingSchema";
import { runAppGenerationOrchestrator } from "./appGenerationOrchestrator";
import { runAutomationOrchestrator } from "./automationOrchestrator";
import { runMarketingOrchestrator } from "./marketingOrchestrator";

export type MainOrchestratorOptions = {
  dryRun?: boolean;
  requestId?: string;
  now?: string;
};

export type MainOrchestratorResult = {
  requestId: string;
  generatedAt: string;
  dryRun: boolean;
  briefing: ReturnType<typeof createBriefingFromPrompt>;
  agentCatalog: {
    id: string;
    order: number;
    name: string;
    stage: string;
    fileName: string;
    objective: string;
  }[];
  appGeneration: ReturnType<typeof runAppGenerationOrchestrator>;
  marketing: ReturnType<typeof runMarketingOrchestrator>;
  automation: ReturnType<typeof runAutomationOrchestrator>;
  pricing: ReturnType<typeof estimatePricing>;
};

export function runMainOrchestrator(input: AiFactoryInput, options: MainOrchestratorOptions = {}): MainOrchestratorResult {
  const generatedAt = options.now || new Date().toISOString();
  const requestId = options.requestId || `ai_${Date.now()}`;
  const briefing = createBriefingFromPrompt(input);
  const context: AiFactoryContext = {
    requestId,
    generatedAt,
    dryRun: options.dryRun !== false,
    input,
    briefing,
  };

  return {
    requestId,
    generatedAt,
    dryRun: context.dryRun,
    briefing,
    agentCatalog: allAgents.map((agent) => ({
      id: agent.id,
      order: agent.order,
      name: agent.name,
      stage: agent.stage,
      fileName: agent.fileName,
      objective: agent.objective,
    })),
    appGeneration: runAppGenerationOrchestrator(context),
    marketing: runMarketingOrchestrator(context),
    automation: runAutomationOrchestrator(context),
    pricing: estimatePricing(briefing.features.length, briefing.urgency),
  };
}
