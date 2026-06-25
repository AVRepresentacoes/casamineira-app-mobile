import { createAgentDefinition } from "./agentTypes";

export const financialPricingAgent = createAgentDefinition({
  id: "29-financial-pricing",
  order: 29,
  fileName: "29-financialPricingAgent.ts",
  name: "Financial Pricing Agent",
  stage: "business",
  objective: "Calcular preco do app, custo de IA, margem, plano mensal, comissao e viabilidade.",
  outputContract: "Precificacao e viabilidade.",
  dependsOn: ["04-product-manager", "15-payment"],
  capabilities: ["precificacao", "margem", "mensalidade", "viabilidade"],
  artifactKey: "financialPricing",
  defaultRecommendations: ["Incluir reserva para custo de IA.", "Separar setup de mensalidade operacional."],
});
