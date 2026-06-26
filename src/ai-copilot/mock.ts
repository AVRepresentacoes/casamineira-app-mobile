import {
  orchestrationCopilotInsights,
  orchestrationCopilotRecommendations,
} from "@/src/ai-orchestration/mocks";
import type { AiAction, AiConversation, AiCopilotRouteContext, AiInsight, AiRecommendation } from "./types";

const routeContexts: Record<string, Omit<AiCopilotRouteContext, "route">> = {
  "/dashboard": {
    area: "dashboard",
    title: "Visão executiva",
    primaryMessage: "Estou acompanhando a visão geral da plataforma. Priorize o próximo projeto, revise módulos ativos e mantenha a publicação sob aprovação humana.",
  },
  "/apps/new": {
    area: "studio",
    title: "Business Studio",
    primaryMessage: "Este fluxo deve partir de um Business DNA™ e de um template validado antes de qualquer geração assistida.",
  },
  "/business-dna": {
    area: "catalog",
    title: "Business DNA",
    primaryMessage: "Use o catálogo de DNA para reduzir escopo aberto, custo de IA e risco de personalizações sem base operacional.",
  },
  "/marketplace": {
    area: "marketplace",
    title: "Marketplace",
    primaryMessage: "Templates premium devem acelerar implantação e preservar a revisão humana antes de qualquer publicação.",
  },
  "/projects": {
    area: "projects",
    title: "Business Projects",
    primaryMessage: "Projetos devem centralizar módulos, equipe, ambiente, plano e próximos passos antes de avançar para build.",
  },
  "/ai-business-consultant": {
    area: "ai",
    title: "AI Business Consultant",
    primaryMessage: "A consultoria visual deve recomendar estrutura e próximos passos sem chamar modelos reais nesta camada de frontend.",
  },
  "/ai-workforce": {
    area: "ai",
    title: "AI Workforce",
    primaryMessage: "A força de trabalho IA está em modo simulado; mantenha tarefas, estados e aprovações separados da execução real.",
  },
  "/ai-solution-architect": {
    area: "ai",
    title: "AI Solution Architect",
    primaryMessage: "O blueprint deve organizar requisitos, módulos e integrações antes de qualquer materialização técnica.",
  },
  "/project-review": {
    area: "review",
    title: "Project Review",
    primaryMessage: "Antes de publicar, valide arquitetura, checklist, riscos, custo estimado e aprovação humana.",
  },
};

const genericRouteContext: Omit<AiCopilotRouteContext, "route"> = {
  area: "generic",
  title: "Contexto SaaS",
  primaryMessage: "Estou pronto para apoiar decisões da plataforma usando apenas dados mockados e contexto visual da rota atual.",
};

export function getAiCopilotRouteContext(pathname: string): AiCopilotRouteContext {
  const cleanPath = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  const match = Object.entries(routeContexts).find(([route]) => cleanPath === route || cleanPath.startsWith(`${route}/`));
  return {
    route: cleanPath,
    ...(match ? match[1] : genericRouteContext),
  };
}

export const aiCopilotRecommendations: AiRecommendation[] = [
  {
    id: "marketplace-dna",
    title: "Marketplace compatível",
    description: "O Business DNA selecionado possui integração nativa com Marketplace. Recomendo manter essa configuração.",
    tone: "success",
  },
  {
    id: "blueprint-review",
    title: "Blueprint revisável",
    description: "A arquitetura visual já está preparada para revisão humana antes de qualquer materialização.",
    tone: "info",
  },
  {
    id: "cost-control",
    title: "Controle de custo",
    description: "Usar template premium antes de geração reduz tempo, tokens e risco operacional.",
    tone: "warning",
  },
  ...orchestrationCopilotRecommendations,
];

export const aiCopilotInsights: AiInsight[] = [
  {
    id: "clinic-finance",
    content: "O nicho Clínica possui maior potencial utilizando Agenda + Financeiro.",
    category: "Negócio",
  },
  {
    id: "android-web",
    content: "Seu projeto pode ser publicado em Android e Web.",
    category: "Publicação",
  },
  {
    id: "marketplace-recurring",
    content: "Marketplace aumenta recorrência quando combinado com painel operacional.",
    category: "Crescimento",
  },
  ...orchestrationCopilotInsights,
];

export const aiCopilotActions: AiAction[] = [
  { id: "business-dna", label: "Escolher Business DNA", description: "Definir a base do negócio digital.", completed: true },
  { id: "template", label: "Selecionar Template", description: "Escolher uma base premium validada.", completed: true },
  { id: "blueprint", label: "Aprovar Blueprint", description: "Revisar arquitetura, módulos e cronograma.", completed: false },
  { id: "build", label: "Construir Sistema", description: "Etapa futura após aprovação humana.", completed: false },
];

export const aiCopilotHistory: AiConversation[] = [
  {
    id: "history-1",
    role: "assistant",
    message: "Recomendei manter Marketplace por aumentar recorrência.",
    timestampLabel: "Agora",
  },
  {
    id: "history-2",
    role: "assistant",
    message: "Sugeri revisar o Blueprint™ antes de avançar para build.",
    timestampLabel: "Hoje",
  },
  {
    id: "history-3",
    role: "assistant",
    message: "Identifiquei oportunidade de reduzir custo usando template premium.",
    timestampLabel: "Ontem",
  },
];

export const aiCopilotQuickSuggestions = [
  "Melhorar arquitetura",
  "Revisar Blueprint",
  "Reduzir custo",
  "Melhorar UX",
  "Adicionar IA",
  "Criar Website",
  "Criar Painel",
  "Criar App",
];
