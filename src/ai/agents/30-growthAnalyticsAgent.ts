import { createAgentDefinition } from "./agentTypes";

export const growthAnalyticsAgent = createAgentDefinition({
  id: "30-growth-analytics",
  order: 30,
  fileName: "30-growthAnalyticsAgent.ts",
  name: "Growth Analytics Agent",
  stage: "business",
  objective: "Analisar metricas, funil, conversao, retencao, CAC, LTV e oportunidades.",
  outputContract: "Plano de metricas e crescimento.",
  dependsOn: ["03-business-strategy", "29-financial-pricing"],
  capabilities: ["funil", "cac", "ltv", "retencao", "conversao"],
  artifactKey: "growthAnalytics",
  defaultRecommendations: ["Medir ativacao e primeira conversao.", "Criar dashboard por tenant e canal."],
});
