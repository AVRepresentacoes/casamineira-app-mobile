import { allAgents, type AgentOutput } from "../agents";
import { createDefaultArchitecture } from "../schemas/architectureSchema";
import { selectAppTemplate } from "../schemas/appTemplateSchema";
import type { AiFactoryContext } from "../schemas/briefingSchema";
import { createInitialBuildStatus } from "../schemas/buildStatusSchema";
import { planClientBuild } from "../tools/buildTools";
import { planGeneratedFiles } from "../tools/fileTools";
import { planPaymentIntegrations } from "../tools/paymentTools";
import { describeTemplateAssets } from "../tools/templateTools";

const APP_AGENT_IDS = new Set([
  "01-briefing",
  "04-product-manager",
  "05-ux-research",
  "06-ui-designer",
  "07-branding",
  "09-react-native",
  "10-nextjs",
  "11-backend",
  "12-database",
  "13-supabase",
  "14-api-integration",
  "15-payment",
  "18-qa-tester",
  "19-security",
  "20-devops",
  "21-google-play",
  "22-app-store",
  "23-legal",
]);

export type AppGenerationResult = {
  template: ReturnType<typeof selectAppTemplate>;
  architecture: ReturnType<typeof createDefaultArchitecture>;
  buildStatus: ReturnType<typeof createInitialBuildStatus>;
  generatedFiles: ReturnType<typeof planGeneratedFiles>;
  templateAssets: ReturnType<typeof describeTemplateAssets>;
  paymentPlan: ReturnType<typeof planPaymentIntegrations>;
  buildCommand: ReturnType<typeof planClientBuild>;
  agents: Record<string, AgentOutput>;
};

export function runAppGenerationOrchestrator(context: AiFactoryContext): AppGenerationResult {
  const template = selectAppTemplate(context.briefing.segment, context.briefing.features);
  const paymentPlan = planPaymentIntegrations(context.briefing.features);
  const slug = context.briefing.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "novo-app";
  const selectedAgents = allAgents.filter((agent) => APP_AGENT_IDS.has(agent.id));

  return {
    template,
    architecture: createDefaultArchitecture(paymentPlan.providers),
    buildStatus: createInitialBuildStatus(),
    generatedFiles: planGeneratedFiles([
      `clients/${slug}/client.json`,
      `clients/${slug}/provision.sql`,
      `src/ai/logs/${context.requestId}.json`,
    ]),
    templateAssets: describeTemplateAssets(template.key),
    paymentPlan,
    buildCommand: planClientBuild(slug),
    agents: Object.fromEntries(selectedAgents.map((agent) => [agent.id, agent.run(context)])),
  };
}
