export type AiProvider =
  | "backend-only"
  | "local-mock"
  | "openai"
  | "anthropic"
  | "google";

export type AiAgentRole =
  | "business_consultant"
  | "solution_architect"
  | "ux_ui_designer"
  | "frontend_engineer"
  | "backend_engineer"
  | "mobile_engineer"
  | "database_engineer"
  | "qa_engineer"
  | "devops_engineer"
  | "security_engineer"
  | "marketing_strategist"
  | "seo_specialist"
  | "copywriter"
  | "analytics_specialist"
  | "publishing_specialist"
  | "customer_success";

export type AiAgentStatus =
  | "idle"
  | "assigned"
  | "running"
  | "waiting_approval"
  | "completed"
  | "warning"
  | "error";

export type AiTaskType =
  | "blueprint_creation"
  | "project_review"
  | "business_dna_suggestion"
  | "module_generation"
  | "cost_analysis"
  | "publishing_analysis"
  | "marketing_analysis";

export type AiTaskPriority = "low" | "medium" | "high" | "critical";

export type AiApprovalState =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

export type AiWorkflowStatus =
  | "draft"
  | "ready"
  | "running"
  | "waiting_approval"
  | "completed"
  | "warning"
  | "error";

export interface AiModelConfig {
  provider: AiProvider;
  model: string;
  mode: "mock" | "backend-only";
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AiTokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  confidence: "low" | "medium" | "high";
}

export interface AiCostEstimate {
  currency: "BRL" | "USD";
  estimatedInputCost: number;
  estimatedOutputCost: number;
  estimatedTotalCost: number;
  pricingBasis: string;
}

export interface AiTask {
  id: string;
  title: string;
  description: string;
  type: AiTaskType;
  priority: AiTaskPriority;
  status: AiAgentStatus;
  requiredApproval: boolean;
  createdAtLabel: string;
  context: {
    projectId?: string;
    businessDna?: string;
    template?: string;
    module?: string;
  };
}

export interface AiAgent {
  id: string;
  name: string;
  role: AiAgentRole;
  status: AiAgentStatus;
  skills: string[];
  orchestrator: string;
  supportedTaskTypes: AiTaskType[];
}

export interface AiWorkflowStep {
  id: string;
  title: string;
  taskId: string;
  agentId: string;
  order: number;
  status: AiAgentStatus;
  approvalState: AiApprovalState;
  expectedOutput: string;
}

export interface AiWorkflow {
  id: string;
  name: string;
  objective: string;
  status: AiWorkflowStatus;
  approvalState: AiApprovalState;
  modelConfig: AiModelConfig;
  steps: AiWorkflowStep[];
}

export interface AiExecutionResult {
  id: string;
  workflowId: string;
  taskId: string;
  agentId: string;
  status: AiAgentStatus;
  summary: string;
  recommendations: string[];
  artifacts: string[];
  tokenEstimate: AiTokenEstimate;
  costEstimate: AiCostEstimate;
  approvalState: AiApprovalState;
  createdAtLabel: string;
}
