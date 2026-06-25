import { createAgentDefinition } from "./agentTypes";

export const databaseAgent = createAgentDefinition({
  id: "12-database",
  order: 12,
  fileName: "12-databaseAgent.ts",
  name: "Database Agent",
  stage: "engineering",
  objective: "Criar tabelas, relacionamentos, migrations, seeds e regras de seguranca.",
  outputContract: "Modelo de dados e migrations planejadas.",
  dependsOn: ["04-product-manager", "11-backend"],
  capabilities: ["postgres", "migrations", "seeds", "relacionamentos"],
  artifactKey: "databasePlan",
  defaultRecommendations: ["Criar migrations revisaveis.", "Evitar alteracoes destrutivas sem backup."],
});
