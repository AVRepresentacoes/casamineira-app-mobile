import { createAgentDefinition } from "./agentTypes";

export const reactNativeAgent = createAgentDefinition({
  id: "09-react-native",
  order: 9,
  fileName: "09-reactNativeAgent.ts",
  name: "React Native Agent",
  stage: "engineering",
  objective: "Gerar ou adaptar codigo mobile React Native/Expo com base em templates.",
  outputContract: "Plano de implementacao mobile.",
  dependsOn: ["04-product-manager", "06-ui-designer"],
  capabilities: ["expo", "react native", "navegacao", "componentes mobile"],
  artifactKey: "reactNativePlan",
  defaultRecommendations: ["Reaproveitar expo-router existente.", "Nao inserir chaves privadas no bundle mobile."],
});
