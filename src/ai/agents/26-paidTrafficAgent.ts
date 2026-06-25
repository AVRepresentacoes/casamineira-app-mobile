import { createAgentDefinition } from "./agentTypes";

export const paidTrafficAgent = createAgentDefinition({
  id: "26-paid-traffic",
  order: 26,
  fileName: "26-paidTrafficAgent.ts",
  name: "Paid Traffic Agent",
  stage: "marketing",
  objective: "Criar campanhas para Google Ads, Meta Ads, TikTok Ads, publicos e copies.",
  outputContract: "Plano de trafego pago.",
  dependsOn: ["02-market-research", "08-copywriter"],
  capabilities: ["google ads", "meta ads", "tiktok ads", "publicos"],
  artifactKey: "paidTrafficPlan",
  defaultRecommendations: ["Comecar com campanha local de conversao.", "Separar verba de teste e escala."],
});
