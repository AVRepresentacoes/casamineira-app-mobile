import {
  aiCopilotActions,
  aiCopilotHistory,
  aiCopilotInsights,
  aiCopilotRecommendations,
} from "@/src/ai-copilot/mock";
import type { AiCopilotContextValue, AiCopilotState } from "@/src/ai-copilot/types";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

const AiCopilotContext = createContext<AiCopilotContextValue | null>(null);

export function AiCopilotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AiCopilotState>("idle");
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);

  const runMockAnalysis = useCallback(() => {
    setIsOpen(true);
    setState("thinking");
    globalThis.setTimeout(() => setState("typing"), 650);
    globalThis.setTimeout(() => setState("completed"), 1400);
  }, []);

  const value = useMemo<AiCopilotContextValue>(
    () => ({
      state,
      isOpen,
      recommendations: aiCopilotRecommendations,
      insights: aiCopilotInsights,
      actions: aiCopilotActions,
      history: aiCopilotHistory,
      open,
      close,
      toggle,
      setState,
      runMockAnalysis,
    }),
    [close, isOpen, open, runMockAnalysis, state, toggle],
  );

  return <AiCopilotContext.Provider value={value}>{children}</AiCopilotContext.Provider>;
}

export function useAiCopilot() {
  const context = useContext(AiCopilotContext);
  if (!context) {
    throw new Error("useAiCopilot must be used inside AiCopilotProvider");
  }
  return context;
}
