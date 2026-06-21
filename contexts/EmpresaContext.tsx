import {
  ensureCurrentUserTenantContext,
  getMyEmpresaContext,
  getMyEmpresaSaasSubscription,
  type EmpresaContextRow,
  type EmpresaSaasSubscriptionRow,
} from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type EmpresaContextValue = {
  empresa: EmpresaContextRow | null;
  assinaturaSaas: EmpresaSaasSubscriptionRow | null;
  loadingEmpresa: boolean;
  refreshEmpresa: () => Promise<void>;
};

const EmpresaContext = createContext<EmpresaContextValue | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaContextRow | null>(null);
  const [assinaturaSaas, setAssinaturaSaas] = useState<EmpresaSaasSubscriptionRow | null>(null);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);

  const refreshEmpresa = useCallback(async () => {
    try {
      setLoadingEmpresa(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setEmpresa(null);
        setAssinaturaSaas(null);
        return;
      }

      await ensureCurrentUserTenantContext();
      const [empresaAtual, assinaturaAtual] = await Promise.all([
        getMyEmpresaContext(),
        getMyEmpresaSaasSubscription().catch(() => null),
      ]);
      setEmpresa(empresaAtual);
      setAssinaturaSaas(assinaturaAtual);
    } catch (error) {
      console.log("EMPRESA CONTEXT ERROR:", error);
      setEmpresa(null);
      setAssinaturaSaas(null);
    } finally {
      setLoadingEmpresa(false);
    }
  }, []);

  useEffect(() => {
    void refreshEmpresa();

    const { data } = supabase.auth.onAuthStateChange(() => {
      void refreshEmpresa();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refreshEmpresa]);

  const value = useMemo(
    () => ({
      empresa,
      assinaturaSaas,
      loadingEmpresa,
      refreshEmpresa,
    }),
    [empresa, assinaturaSaas, loadingEmpresa, refreshEmpresa]
  );

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error("useEmpresa deve ser usado dentro de EmpresaProvider.");
  }
  return context;
}
