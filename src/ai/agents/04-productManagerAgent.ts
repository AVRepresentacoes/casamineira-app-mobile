import { createAgentDefinition } from "./agentTypes";

export const productManagerAgent = createAgentDefinition({
  id: "04-product-manager",
  order: 4,
  fileName: "04-productManagerAgent.ts",
  name: "Product Manager Agent",
  stage: "product",
  objective: "Transformar briefing em roadmap, prioridades e MVP.",
  outputContract: "Roadmap de produto e escopo MVP.",
  dependsOn: ["01-briefing", "03-business-strategy"],
  capabilities: ["roadmap", "priorizacao", "escopo MVP"],
  artifactKey: "productRoadmap",
  defaultRecommendations: ["Separar MVP de pos-lancamento.", "Bloquear alteracoes de escopo antes do build."],
});
