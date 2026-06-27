import { mockExecutionResults, mockWorkflow } from "@/src/ai-orchestration/mocks";
import { aiWorkers, aiWorkerTasks, aiWorkforceAnalytics } from "@/src/ai-workforce/mock";
import { BusinessProjectService } from "@/services/business-project";
import type { BusinessProject } from "@/src/business-project/types";
import type { AiWorkforceContextValue } from "@/src/ai-workforce/types";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AiWorkforceContext = createContext<AiWorkforceContextValue | null>(null);

export function AiWorkforceProvider({ children }: { children: ReactNode }) {
  const [selectedWorkerId, setSelectedWorkerId] = useState(aiWorkers[0].id);
  const [currentProject, setCurrentProject] = useState<BusinessProject | null>(null);

  const getWorkerById = useCallback((workerId: string) => aiWorkers.find((worker) => worker.id === workerId), []);

  useEffect(() => {
    let active = true;
    // TODO(Enterprise 008): preferir DigitalCompanyContext quando o provider estiver no layout autenticado.
    BusinessProjectService.getCurrent()
      .then((project) => {
        if (active) setCurrentProject(project);
      })
      .catch(() => {
        if (active) setCurrentProject(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AiWorkforceContextValue>(
    () => ({
      workers: aiWorkers,
      tasks: aiWorkerTasks,
      analytics: aiWorkforceAnalytics,
      currentProject,
      orchestrationWorkflow: mockWorkflow,
      orchestrationResults: mockExecutionResults,
      selectedWorkerId,
      setSelectedWorkerId,
      getWorkerById,
    }),
    [currentProject, getWorkerById, selectedWorkerId],
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
