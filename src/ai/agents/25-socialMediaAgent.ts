import { createAgentDefinition } from "./agentTypes";

export const socialMediaAgent = createAgentDefinition({
  id: "25-social-media",
  order: 25,
  fileName: "25-socialMediaAgent.ts",
  name: "Social Media Agent",
  stage: "marketing",
  objective: "Criar calendario editorial, posts, legendas, carrosseis, stories e ideias de conteudo.",
  outputContract: "Calendario de social media.",
  dependsOn: ["08-copywriter", "24-seo"],
  capabilities: ["posts", "legendas", "stories", "calendario editorial"],
  artifactKey: "socialMediaCalendar",
  defaultRecommendations: ["Publicar conteudo de prova social.", "Usar ofertas simples com CTA para WhatsApp/app."],
});
