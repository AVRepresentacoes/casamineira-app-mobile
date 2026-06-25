import { allAgents, type AgentOutput } from "../agents";
import { createMarketingPlan } from "../schemas/marketingPlanSchema";
import type { AiFactoryContext } from "../schemas/briefingSchema";
import { planAnalyticsEvents } from "../tools/analyticsTools";
import { planMarketingAssets } from "../tools/marketingTools";

const MARKETING_AGENT_IDS = new Set([
  "02-market-research",
  "03-business-strategy",
  "08-copywriter",
  "24-seo",
  "25-social-media",
  "26-paid-traffic",
  "27-video-content",
  "30-growth-analytics",
]);

export type MarketingOrchestratorResult = {
  marketingPlan: ReturnType<typeof createMarketingPlan>;
  assets: ReturnType<typeof planMarketingAssets>;
  analytics: ReturnType<typeof planAnalyticsEvents>;
  agents: Record<string, AgentOutput>;
};

export function runMarketingOrchestrator(context: AiFactoryContext): MarketingOrchestratorResult {
  const selectedAgents = allAgents.filter((agent) => MARKETING_AGENT_IDS.has(agent.id));

  return {
    marketingPlan: createMarketingPlan(context.briefing.segment),
    assets: planMarketingAssets(),
    analytics: planAnalyticsEvents(),
    agents: Object.fromEntries(selectedAgents.map((agent) => [agent.id, agent.run(context)])),
  };
}
