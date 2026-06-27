import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EnterpriseIntelligenceService } from "./service";
import type { EnterpriseIntelligenceContextValue, EnterpriseIntelligenceFabric } from "./types";

const EnterpriseIntelligenceContext = createContext<EnterpriseIntelligenceContextValue | null>(null);

export function EnterpriseIntelligenceProvider({ children }: { children: ReactNode }) {
  const [fabric, setFabric] = useState<EnterpriseIntelligenceFabric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const currentFabric = await EnterpriseIntelligenceService.getCurrent();
      setFabric(currentFabric);
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Não foi possível carregar o Enterprise Intelligence Fabric™.";
      setError(message);
      setFabric(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<EnterpriseIntelligenceContextValue>(
    () => ({
      fabric,
      digitalCompany: fabric?.digitalCompany || null,
      status: fabric?.status || null,
      readiness: fabric?.readiness || null,
      analytics: fabric?.analytics || null,
      deploys: fabric?.deploys || [],
      aiAgents: fabric?.aiAgents || [],
      recommendations: fabric?.strategicRecommendations || [],
      isLoading,
      error,
      refresh,
    }),
    [error, fabric, isLoading, refresh],
  );

  return <EnterpriseIntelligenceContext.Provider value={value}>{children}</EnterpriseIntelligenceContext.Provider>;
}

export function useEnterpriseIntelligence() {
  const context = useContext(EnterpriseIntelligenceContext);
  if (!context) {
    throw new Error("useEnterpriseIntelligence must be used inside EnterpriseIntelligenceProvider");
  }
  return context;
}
