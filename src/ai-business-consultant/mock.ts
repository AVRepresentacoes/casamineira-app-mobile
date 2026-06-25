import type {
  ConsultantMessage,
  ConsultantNextStep,
  ConsultantQuickSuggestion,
  ConsultantResponseContract,
  ConsultantVisualState,
} from "./types";

export const initialConsultantMessage: ConsultantMessage = {
  id: "initial-consultant-message",
  role: "assistant",
  timestampLabel: "Agora",
  state: "nova_conversa",
  content:
    "Olá! Sou seu Consultor de Negócios.\n\nPosso ajudá-lo a escolher o melhor Business DNA™, os módulos ideais e a estrutura mais indicada para transformar sua ideia em uma empresa digital.",
};

export const consultantQuickSuggestions: ConsultantQuickSuggestion[] = [
  { id: "clinic", label: "Quero criar uma clínica.", intent: "clinic-business" },
  { id: "delivery", label: "Quero abrir um delivery.", intent: "delivery-business" },
  { id: "online-sales", label: "Quero vender online.", intent: "online-commerce" },
  { id: "marketplace", label: "Quero um marketplace.", intent: "marketplace-business" },
  { id: "company-app", label: "Quero um aplicativo para minha empresa.", intent: "company-app" },
  { id: "internal-system", label: "Quero um sistema interno.", intent: "internal-system" },
];

export const consultantVisualStates: Array<{ id: ConsultantVisualState; label: string; description: string }> = [
  { id: "nova_conversa", label: "Nova conversa", description: "Sessão limpa para começar uma consultoria." },
  { id: "aguardando_resposta", label: "Aguardando resposta", description: "Entrada enviada, aguardando processamento futuro." },
  { id: "digitando", label: "Digitando", description: "Resposta visual em preparação." },
  { id: "resposta_recebida", label: "Resposta recebida", description: "Recomendação exibida ao usuário." },
  { id: "erro", label: "Erro", description: "Estado visual para falhas futuras." },
];

export const consultantNextSteps: ConsultantNextStep[] = [
  { id: "business-dna", title: "Escolher Business DNA™", description: "Definir o modelo operacional mais próximo da ideia." },
  { id: "template", title: "Selecionar Template", description: "Partir de uma base premium validada." },
  { id: "personalize", title: "Personalizar", description: "Ajustar módulos, textos, identidade e regras." },
  { id: "generate", title: "Gerar Projeto", description: "Materializar a estrutura técnica na próxima etapa." },
  { id: "publish", title: "Publicar", description: "Preparar entrega Web, Android ou iOS." },
];

export const placeholderConsultantResponse: ConsultantResponseContract = {
  id: "placeholder-consultant-response",
  status: "resposta_recebida",
  summary:
    "Com base na ideia informada, a recomendação inicial é começar por um Business DNA™ validado, escolher um template premium compatível e personalizar a operação antes da geração do projeto.",
  recommendation: {
    businessDnaSlug: "placeholder",
    businessDnaName: "Business DNA™ recomendado",
    templateSlugs: [],
    templateNames: ["Template Premium recomendado", "Template relacionado"],
    suggestedPlan: "Plano Professional",
    estimatedTime: "7 a 14 dias",
    includedResources: [
      "Business DNA™ configurado",
      "Template premium base",
      "Módulos essenciais",
      "Painel administrativo",
      "Publicação assistida",
    ],
  },
  nextSteps: consultantNextSteps,
  integrationNotes: [
    "Substituir este contrato por resposta de orquestrador backend-only.",
    "Persistir histórico apenas após validação de tenant e RLS.",
    "Registrar logs sem dados sensíveis.",
    "Enviar recomendações para Business Studio e Marketplace.",
  ],
};
