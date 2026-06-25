import { createAgentDefinition } from "./agentTypes";

export const briefingAgent = createAgentDefinition({
  id: "01-briefing",
  order: 1,
  fileName: "01-briefingAgent.ts",
  name: "Briefing Agent",
  stage: "intake",
  objective: "Transformar fala ou texto do cliente em briefing estruturado.",
  outputContract: "JSON de briefing com app, segmento, publico, funcionalidades, cores, diferenciais, urgencia e orcamento.",
  dependsOn: [],
  capabilities: ["normalizacao de briefing", "extracao de requisitos", "classificacao de urgencia"],
  artifactKey: "briefing",
  defaultRecommendations: ["Confirmar funcionalidades obrigatorias.", "Validar nome comercial antes de criar assets."],
});
