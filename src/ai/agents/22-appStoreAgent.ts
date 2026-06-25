import { createAgentDefinition } from "./agentTypes";

export const appStoreAgent = createAgentDefinition({
  id: "22-app-store",
  order: 22,
  fileName: "22-appStoreAgent.ts",
  name: "App Store Agent",
  stage: "publishing",
  objective: "Preparar checklist Apple Store, metadados, screenshots, privacidade e revisao.",
  outputContract: "Checklist App Store.",
  dependsOn: ["20-devops", "23-legal"],
  capabilities: ["app store", "privacidade", "screenshots", "review"],
  artifactKey: "appStoreChecklist",
  defaultRecommendations: ["Revisar uso de dados no App Privacy.", "Garantir tela de exclusao de conta."],
});
