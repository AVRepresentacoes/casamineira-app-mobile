import {
  mockAgents,
  mockExecutionResults,
  mockModelConfig,
  mockTasks,
  mockWorkflow,
} from "./mocks";
import type {
  AiAgent,
  AiCostEstimate,
  AiExecutionResult,
  AiModelConfig,
  AiTask,
  AiTokenEstimate,
  AiWorkflow,
} from "./types";

// Backend-only rule:
// real provider calls, API keys, prompts with sensitive context and model execution
// must live only in backend/server/edge functions. This frontend service is mock-only
// and exists only to prepare contracts and visual integration.

type CreateTaskInput = Pick<AiTask, "title" | "description" | "type"> &
  Partial<Omit<AiTask, "id" | "title" | "description" | "type">>;

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

function createTask(input: CreateTaskInput): AiTask {
  return {
    id: createId("task"),
    priority: input.priority ?? "medium",
    status: input.status ?? "assigned",
    requiredApproval: input.requiredApproval ?? true,
    createdAtLabel: input.createdAtLabel ?? "Agora",
    context: input.context ?? {},
    ...input,
  };
}

function assignAgent(task: AiTask, agents: AiAgent[] = mockAgents): AiAgent {
  return (
    agents.find((agent) => agent.supportedTaskTypes.includes(task.type)) ??
    agents[0]
  );
}

function estimateTokens(target: AiTask | AiWorkflow): AiTokenEstimate {
  const size =
    "steps" in target
      ? target.steps.length * 520 + target.objective.length * 4
      : target.description.length * 6 + target.title.length * 4;

  const inputTokens = Math.max(900, Math.round(size));
  const outputTokens = Math.round(inputTokens * 0.55);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    confidence: "medium",
  };
}

function estimateCost(
  tokenEstimate: AiTokenEstimate,
  modelConfig: AiModelConfig = mockModelConfig,
): AiCostEstimate {
  const multiplier = modelConfig.mode === "mock" ? 0.0003 : 0.0008;
  const estimatedInputCost = Number((tokenEstimate.inputTokens * multiplier).toFixed(2));
  const estimatedOutputCost = Number((tokenEstimate.outputTokens * multiplier * 2).toFixed(2));

  return {
    currency: "BRL",
    estimatedInputCost,
    estimatedOutputCost,
    estimatedTotalCost: Number((estimatedInputCost + estimatedOutputCost).toFixed(2)),
    pricingBasis: "Estimativa local mockada. Não representa cobrança real de provedor.",
  };
}

function requestHumanApproval(result: AiExecutionResult): AiExecutionResult {
  return {
    ...result,
    status: "waiting_approval",
    approvalState: "pending",
    recommendations: [
      ...result.recommendations,
      "Aguardar validação humana antes de executar build, publicação ou cobrança.",
    ],
  };
}

function generateMockResult(task: AiTask, agent = assignAgent(task)): AiExecutionResult {
  const tokenEstimate = estimateTokens(task);

  return {
    id: createId("result"),
    workflowId: mockWorkflow.id,
    taskId: task.id,
    agentId: agent.id,
    status: task.requiredApproval ? "waiting_approval" : "completed",
    summary: `${agent.name} preparou uma saída mockada para ${task.title}.`,
    recommendations: [
      "Usar Business DNA como base antes de qualquer geração sob demanda.",
      "Validar escopo, custo e publicação com aprovação humana.",
    ],
    artifacts: ["Contrato TypeScript", "Resumo visual", "Checklist mockado"],
    tokenEstimate,
    costEstimate: estimateCost(tokenEstimate),
    approvalState: task.requiredApproval ? "pending" : "not_required",
    createdAtLabel: "Agora",
  };
}

function simulateExecution(task: AiTask): AiExecutionResult {
  const agent = assignAgent(task);
  const result = generateMockResult(task, agent);

  return task.requiredApproval ? requestHumanApproval(result) : result;
}

function runWorkflow(workflow: AiWorkflow = mockWorkflow): AiExecutionResult[] {
  return workflow.steps.map((step) => {
    const existingResult = mockExecutionResults.find((result) => result.taskId === step.taskId);
    const task = mockTasks.find((item) => item.id === step.taskId);

    if (existingResult) {
      return existingResult;
    }

    return task
      ? simulateExecution(task)
      : generateMockResult({
          id: step.taskId,
          title: step.title,
          description: step.expectedOutput,
          type: "project_review",
          priority: "medium",
          status: "assigned",
          requiredApproval: true,
          createdAtLabel: "Agora",
          context: {},
        });
  });
}

export const aiOrchestrator = {
  createTask,
  assignAgent,
  runWorkflow,
  simulateExecution,
  estimateTokens,
  estimateCost,
  requestHumanApproval,
  generateMockResult,
};

export type AiOrchestrator = typeof aiOrchestrator;
