import { createAgentDefinition } from "./agentTypes";

export const backendAgent = createAgentDefinition({
  id: "11-backend",
  order: 11,
  fileName: "11-backendAgent.ts",
  name: "Backend Agent",
  stage: "engineering",
  objective: "Criar regras de negocio, endpoints, autenticacao, webhooks e logica principal.",
  outputContract: "Mapa de backend e endpoints.",
  dependsOn: ["04-product-manager"],
  capabilities: ["edge functions", "regras de negocio", "webhooks", "autenticacao"],
  artifactKey: "backendPlan",
  defaultRecommendations: ["Rodar segredos apenas em Edge Functions.", "Validar tenant em toda chamada sensivel."],
});
