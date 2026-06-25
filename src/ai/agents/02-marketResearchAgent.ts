import { createAgentDefinition } from "./agentTypes";

export const marketResearchAgent = createAgentDefinition({
  id: "02-market-research",
  order: 2,
  fileName: "02-marketResearchAgent.ts",
  name: "Market Research Agent",
  stage: "research",
  objective: "Analisar nicho, concorrentes, oportunidades e diferenciais de mercado.",
  outputContract: "Relatorio de mercado e oportunidades.",
  dependsOn: ["01-briefing"],
  capabilities: ["analise de nicho", "benchmark", "oportunidades locais"],
  artifactKey: "marketResearch",
  defaultRecommendations: ["Mapear concorrentes locais.", "Priorizar diferenciais que reduzam friccao de compra."],
});
