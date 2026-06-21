import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  getMyEmpresaCommercialContext,
  getMyEmpresaOnboardingStatus,
  type EmpresaCommercialContext,
  type EmpresaOnboardingStatus,
} from "@/lib/saas-commercial";

export function useEmpresaCommercial() {
  const [commercial, setCommercial] = useState<EmpresaCommercialContext | null>(null);
  const [onboarding, setOnboarding] = useState<EmpresaOnboardingStatus | null>(null);
  const [loadingCommercial, setLoadingCommercial] = useState(true);

  const refreshCommercial = useCallback(async () => {
    try {
      setLoadingCommercial(true);
      const [commercialData, onboardingData] = await Promise.all([
        getMyEmpresaCommercialContext(),
        getMyEmpresaOnboardingStatus().catch(() => null),
      ]);
      setCommercial(commercialData);
      setOnboarding(onboardingData);
    } finally {
      setLoadingCommercial(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshCommercial();
    }, [refreshCommercial])
  );

  return {
    commercial,
    onboarding,
    loadingCommercial,
    refreshCommercial,
  };
}
