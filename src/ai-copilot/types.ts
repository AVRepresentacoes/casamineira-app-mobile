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

export interface AiCopilotRouteContext {
  route: string;
  area: "dashboard" | "studio" | "catalog" | "marketplace" | "projects" | "ai" | "review" | "generic";
  title: string;
  primaryMessage: string;
}

export interface AiCopilotContextValue {
  state: AiCopilotState;
  isOpen: boolean;
  routeContext: AiCopilotRouteContext;
  recommendations: AiRecommendation[];
  insights: AiInsight[];
  actions: AiAction[];
  history: AiConversation[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setRouteContext: (pathname: string) => void;
  setState: (state: AiCopilotState) => void;
  runMockAnalysis: () => void;
}
