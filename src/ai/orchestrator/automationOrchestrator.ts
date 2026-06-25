import { allAgents, type AgentOutput } from "../agents";
import type { AiFactoryContext } from "../schemas/briefingSchema";
import { planSupabaseOperation } from "../tools/supabaseTools";

const AUTOMATION_AGENT_IDS = new Set([
  "14-api-integration",
  "16-whatsapp-automation",
  "17-n8n-automation",
  "28-customer-support",
]);

export type AutomationOrchestratorResult = {
  supabaseOperations: ReturnType<typeof planSupabaseOperation>[];
  agents: Record<string, AgentOutput>;
};

export function runAutomationOrchestrator(context: AiFactoryContext): AutomationOrchestratorResult {
  const selectedAgents = allAgents.filter((agent) => AUTOMATION_AGENT_IDS.has(agent.id));

  return {
    supabaseOperations: [
      planSupabaseOperation("edge-function", "Endpoint autenticado para disparar automacoes de IA."),
      planSupabaseOperation("rls-policy", "Politicas para logs e artefatos por tenant."),
    ],
    agents: Object.fromEntries(selectedAgents.map((agent) => [agent.id, agent.run(context)])),
  };
}
