import { createAgentDefinition } from "./agentTypes";

export const apiIntegrationAgent = createAgentDefinition({
  id: "14-api-integration",
  order: 14,
  fileName: "14-apiIntegrationAgent.ts",
  name: "API Integration Agent",
  stage: "engineering",
  objective: "Integrar APIs externas como OpenAI, Mercado Pago, Asaas, WhatsApp, Google Maps e e-mail.",
  outputContract: "Mapa de integracoes externas.",
  dependsOn: ["11-backend"],
  capabilities: ["openai", "pagamentos", "whatsapp", "maps", "email"],
  artifactKey: "apiIntegrations",
  defaultRecommendations: ["Guardar tokens em secrets.", "Criar webhooks idempotentes."],
});
