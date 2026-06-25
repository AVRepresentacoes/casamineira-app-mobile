import { createAgentDefinition } from "./agentTypes";

export const uxResearchAgent = createAgentDefinition({
  id: "05-ux-research",
  order: 5,
  fileName: "05-uxResearchAgent.ts",
  name: "UX Research Agent",
  stage: "design",
  objective: "Definir jornada do usuario, dores, fluxos e experiencia ideal.",
  outputContract: "Mapa de jornada e fluxos principais.",
  dependsOn: ["01-briefing", "04-product-manager"],
  capabilities: ["jornada do usuario", "fluxos", "dores e motivacoes"],
  artifactKey: "uxResearch",
  defaultRecommendations: ["Desenhar fluxo de primeira conversao.", "Reduzir campos obrigatorios no cadastro inicial."],
});
