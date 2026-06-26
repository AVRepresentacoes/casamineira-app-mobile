export type AiCopilotState = "idle" | "thinking" | "typing" | "completed" | "warning";

export interface AiRecommendation {
  id: string;
  title: string;
  description: string;
  tone: "success" | "info" | "warning";
}

export interface AiInsight {
  id: string;
  content: string;
  category: "Negócio" | "Arquitetura" | "Publicação" | "Crescimento";
}

export interface AiAction {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface AiConversation {
  id: string;
  role: "assistant" | "user" | "system";
  message: string;
  timestampLabel: string;
}

export interface AiCopilotContextValue {
  state: AiCopilotState;
  isOpen: boolean;
  recommendations: AiRecommendation[];
  insights: AiInsight[];
  actions: AiAction[];
  history: AiConversation[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setState: (state: AiCopilotState) => void;
  runMockAnalysis: () => void;
}
