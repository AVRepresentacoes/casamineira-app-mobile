import { createAgentDefinition } from "./agentTypes";

export const uiDesignerAgent = createAgentDefinition({
  id: "06-ui-designer",
  order: 6,
  fileName: "06-uiDesignerAgent.ts",
  name: "UI Designer Agent",
  stage: "design",
  objective: "Criar estrutura visual de telas, componentes, paleta e design system.",
  outputContract: "Direcao visual, componentes e telas.",
  dependsOn: ["05-ux-research", "07-branding"],
  capabilities: ["wireframes", "design system", "componentes"],
  artifactKey: "uiDesign",
  defaultRecommendations: ["Usar componentes reutilizaveis.", "Garantir contraste e leitura em mobile."],
});
