import { setActiveRole } from "@/lib/auth";
import { getActiveSaasPlans, onboardMySaasEmpresa, type SaasPlanoComercial } from "@/lib/saas-commercial";
import { setTenantAtivo } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import { useBranding } from "@/hooks/useBranding";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function resolvePlanSlug(plan?: SaasPlanoComercial | null) {
  const directSlug = String(plan?.slug || "").trim().toLowerCase();
  if (directSlug) {
    return directSlug;
  }

  const normalizedName = String(plan?.nome || "").trim().toLowerCase();
  if (normalizedName.includes("starter")) return "starter";
  if (normalizedName.includes("growth") || normalizedName.includes("pro")) return "pro";
  if (normalizedName.includes("enterprise")) return "enterprise";
  return "";
}

export default function OnboardingEmpresaScreen() {
  const router = useRouter();
  const { branding } = useBranding();
  const logoSource = branding.logoUrl ? { uri: branding.logoUrl } : require("../../assets/images/icons/icon.png");

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SaasPlanoComercial[]>([]);

  const [empresaNome, setEmpresaNome] = useState("");
  const [segmento, setSegmento] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [empresaEmail, setEmpresaEmail] = useState("");
  const [adminNome, setAdminNome] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoadingPlans(true);
        const [{ data: sessionData }, plansData] = await Promise.all([
          supabase.auth.getSession(),
          getActiveSaasPlans(),
        ]);

        const sessionUser = sessionData.session?.user;
        if (sessionUser?.id) {
          setSessionUserId(sessionUser.id);
          setAdminEmail(sessionUser.email || "");
          setEmpresaEmail((current) => current || sessionUser.email || "");
          setAdminNome((current) => current || String(sessionUser.user_metadata?.name || ""));
        }

        setPlans(plansData);
        const preferredPlan = plansData.find((item) => resolvePlanSlug(item)) || plansData[0] || null;
        setSelectedPlanId(preferredPlan?.id || null);
      } catch (error: any) {
        Alert.alert("Erro", error?.message || "Não foi possível carregar o onboarding SaaS.");
      } finally {
        setLoadingPlans(false);
      }
    }

    void bootstrap();
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((item) => item.id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId]
  );

  if (Platform.OS !== "web") {
    return <Redirect href="/(auth)/login" />;
  }

  async function ensureAuthenticatedAdmin() {
    if (sessionUserId) {
      return sessionUserId;
    }

    const email = adminEmail.trim().toLowerCase();
    const password = senha.trim();

    if (!email || !password) {
      throw new Error("Informe email e senha do admin principal.");
    }

    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: adminNome.trim(),
          role: "profissional",
        },
      },
    });

    if (signUpResult.error) {
      const message = String(signUpResult.error.message || "");
      if (!message.toLowerCase().includes("already registered")) {
        throw new Error(message);
      }
    }

    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInResult.error || !signInResult.data.user) {
      throw new Error(signInResult.error?.message || "Não foi possível autenticar o admin da empresa.");
    }

    setSessionUserId(signInResult.data.user.id);
    return signInResult.data.user.id;
  }

  async function handleSubmit() {
    const resolvedPlanSlug = resolvePlanSlug(selectedPlan);
    const adminEmailRequired = !sessionUserId;

    if (!empresaNome.trim() || !adminNome.trim() || (adminEmailRequired && !adminEmail.trim()) || !resolvedPlanSlug) {
      Alert.alert("Atenção", "Preencha empresa, admin principal, email e plano.");
      return;
    }

    if (!sessionUserId && !senha.trim()) {
      Alert.alert("Atenção", "Informe a senha do admin principal.");
      return;
    }

    try {
      setSaving(true);
      await ensureAuthenticatedAdmin();
      const onboarding = await onboardMySaasEmpresa({
        empresaNome: empresaNome.trim(),
        segmento: segmento.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        whatsapp: whatsapp.trim() || null,
        empresaEmail: empresaEmail.trim() || adminEmail.trim(),
        adminNome: adminNome.trim(),
        planoSlug: resolvedPlanSlug,
        trialDias: 14,
      });

      await setTenantAtivo(onboarding.tenant_slug);
      await setActiveRole("profissional");
      router.replace("/(profissional)/(internas)/dashboard-empresa");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível concluir o onboarding da empresa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Onboarding comercial"
      title="Ative sua empresa em um fluxo comercial separado do app e dos painéis."
      description="Cadastre a empresa, defina o plano inicial, habilite o período de teste e entre direto no painel da sua operação."
      highlights={[
        "Criação da empresa com tenant, plano inicial e período de teste",
        "Vinculação do admin principal sem alterar a lógica atual do fluxo",
        "Entrada comercial visualmente separada do produto operacional",
      ]}
      footerActionLabel="Voltar para login"
      onFooterAction={() => router.replace("/(auth)/login")}
    >
      <View style={styles.grid}>
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados da empresa</Text>
            <TextInput style={styles.input} value={empresaNome} onChangeText={setEmpresaNome} placeholder="Nome da empresa" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={segmento} onChangeText={setSegmento} placeholder="Segmento" placeholderTextColor="#64748b" />
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.rowInput]} value={cidade} onChangeText={setCidade} placeholder="Cidade" placeholderTextColor="#64748b" />
              <TextInput style={[styles.input, styles.rowInput]} value={estado} onChangeText={setEstado} placeholder="UF" placeholderTextColor="#64748b" />
            </View>
            <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp" placeholderTextColor="#64748b" />
            <TextInput
              style={styles.input}
              value={empresaEmail}
              onChangeText={setEmpresaEmail}
              placeholder="Email da empresa"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Admin principal</Text>
            <TextInput style={styles.input} value={adminNome} onChangeText={setAdminNome} placeholder="Nome do admin" placeholderTextColor="#64748b" />
            <TextInput
              style={styles.input}
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="Email do admin"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              editable={!sessionUserId}
            />
            {!sessionUserId ? (
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Senha"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            ) : (
              <Text style={styles.helper}>Sessão existente detectada. A empresa será ativada usando sua conta atual como admin principal.</Text>
            )}
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Plano inicial</Text>
            <Text style={styles.helper}>Todos os novos tenants entram com 14 dias de teste e podem ajustar o plano depois.</Text>
            {loadingPlans ? (
              <ActivityIndicator color="#facc15" />
            ) : (
              <View style={styles.planList}>
                {plans.map((plan) => {
                  const active = selectedPlanId === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[styles.planCard, active ? styles.planCardActive : null]}
                      onPress={() => setSelectedPlanId(plan.id)}
                    >
                      <View style={styles.planHeader}>
                        <Text style={[styles.planTitle, active ? styles.planTitleActive : null]}>{plan.nome}</Text>
                        <Text style={[styles.planPrice, active ? styles.planTitleActive : null]}>R$ {Number(plan.valor || 0).toFixed(2)}</Text>
                      </View>
                      <Text style={styles.planDescription}>{plan.descricao}</Text>
                      <Text style={styles.planMeta}>
                        Usuários {plan.limite_usuarios ?? "ilimitado"} • Profissionais {plan.limite_profissionais ?? "ilimitado"} • Pedidos/mês {plan.limite_pedidos_mes ?? "ilimitado"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryEyebrow}>Ativação</Text>
            <Text style={styles.summaryTitle}>Criar empresa e iniciar teste</Text>
            <Text style={styles.summaryBody}>
              Ao concluir, a empresa será criada, o contexto do tenant será ativado e você seguirá direto para o painel da empresa.
            </Text>
            <TouchableOpacity style={[styles.button, saving ? styles.disabled : null]} onPress={() => void handleSubmit()} disabled={saving || loadingPlans}>
              {saving ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>Criar empresa e iniciar trial</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    gap: 18,
  },
  card: {
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    color: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  helper: {
    color: "#94a3b8",
    lineHeight: 22,
  },
  planList: {
    gap: 12,
    marginTop: 14,
  },
  planCard: {
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  planCardActive: {
    borderColor: "rgba(250, 204, 21, 0.45)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  planTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
  },
  planTitleActive: {
    color: "#f8fafc",
  },
  planPrice: {
    color: "#facc15",
    fontWeight: "900",
  },
  planDescription: {
    color: "#cbd5e1",
    marginTop: 8,
    lineHeight: 20,
  },
  planMeta: {
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "rgba(250, 204, 21, 0.10)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.26)",
    gap: 14,
  },
  summaryEyebrow: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryBody: {
    color: "#e2e8f0",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#020617",
    fontWeight: "900",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.7,
  },
});
