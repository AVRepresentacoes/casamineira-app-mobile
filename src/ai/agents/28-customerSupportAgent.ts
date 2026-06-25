import { createAgentDefinition } from "./agentTypes";

export const customerSupportAgent = createAgentDefinition({
  id: "28-customer-support",
  order: 28,
  fileName: "28-customerSupportAgent.ts",
  name: "Customer Support Agent",
  stage: "support",
  objective: "Criar chatbot de suporte, FAQ, respostas automaticas e triagem.",
  outputContract: "Base de suporte e FAQ.",
  dependsOn: ["01-briefing", "16-whatsapp-automation"],
  capabilities: ["faq", "chatbot", "triagem", "respostas automaticas"],
  artifactKey: "supportKnowledgeBase",
  defaultRecommendations: ["Criar respostas para duvidas de preco, prazo e suporte.", "Encaminhar casos sensiveis para humano."],
});
