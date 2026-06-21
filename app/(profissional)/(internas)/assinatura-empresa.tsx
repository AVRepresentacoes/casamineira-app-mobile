import { useEmpresa } from "@/contexts/EmpresaContext";
import { useBranding } from "@/hooks/useBranding";
import { useEmpresaCommercial } from "@/hooks/useEmpresaCommercial";
import {
  changeCurrentEmpresaPlan,
  getActiveSaasPlans,
  previewCurrentEmpresaPlanChange,
  type SaasPlanoComercial,
} from "@/lib/saas-commercial";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COMPANY_ADMIN_ROLES = ["owner", "admin", "admin_empresa"];

export default function AssinaturaEmpresaScreen() {
  const router = useRouter();
  const { empresa } = useEmpresa();
  const { branding } = useBranding();
  const { commercial, onboarding, loadingCommercial, refreshCommercial } = useEmpresaCommercial();
  const [plans, setPlans] = useState<SaasPlanoComercial[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);

  const canManage = COMPANY_ADMIN_ROLES.includes(String(empresa?.role || ""));

  const supportHref = useMemo(() => {
    if (branding.supportWhatsapp) {
      const digits = String(branding.supportWhatsapp).replace(/\D/g, "");
      if (digits) {
        return `https://wa.me/${digits}?text=${encodeURIComponent("Quero falar com o comercial sobre o plano SaaS da minha empresa.")}`;
      }
    }
    return "mailto:suporte@casamineira.app?subject=Upgrade%20SaaS";
  }, [branding.supportWhatsapp]);

  const loadPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const data = await getActiveSaasPlans();
      setPlans(data);
    } catch (error) {
      console.log("ASSINATURA EMPRESA PLANOS ERROR:", error);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans])
  );

  async function handlePlanChange(planId: string) {
    try {
      setUpgradingPlanId(planId);
      const preview = await previewCurrentEmpresaPlanChange(planId);
      if (!preview.can_apply) {
        Alert.alert("Downgrade bloqueado", preview.motivo || "Ajuste o uso da empresa antes de trocar o plano.");
        return;
      }

      await changeCurrentEmpresaPlan(planId);
      await refreshCommercial();
      Alert.alert("Plano atualizado", "A assinatura SaaS da empresa foi atualizada.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar o plano da empresa.");
    } finally {
      setUpgradingPlanId(null);
    }
  }

  async function falarComSuporte() {
    const supported = await Linking.canOpenURL(supportHref);
    if (!supported) {
      Alert.alert("Suporte", "Não foi possível abrir o contato comercial.");
      return;
    }
    await Linking.openURL(supportHref);
  }

  if (!canManage) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Acesso restrito</Text>
        <Text style={styles.emptyText}>Somente o admin da empresa pode gerenciar a assinatura SaaS.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loadingCommercial} onRefresh={() => void refreshCommercial()} tintColor="#facc15" />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Comercial SaaS</Text>
        <Text style={styles.title}>{empresa?.nome_exibicao || empresa?.nome || "Sua empresa"}</Text>
        <Text style={styles.subtitle}>
          Plano {commercial?.plano_nome || "Sem plano"} • status {commercial?.assinatura_status || "indefinido"}
        </Text>
        {commercial?.trial_ativo ? (
          <View style={styles.trialBadge}>
            <Ionicons name="time-outline" size={14} color="#020617" />
            <Text style={styles.trialBadgeText}>
              Trial até {commercial.trial_fim ? new Date(commercial.trial_fim).toLocaleDateString("pt-BR") : "sem data"}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <UsageCard label="Usuários" value={`${commercial?.usuarios_usados ?? 0} de ${commercial?.limite_usuarios ?? "ilimitado"}`} />
        <UsageCard label="Profissionais" value={`${commercial?.profissionais_usados ?? 0} de ${commercial?.limite_profissionais ?? "ilimitado"}`} />
        <UsageCard label="Pedidos/mês" value={`${commercial?.pedidos_mes_usados ?? 0} de ${commercial?.limite_pedidos_mes ?? "ilimitado"}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recursos do plano</Text>
        <FeatureRow icon="color-palette-outline" label="White-label" enabled={Boolean(commercial?.white_label)} />
        <FeatureRow icon="bar-chart-outline" label="Relatórios" enabled={Boolean(commercial?.acesso_relatorios)} />
        <FeatureRow icon="wallet-outline" label="Financeiro avançado" enabled={Boolean(commercial?.acesso_financeiro_avancado)} />
        <FeatureRow icon="headset-outline" label="Suporte prioritário" enabled={Boolean(commercial?.suporte_prioritario)} />
        {commercial?.assinatura_bloqueada ? (
          <Text style={styles.warningText}>A assinatura está bloqueada. Regularize ou troque de plano para manter a operação liberada.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ativação inicial</Text>
        <ChecklistRow label="Marca configurada" done={Boolean(onboarding?.branding_ok)} />
        <ChecklistRow label="WhatsApp configurado" done={Boolean(onboarding?.whatsapp_ok)} />
        <ChecklistRow label="Primeiro profissional" done={Boolean(onboarding?.tem_profissional)} />
        <ChecklistRow label="Primeiro cliente" done={Boolean(onboarding?.tem_cliente)} />
        <ChecklistRow label="Primeiro pedido" done={Boolean(onboarding?.tem_pedido)} />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(profissional)/(internas)/empresa")}>
          <Text style={styles.secondaryButtonText}>Completar setup da empresa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planos disponíveis</Text>
        {loadingPlans ? (
          <ActivityIndicator color="#facc15" />
        ) : (
          <View style={styles.planList}>
            {plans.map((plan) => {
              const active = commercial?.plano_id === plan.id;
              return (
                <View key={plan.id} style={[styles.planCard, active ? styles.planCardActive : null]}>
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={[styles.planTitle, active ? styles.planTitleActive : null]}>{plan.nome}</Text>
                      <Text style={styles.planDescription}>{plan.descricao}</Text>
                    </View>
                    <Text style={[styles.planPrice, active ? styles.planTitleActive : null]}>R$ {Number(plan.valor || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.planMeta}>
                    Usuários {plan.limite_usuarios ?? "ilimitado"} • Profissionais {plan.limite_profissionais ?? "ilimitado"} • Pedidos/mês{" "}
                    {plan.limite_pedidos_mes ?? "ilimitado"}
                  </Text>
                  <Text style={styles.planMeta}>
                    White-label {plan.white_label ? "liberado" : "bloqueado"} • Relatórios {plan.acesso_relatorios ? "liberados" : "bloqueados"}
                  </Text>
                  <TouchableOpacity
                    style={[active ? styles.ghostButton : styles.primaryButton, upgradingPlanId === plan.id ? styles.disabled : null]}
                    onPress={() => void handlePlanChange(plan.id)}
                    disabled={Boolean(upgradingPlanId)}
                  >
                    {upgradingPlanId === plan.id ? (
                      <ActivityIndicator color={active ? "#facc15" : "#020617"} />
                    ) : (
                      <Text style={active ? styles.ghostButtonText : styles.primaryButtonText}>
                        {active ? "Plano atual" : "Fazer upgrade ou downgrade"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => void falarComSuporte()}>
          <Text style={styles.secondaryButtonText}>Falar com suporte/comercial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(profissional)/(internas)/empresa")}>
          <Text style={styles.secondaryButtonText}>Ativar white-label</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.usageCard}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{value}</Text>
    </View>
  );
}

function FeatureRow({ icon, label, enabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; enabled: boolean }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={18} color={enabled ? "#22c55e" : "#64748b"} />
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={[styles.featureStatus, enabled ? styles.featureEnabled : styles.featureBlocked]}>
        {enabled ? "Liberado" : "Upgrade necessário"}
      </Text>
    </View>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={18} color={done ? "#22c55e" : "#64748b"} />
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={[styles.featureStatus, done ? styles.featureEnabled : styles.featureBlocked]}>
        {done ? "Concluído" : "Pendente"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    gap: 14,
  },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },
  hero: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 8,
  },
  trialBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  trialBadgeText: {
    color: "#020617",
    fontWeight: "800",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  usageCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  usageLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  usageValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  featureLabel: {
    color: "#fff",
    flex: 1,
    fontWeight: "700",
  },
  featureStatus: {
    fontSize: 12,
    fontWeight: "800",
  },
  featureEnabled: {
    color: "#22c55e",
  },
  featureBlocked: {
    color: "#f59e0b",
  },
  warningText: {
    color: "#f59e0b",
    marginTop: 8,
    lineHeight: 20,
  },
  planList: {
    gap: 12,
  },
  planCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  planCardActive: {
    borderColor: "#facc15",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  planTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  planTitleActive: {
    color: "#facc15",
  },
  planDescription: {
    color: "#94a3b8",
    marginTop: 6,
    maxWidth: 220,
  },
  planPrice: {
    color: "#fff",
    fontWeight: "900",
  },
  planMeta: {
    color: "#cbd5e1",
    marginTop: 8,
    lineHeight: 18,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#facc15",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: {
    color: "#020617",
    fontWeight: "900",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#facc15",
    fontWeight: "800",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  ghostButtonText: {
    color: "#facc15",
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.7,
  },
});
