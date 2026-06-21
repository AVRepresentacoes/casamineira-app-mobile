import { useEmpresa } from "@/contexts/EmpresaContext";
import { useEffect, useState } from "react";
import { DEFAULT_BRANDING, loadBrandingConfig, type BrandingConfig } from "@/lib/branding";

export function useBranding() {
  const { empresa } = useEmpresa();
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [loadingBranding, setLoadingBranding] = useState(true);

  useEffect(() => {
    let mounted = true;

    void loadBrandingConfig()
      .then((config) => {
        if (!mounted) return;
        setBranding(config);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingBranding(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!empresa) return;

    setBranding((current) => ({
      ...current,
      tenantSlug: empresa.slug || current.tenantSlug,
      appName: empresa.nome_exibicao || empresa.nome || current.appName,
      slogan: empresa.descricao || current.slogan,
      primaryColor: empresa.cor_primaria || current.primaryColor,
      secondaryColor: empresa.cor_secundaria || current.secondaryColor,
      accentColor: current.accentColor,
      logoUrl: empresa.logo_url || current.logoUrl,
      supportWhatsapp: empresa.whatsapp || current.supportWhatsapp,
    }));
  }, [empresa]);

  return { branding, loadingBranding };
}
