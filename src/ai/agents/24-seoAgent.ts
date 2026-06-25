import { createAgentDefinition } from "./agentTypes";

export const seoAgent = createAgentDefinition({
  id: "24-seo",
  order: 24,
  fileName: "24-seoAgent.ts",
  name: "SEO Agent",
  stage: "marketing",
  objective: "Criar estrategia SEO, artigos, palavras-chave, metatags e paginas otimizadas.",
  outputContract: "Plano SEO.",
  dependsOn: ["02-market-research", "08-copywriter"],
  capabilities: ["keywords", "metatags", "artigos", "landing pages"],
  artifactKey: "seoPlan",
  defaultRecommendations: ["Focar termos locais.", "Criar paginas por servico principal."],
});
