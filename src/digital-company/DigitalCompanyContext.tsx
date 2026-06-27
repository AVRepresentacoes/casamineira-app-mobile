import { useEmpresa } from "@/contexts/EmpresaContext";
import { BusinessProjectService } from "@/services/business-project";
import type { BusinessProject } from "@/src/business-project/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DigitalCompanyService } from "./service";
import type { DigitalCompany, DigitalCompanyContextValue } from "./types";

const DigitalCompanyContext = createContext<DigitalCompanyContextValue | null>(null);

export function DigitalCompanyProvider({ children }: { children: ReactNode }) {
  const { empresa, assinaturaSaas, loadingEmpresa, refreshEmpresa } = useEmpresa();
  const [project, setProject] = useState<BusinessProject | null>(null);
  const [digitalCompany, setDigitalCompany] = useState<DigitalCompany | null>(null);
  const [loadingDigitalCompany, setLoadingDigitalCompany] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDigitalCompany = useCallback(async () => {
    try {
      setLoadingDigitalCompany(true);
      setError(null);
      await refreshEmpresa();
      const currentProject = await BusinessProjectService.getCurrent().catch(() => null);
      setProject(currentProject);
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Não foi possível atualizar a Digital Company™.";
      setError(message);
    } finally {
      setLoadingDigitalCompany(false);
    }
  }, [refreshEmpresa]);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      try {
        setLoadingDigitalCompany(true);
        setError(null);
        const currentProject = await BusinessProjectService.getCurrent().catch(() => null);
        if (active) setProject(currentProject);
      } catch (loadError) {
        if (active) {
          const message = loadError instanceof Error ? loadError.message : "Não foi possível carregar a Digital Company™.";
          setError(message);
        }
      } finally {
        if (active) setLoadingDigitalCompany(false);
      }
    }

    if (!loadingEmpresa && empresa) {
      void loadProject();
    } else if (!loadingEmpresa) {
      setProject(null);
      setDigitalCompany(null);
      setLoadingDigitalCompany(false);
    }

    return () => {
      active = false;
    };
  }, [empresa, loadingEmpresa]);

  useEffect(() => {
    if (!empresa) {
      setDigitalCompany(null);
      return;
    }

    setDigitalCompany(DigitalCompanyService.compose({ empresa, assinaturaSaas, project }));
  }, [assinaturaSaas, empresa, project]);

  const value = useMemo<DigitalCompanyContextValue>(
    () => ({
      digitalCompany,
      company: digitalCompany,
      currentProject: digitalCompany?.project || null,
      currentTenant: digitalCompany?.tenant || null,
      currentPlan: digitalCompany?.plan || null,
      progress: digitalCompany?.progress || null,
      modules: digitalCompany?.modules || [],
      status: digitalCompany?.status || null,
      isLoading: loadingDigitalCompany || loadingEmpresa,
      error,
      refresh: refreshDigitalCompany,
      empresaAtual: digitalCompany?.empresa || null,
      tenantAtual: digitalCompany?.tenant || null,
      projetoAtual: digitalCompany?.project || null,
      businessDnaAtual: digitalCompany?.businessDna || null,
      templateAtual: digitalCompany?.template || null,
      plano: digitalCompany?.billing || null,
      loadingDigitalCompany: loadingDigitalCompany || loadingEmpresa,
      refreshDigitalCompany,
    }),
    [digitalCompany, error, loadingDigitalCompany, loadingEmpresa, refreshDigitalCompany],
  );

  return <DigitalCompanyContext.Provider value={value}>{children}</DigitalCompanyContext.Provider>;
}

export function useDigitalCompany() {
  const context = useContext(DigitalCompanyContext);
  if (!context) {
    throw new Error("useDigitalCompany must be used inside DigitalCompanyProvider");
  }
  return context;
}
