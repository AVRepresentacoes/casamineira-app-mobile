import { createAgentDefinition } from "./agentTypes";

export const legalAgent = createAgentDefinition({
  id: "23-legal",
  order: 23,
  fileName: "23-legalAgent.ts",
  name: "Legal Agent",
  stage: "business",
  objective: "Gerar termos de uso, politica de privacidade, exclusao de conta, LGPD e contratos basicos.",
  outputContract: "Documentos legais iniciais.",
  dependsOn: ["01-briefing", "19-security"],
  capabilities: ["termos", "privacidade", "lgpd", "contratos"],
  artifactKey: "legalDocs",
  defaultRecommendations: ["Validar documentos com advogado.", "Publicar politica de privacidade antes das lojas."],
});
