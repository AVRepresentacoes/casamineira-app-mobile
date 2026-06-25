import { createAgentDefinition } from "./agentTypes";

export const n8nAutomationAgent = createAgentDefinition({
  id: "17-n8n-automation",
  order: 17,
  fileName: "17-n8nAutomationAgent.ts",
  name: "n8n Automation Agent",
  stage: "automation",
  objective: "Criar automacoes com n8n, webhooks, CRM, e-mail, WhatsApp, planilhas e notificacoes.",
  outputContract: "Fluxos n8n planejados.",
  dependsOn: ["11-backend", "16-whatsapp-automation"],
  capabilities: ["webhooks", "crm", "email", "planilhas", "notificacoes"],
  artifactKey: "n8nFlows",
  defaultRecommendations: ["Usar webhooks autenticados.", "Versionar fluxos criticos."],
});
