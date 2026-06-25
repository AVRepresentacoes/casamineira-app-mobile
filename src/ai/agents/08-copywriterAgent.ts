import { createAgentDefinition } from "./agentTypes";

export const copywriterAgent = createAgentDefinition({
  id: "08-copywriter",
  order: 8,
  fileName: "08-copywriterAgent.ts",
  name: "Copywriter Agent",
  stage: "marketing",
  objective: "Criar textos persuasivos para app, landing page, anuncios, e-mails e notificacoes.",
  outputContract: "Copies comerciais multicanal.",
  dependsOn: ["07-branding", "03-business-strategy"],
  capabilities: ["copy de landing", "anuncios", "notificacoes", "emails"],
  artifactKey: "copywriting",
  defaultRecommendations: ["Criar CTA direto.", "Adaptar copy por canal e etapa do funil."],
});
