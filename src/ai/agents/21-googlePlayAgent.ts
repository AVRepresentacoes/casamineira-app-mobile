import { createAgentDefinition } from "./agentTypes";

export const googlePlayAgent = createAgentDefinition({
  id: "21-google-play",
  order: 21,
  fileName: "21-googlePlayAgent.ts",
  name: "Google Play Agent",
  stage: "publishing",
  objective: "Gerar checklist Google Play, descricao, politica de dados, classificacao, prints e envio.",
  outputContract: "Checklist Google Play.",
  dependsOn: ["20-devops", "23-legal"],
  capabilities: ["play store", "data safety", "screenshots", "metadata"],
  artifactKey: "googlePlayChecklist",
  defaultRecommendations: ["Preparar data safety antes do envio.", "Usar screenshots reais do app do cliente."],
});
