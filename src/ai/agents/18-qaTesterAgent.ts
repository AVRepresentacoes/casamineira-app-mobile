import { createAgentDefinition } from "./agentTypes";

export const qaTesterAgent = createAgentDefinition({
  id: "18-qa-tester",
  order: 18,
  fileName: "18-qaTesterAgent.ts",
  name: "QA Tester Agent",
  stage: "quality",
  objective: "Testar telas, fluxos, formularios, autenticacao, pagamentos e erros comuns.",
  outputContract: "Checklist QA.",
  dependsOn: ["09-react-native", "11-backend", "15-payment"],
  capabilities: ["testes funcionais", "regressao", "pagamentos", "auth"],
  artifactKey: "qaChecklist",
  defaultRecommendations: ["Testar login, pagamento e fluxo principal em Android.", "Registrar bugs por severidade."],
});
