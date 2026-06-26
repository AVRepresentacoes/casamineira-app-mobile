import { getActiveRole, setActiveRole } from "@/lib/auth";
import { ensureCurrentUserTenantContext, getConfiguredTenantSlug, getCurrentTenantId } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const resolverRota = async () => {
      try {
        if (getConfiguredTenantSlug() === "hospedagens-caminhos-da-fe") {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            setRoute("/hospedagens");
            return;
          }

          let tenantId: string | null = null;
          try {
            tenantId = await ensureCurrentUserTenantContext();
          } catch {
            try {
              tenantId = await getCurrentTenantId();
            } catch {
              tenantId = null;
            }
          }

          let fornecedorQuery = supabase
            .from("profissionais")
            .select("fornecedor_ativo")
            .eq("user_id", session.user.id);

          if (tenantId) {
            fornecedorQuery = fornecedorQuery.eq("tenant_id", tenantId);
          }

          const { data: fornecedorData, error: fornecedorError } = await fornecedorQuery.maybeSingle();
          if (fornecedorError) {
            console.log("HOSPEDAGENS FORNECEDOR ROUTING ERROR:", fornecedorError.message);
          }

          if (Boolean((fornecedorData as { fornecedor_ativo?: boolean } | null)?.fornecedor_ativo)) {
            await setActiveRole("fornecedor");
            setRoute("/hospedagens/pousada");
            return;
          }

          await setActiveRole("cliente");
          setRoute("/hospedagens");
          return;
        }

        if (Platform.OS === "web") {
          setRoute("/login");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setRoute("/(auth)/login");
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

  if (!route) {
    return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  }

  return <Redirect href={route} />;
}
