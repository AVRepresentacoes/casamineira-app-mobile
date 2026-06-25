import { createAgentDefinition } from "./agentTypes";

export const videoContentAgent = createAgentDefinition({
  id: "27-video-content",
  order: 27,
  fileName: "27-videoContentAgent.ts",
  name: "Video Content Agent",
  stage: "marketing",
  objective: "Criar roteiros de videos, prompts para Sora, narracoes, videos curtos e anuncios.",
  outputContract: "Roteiros e prompts de video.",
  dependsOn: ["08-copywriter", "25-social-media"],
  capabilities: ["roteiros", "prompts de video", "narracao", "anuncios curtos"],
  artifactKey: "videoContent",
  defaultRecommendations: ["Criar videos curtos com demonstracao real.", "Usar chamada local nos primeiros segundos."],
});
