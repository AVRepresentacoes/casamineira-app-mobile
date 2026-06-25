import { createAgentDefinition } from "./agentTypes";

export const brandingAgent = createAgentDefinition({
  id: "07-branding",
  order: 7,
  fileName: "07-brandingAgent.ts",
  name: "Branding Agent",
  stage: "design",
  objective: "Criar nome, slogan, identidade visual, tom de voz e descricoes.",
  outputContract: "Kit inicial de marca.",
  dependsOn: ["01-briefing", "03-business-strategy"],
  capabilities: ["naming", "slogan", "tom de voz", "identidade visual"],
  artifactKey: "branding",
  defaultRecommendations: ["Validar disponibilidade do nome.", "Manter tom simples, confiavel e comercial."],
});
