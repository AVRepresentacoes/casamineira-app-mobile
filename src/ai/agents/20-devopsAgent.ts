import { createAgentDefinition } from "./agentTypes";

export const devopsAgent = createAgentDefinition({
  id: "20-devops",
  order: 20,
  fileName: "20-devopsAgent.ts",
  name: "DevOps Agent",
  stage: "publishing",
  objective: "Preparar build, deploy, variaveis de ambiente, Vercel, Expo, EAS Build e logs.",
  outputContract: "Plano DevOps e checklist de build.",
  dependsOn: ["18-qa-tester", "19-security"],
  capabilities: ["eas build", "deploy", "env vars", "logs"],
  artifactKey: "devopsPlan",
  defaultRecommendations: ["Executar build apenas apos aprovacao.", "Conferir env por tenant antes de publicar."],
});
