import { createAgentDefinition } from "./agentTypes";

export const paymentAgent = createAgentDefinition({
  id: "15-payment",
  order: 15,
  fileName: "15-paymentAgent.ts",
  name: "Payment Agent",
  stage: "engineering",
  objective: "Criar pagamentos, assinaturas, Pix, cartao, webhooks, inadimplencia e planos.",
  outputContract: "Plano de pagamentos.",
  dependsOn: ["11-backend", "14-api-integration"],
  capabilities: ["pix", "cartao", "assinaturas", "webhooks"],
  artifactKey: "paymentPlan",
  defaultRecommendations: ["Comecar com Pix e webhook de confirmacao.", "Separar pagamento do cliente e cobranca SaaS."],
});
