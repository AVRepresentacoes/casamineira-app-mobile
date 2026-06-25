import { createAgentDefinition } from "./agentTypes";

export const nextjsAgent = createAgentDefinition({
  id: "10-nextjs",
  order: 10,
  fileName: "10-nextjsAgent.ts",
  name: "Next.js Agent",
  stage: "engineering",
  objective: "Criar painel web, landing pages, dashboard e area administrativa.",
  outputContract: "Plano web/admin.",
  dependsOn: ["04-product-manager", "06-ui-designer"],
  capabilities: ["landing page", "dashboard", "admin web"],
  artifactKey: "nextjsPlan",
  defaultRecommendations: ["Usar web atual do Expo quando suficiente.", "Separar landing publica de admin autenticado."],
});
