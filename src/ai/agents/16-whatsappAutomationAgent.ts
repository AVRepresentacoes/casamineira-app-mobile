import { createAgentDefinition } from "./agentTypes";

export const whatsappAutomationAgent = createAgentDefinition({
  id: "16-whatsapp-automation",
  order: 16,
  fileName: "16-whatsappAutomationAgent.ts",
  name: "WhatsApp Automation Agent",
  stage: "automation",
  objective: "Criar fluxos automaticos de atendimento, orcamento, cobranca e suporte pelo WhatsApp.",
  outputContract: "Fluxos WhatsApp.",
  dependsOn: ["08-copywriter", "14-api-integration"],
  capabilities: ["atendimento", "orcamento", "cobranca", "suporte"],
  artifactKey: "whatsappFlows",
  defaultRecommendations: ["Criar opt-in claro.", "Escalar para humano quando houver duvida sensivel."],
});
