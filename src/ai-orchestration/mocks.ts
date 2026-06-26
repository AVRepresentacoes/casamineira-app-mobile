import type { AiRecommendation, AiInsight } from "../ai-copilot/types";
import type {
  AiAgent,
  AiExecutionResult,
  AiModelConfig,
  AiTask,
  AiWorkflow,
} from "./types";

export const mockModelConfig: AiModelConfig = {
  provider: "local-mock",
  model: "mock-orchestration-v1",
  mode: "mock",
  temperature: 0.2,
  maxOutputTokens: 1800,
};

export const mockAgents: AiAgent[] = [
  {
    id: "agent-business-consultant",
    name: "Business Consultant",
    role: "business_consultant",
    status: "assigned",
    skills: ["Business DNA", "posicionamento", "modelo de receita"],
    orchestrator: "aiOrchestrator",
    supportedTaskTypes: ["business_dna_suggestion", "cost_analysis"],
  },
  {
    id: "agent-solution-architect",
    name: "Solution Architect",
    role: "solution_architect",
    status: "running",
    skills: ["blueprint", "arquitetura", "módulos"],
    orchestrator: "aiOrchestrator",
    supportedTaskTypes: ["blueprint_creation", "module_generation", "project_review"],
  },
  {
    id: "agent-publishing-specialist",
    name: "Publishing Specialist",
    role: "publishing_specialist",
    status: "waiting_approval",
    skills: ["Android", "iOS", "Web", "checklist de publicação"],
    orchestrator: "aiOrchestrator",
    supportedTaskTypes: ["publishing_analysis", "project_review"],
  },
  {
    id: "agent-marketing-strategist",
    name: "Marketing Strategist",
    role: "marketing_strategist",
    status: "assigned",
    skills: ["Growth Center", "campanhas", "landing pages"],
    orchestrator: "aiOrchestrator",
    supportedTaskTypes: ["marketing_analysis", "cost_analysis"],
  },
];

export const mockTasks: AiTask[] = [
  {
    id: "task-blueprint",
    title: "Criar Project Blueprint™",
    description: "Organizar objetivo, arquitetura, módulos e cronograma do projeto.",
    type: "blueprint_creation",
    priority: "high",
    status: "assigned",
    requiredApproval: true,
    createdAtLabel: "Agora",
    context: { projectId: "business-project-demo", businessDna: "Clínica DNA™" },
  },
  {
    id: "task-review",
    title: "Revisar projeto antes da aprovação",
    description: "Validar módulos, integrações, permissões, riscos e plano recomendado.",
    type: "project_review",
    priority: "high",
    status: "waiting_approval",
    requiredApproval: true,
    createdAtLabel: "Agora",
    context: { projectId: "business-project-demo", template: "Clínica Premium" },
  },
  {
    id: "task-business-dna",
    title: "Sugerir Business DNA™",
    description: "Recomendar o DNA mais adequado com base no segmento e objetivo comercial.",
    type: "business_dna_suggestion",
    priority: "medium",
    status: "completed",
    requiredApproval: false,
    createdAtLabel: "Há 3 min",
    context: { projectId: "business-project-demo", businessDna: "Clínica DNA™" },
  },
  {
    id: "task-modules",
    title: "Gerar mapa de módulos",
    description: "Selecionar módulos essenciais para aplicativo, web, painel e automações.",
    type: "module_generation",
    priority: "medium",
    status: "running",
    requiredApproval: true,
    createdAtLabel: "Há 2 min",
    context: { projectId: "business-project-demo", module: "Agenda + Financeiro" },
  },
  {
    id: "task-cost",
    title: "Analisar custo estimado",
    description: "Projetar esforço, consumo de tokens futuro e custo operacional aproximado.",
    type: "cost_analysis",
    priority: "medium",
    status: "completed",
    requiredApproval: false,
    createdAtLabel: "Há 1 min",
    context: { projectId: "business-project-demo" },
  },
  {
    id: "task-publishing",
    title: "Analisar publicação",
    description: "Preparar checklist visual para Android, iOS e Web.",
    type: "publishing_analysis",
    priority: "medium",
    status: "assigned",
    requiredApproval: true,
    createdAtLabel: "Agora",
    context: { projectId: "business-project-demo" },
  },
  {
    id: "task-marketing",
    title: "Analisar marketing",
    description: "Recomendar páginas, campanhas e argumentos de venda para lançamento.",
    type: "marketing_analysis",
    priority: "low",
    status: "assigned",
    requiredApproval: false,
    createdAtLabel: "Agora",
    context: { projectId: "business-project-demo" },
  },
];

export const mockWorkflow: AiWorkflow = {
  id: "workflow-business-project-demo",
  name: "Orquestração Business Project™",
  objective: "Conectar Copilot, Workforce, Blueprint e Review Center em um fluxo aprovável.",
  status: "waiting_approval",
  approvalState: "pending",
  modelConfig: mockModelConfig,
  steps: mockTasks.map((task, index) => {
    const agent =
      mockAgents.find((item) => item.supportedTaskTypes.includes(task.type)) ?? mockAgents[0];

    return {
      id: `step-${index + 1}`,
      title: task.title,
      taskId: task.id,
      agentId: agent.id,
      order: index + 1,
      status: task.status,
      approvalState: task.requiredApproval ? "pending" : "not_required",
      expectedOutput: task.description,
    };
  }),
};

export const mockExecutionResults: AiExecutionResult[] = mockTasks.map((task, index) => ({
  id: `result-${task.id}`,
  workflowId: mockWorkflow.id,
  taskId: task.id,
  agentId:
    mockAgents.find((agent) => agent.supportedTaskTypes.includes(task.type))?.id ??
    "agent-business-consultant",
  status: task.status === "running" ? "running" : "completed",
  summary: `Resultado mockado para ${task.title.toLowerCase()}.`,
  recommendations: [
    "Manter aprovação humana antes de qualquer publicação.",
    "Priorizar templates e Business DNA antes de geração sob demanda.",
    index % 2 === 0
      ? "Reduzir escopo inicial para acelerar validação comercial."
      : "Registrar dependências para futura execução backend-only.",
  ],
  artifacts: ["Resumo executivo", "Checklist visual", "Contrato preparado para backend"],
  tokenEstimate: {
    inputTokens: 1200 + index * 140,
    outputTokens: 700 + index * 90,
    totalTokens: 1900 + index * 230,
    confidence: "medium",
  },
  costEstimate: {
    currency: "BRL",
    estimatedInputCost: 0.18 + index * 0.03,
    estimatedOutputCost: 0.42 + index * 0.04,
    estimatedTotalCost: 0.6 + index * 0.07,
    pricingBasis: "Estimativa visual mockada, sem chamada de provedor.",
  },
  approvalState: task.requiredApproval ? "pending" : "not_required",
  createdAtLabel: task.createdAtLabel,
}));

export const orchestrationCopilotRecommendations: AiRecommendation[] = [
  {
    id: "rec-orchestration-backend-only",
    title: "Manter IA backend-only",
    description:
      "A orquestração está preparada para mocks locais; provedores reais devem rodar em server/edge function.",
    tone: "warning",
  },
  {
    id: "rec-orchestration-approval",
    title: "Aprovação humana pendente",
    description:
      "Blueprint, módulos e publicação devem passar por aprovação antes de qualquer build real.",
    tone: "info",
  },
];

export const orchestrationCopilotInsights: AiInsight[] = [
  {
    id: "insight-orchestration-cost",
    category: "Arquitetura",
    content:
      "O fluxo mockado estima menor consumo quando Business DNA e template são escolhidos antes da personalização.",
  },
  {
    id: "insight-orchestration-workforce",
    category: "Negócio",
    content:
      "Consultor, arquiteto, publicação e marketing já compartilham o mesmo workflow mockado.",
  },
];
