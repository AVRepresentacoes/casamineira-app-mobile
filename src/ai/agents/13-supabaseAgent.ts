import { createAgentDefinition } from "./agentTypes";

export const supabaseAgent = createAgentDefinition({
  id: "13-supabase",
  order: 13,
  fileName: "13-supabaseAgent.ts",
  name: "Supabase Agent",
  stage: "engineering",
  objective: "Configurar auth, storage, RLS policies, realtime e queries Supabase.",
  outputContract: "Plano Supabase seguro.",
  dependsOn: ["12-database"],
  capabilities: ["auth", "storage", "rls", "realtime"],
  artifactKey: "supabasePlan",
  defaultRecommendations: ["Ativar RLS em tabelas de tenant.", "Usar service role somente no backend."],
});
