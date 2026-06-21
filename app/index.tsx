import { MarketingLandingContent } from "@/components/site/MarketingLandingContent";
import { SiteShell } from "@/components/site/SiteShell";
import { getActiveRole } from "@/lib/auth";
import { getPublicSaasPlans } from "@/lib/saas-growth";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";
import { supabase } from "@/lib/supabase";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);
  const [plans, setPlans] = useState<SaasPlanoComercial[]>([]);

  useEffect(() => {
    const resolverRota = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (Platform.OS !== "web") {
            setRoute("/(auth)/login");
            return;
          }
          setRoute("site");
          return;
        }

        const { data: fornecedorData, error: fornecedorError } = await supabase
          .from("profissionais")
          .select("fornecedor_ativo")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (fornecedorError) {
          console.log("FORNECEDOR CHECK ROUTING ERROR:", fornecedorError);
        }

        const isFornecedor = Boolean(
          (fornecedorData as { fornecedor_ativo?: boolean } | null)?.fornecedor_ativo
        );
        if (isFornecedor) {
          setRoute("/(fornecedor)");
          return;
        }

        const activeRole = await getActiveRole();
        if (activeRole === "fornecedor") {
          setRoute("/(fornecedor)");
          return;
        }
        if (activeRole === "profissional") {
          setRoute("/(profissional)");
          return;
        }

        setRoute("/(tabs)/index");
      } catch (error) {
        console.log("ERRO ROUTING INICIAL:", error);
        setRoute("/(auth)/login");
      }
    };

    void resolverRota();
  }, []);

  useEffect(() => {
    if (route !== "site") return;
    getPublicSaasPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [route]);

  if (!route) {
    return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  }

  if (route === "site") {
    return (
      <SiteShell>
        <MarketingLandingContent plans={plans} />
      </SiteShell>
    );
  }

  return <Redirect href={route} />;
}
