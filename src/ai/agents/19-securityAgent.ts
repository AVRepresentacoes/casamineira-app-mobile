import { createAgentDefinition } from "./agentTypes";

export const securityAgent = createAgentDefinition({
  id: "19-security",
  order: 19,
  fileName: "19-securityAgent.ts",
  name: "Security Agent",
  stage: "quality",
  objective: "Revisar seguranca, permissoes, protecao de dados, RLS, vazamento de chaves e LGPD.",
  outputContract: "Checklist de seguranca.",
  dependsOn: ["12-database", "13-supabase", "14-api-integration"],
  capabilities: ["rls", "lgpd", "secrets", "permissoes"],
  artifactKey: "securityReview",
  defaultRecommendations: ["Bloquear secrets no frontend.", "Revisar politicas RLS antes de producao."],
});
