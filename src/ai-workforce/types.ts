import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { AiExecutionResult, AiWorkflow } from "../ai-orchestration/types";

export type WorkerIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type WorkerStatus =
  | "Idle"
  | "Thinking"
  | "Working"
  | "Review"
  | "Waiting Approval"
  | "Completed"
  | "Warning"
  | "Error";

export interface WorkerSkill {
  id: string;
  name: string;
  level: "Core" | "Advanced" | "Expert";
}

export interface WorkerTask {
  id: string;
  title: string;
  column: "Backlog" | "Em andamento" | "Revisão" | "Concluído";
  priority: "Alta" | "Média" | "Baixa";
  ownerId: string;
}

export interface WorkerHistory {
  id: string;
  activity: string;
  timestampLabel: string;
}

export interface AiWorker {
  id: string;
  avatar: string;
  name: string;
  specialty: string;
  status: WorkerStatus;
  progress: number;
  lastActivity: string;
  nextTask: string;
  estimatedTime: string;
  icon: WorkerIconName;
  skills: WorkerSkill[];
  history: WorkerHistory[];
}

export interface AiWorkforceAnalytics {
  timeByAgent: Array<{ workerId: string; label: string; hours: number }>;
  productivity: number;
  estimatedCost: string;
  generatedSavings: string;
}

export interface AiWorkforceContextValue {
  workers: AiWorker[];
  tasks: WorkerTask[];
  analytics: AiWorkforceAnalytics;
  orchestrationWorkflow: AiWorkflow;
  orchestrationResults: AiExecutionResult[];
  selectedWorkerId: string;
  setSelectedWorkerId: (workerId: string) => void;
  getWorkerById: (workerId: string) => AiWorker | undefined;
}
