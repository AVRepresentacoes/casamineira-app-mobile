import {
  orchestrationCopilotInsights,
  orchestrationCopilotRecommendations,
} from "@/src/ai-orchestration/mocks";
import type { AiAction, AiConversation, AiInsight, AiRecommendation } from "./types";

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
