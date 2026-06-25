import { createAgentDefinition } from "./agentTypes";

export const businessStrategyAgent = createAgentDefinition({
  id: "03-business-strategy",
  order: 3,
  fileName: "03-businessStrategyAgent.ts",
  name: "Business Strategy Agent",
  stage: "strategy",
  objective: "Criar modelo de negocio, monetizacao, crescimento e posicionamento.",
  outputContract: "Estrategia de negocio e monetizacao.",
  dependsOn: ["01-briefing", "02-market-research"],
  capabilities: ["modelo de receita", "posicionamento", "plano de crescimento"],
  artifactKey: "businessStrategy",
  defaultRecommendations: ["Definir oferta de lancamento.", "Criar recorrencia com plano mensal ou clube de beneficios."],
});
