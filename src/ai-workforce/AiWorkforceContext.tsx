import { mockExecutionResults, mockWorkflow } from "@/src/ai-orchestration/mocks";
import { aiWorkers, aiWorkerTasks, aiWorkforceAnalytics } from "@/src/ai-workforce/mock";
import type { AiWorkforceContextValue } from "@/src/ai-workforce/types";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

const AiWorkforceContext = createContext<AiWorkforceContextValue | null>(null);

export function AiWorkforceProvider({ children }: { children: ReactNode }) {
  const [selectedWorkerId, setSelectedWorkerId] = useState(aiWorkers[0].id);

  const getWorkerById = useCallback((workerId: string) => aiWorkers.find((worker) => worker.id === workerId), []);

  const value = useMemo<AiWorkforceContextValue>(
    () => ({
      workers: aiWorkers,
      tasks: aiWorkerTasks,
      analytics: aiWorkforceAnalytics,
      orchestrationWorkflow: mockWorkflow,
      orchestrationResults: mockExecutionResults,
      selectedWorkerId,
      setSelectedWorkerId,
      getWorkerById,
    }),
    [getWorkerById, selectedWorkerId],
  );

  return <AiWorkforceContext.Provider value={value}>{children}</AiWorkforceContext.Provider>;
}

export function useAiWorkforce() {
  const context = useContext(AiWorkforceContext);
  if (!context) {
    throw new Error("useAiWorkforce must be used inside AiWorkforceProvider");
  }
  return context;
}
