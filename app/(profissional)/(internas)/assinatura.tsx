import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PROFESSIONAL_SUBSCRIPTION_PLANS,
  loadProfessionalSubscriptionContext,
  updateProfessionalSubscriptionTier,
  type ProfessionalSubscriptionTier,
  type ProfessionalSubscriptionContext,
} from "@/lib/pro-subscription";
import { supabase } from "@/lib/supabase";

type Plano = {
  id: string;
  nome: string;
  preco: string;
  periodo: string;
  comissao: string;
  comissaoRate: number;
  descricao: string;
  destaque?: boolean;
  selo?: string;
  beneficios: string[];
  cta: string;
  insight: string;
};

const EXEMPLO_VENDA = 500;

const PLANOS: Plano[] = [
  {
    id: "starter",
    nome: "Starter PRO",
    preco: "R$ 29,90",
    periodo: "/mês",
    comissao: "20% de comissão",
    comissaoRate: 20,
    descricao: "Entrada premium para ganhar mais visibilidade e profissionalizar sua operação.",
    selo: "Entrada estratégica",
    beneficios: [
      "Prioridade inicial na distribuição de pedidos",
      "Selo profissional no perfil",
      "Métricas essenciais de performance",
      "Acesso a campanhas promocionais selecionadas",
    ],
    cta: "Começar no Starter",
    insight: "Ideal para subir de nível sem aumentar muito o custo fixo.",
  },
  {
    id: "pro",
    nome: "Pro Performance",
    preco: "R$ 79,90",
    periodo: "/mês",
    comissao: "15% de comissão",
    comissaoRate: 15,
    descricao: "Plano recomendado para profissionais que querem crescer com mais previsibilidade comercial.",
    destaque: true,
    selo: "Mais escolhido",
    beneficios: [
      "Prioridade forte na vitrine e nos pedidos elegíveis",
      "Destaque comercial no ranking profissional",
      "Analytics e crescimento com leitura avançada",
      "Maior exposição em oportunidades premium",
      "Recursos de operação e posicionamento avançado",
    ],
    cta: "Assinar Pro Performance",
    insight: "Melhor equilíbrio entre custo, autoridade e volume de oportunidades.",
  },
  {
    id: "elite",
    nome: "Elite Black",
    preco: "R$ 149,90",
    periodo: "/mês",
    comissao: "8% de comissão",
    comissaoRate: 8,
    descricao: "Modelo enterprise para quem quer dominar posicionamento, reputação e captação.",
    selo: "Máxima autoridade",
    beneficios: [
      "Máxima prioridade nas oportunidades qualificadas",
      "Selo elite com apelo premium no perfil",
      "Leituras estratégicas e inteligência ampliada",
      "Maior evidência para clientes de alto valor",
      "Acesso prioritário a recursos premium futuros",
    ],
    cta: "Ir para Elite Black",
    insight: "Pensado para quem quer operar no topo da percepção de valor.",
  },
];

const COMPARATIVO = [
  { feature: "Comissão por venda", starter: "20%", pro: "15%", elite: "8%" },
  { feature: "Prioridade nos pedidos", starter: "Boa", pro: "Alta", elite: "Máxima" },
  { feature: "Destaque no ranking", starter: "Base", pro: "Forte", elite: "Elite" },
  { feature: "Analytics e crescimento", starter: "Essencial", pro: "Avançado", elite: "Completo" },
  { feature: "Exposição comercial", starter: "Melhorada", pro: "Premium", elite: "Dominante" },
];

export default function Assinatura() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    loadProfessionalSubscriptionContext().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  const planoAtualLabel = useMemo(
    () => (subscription ? PROFESSIONAL_SUBSCRIPTION_PLANS[subscription.tier].label : PLANOS[1].nome),
    [subscription],
  );
  const planoAtualPreco = useMemo(
    () => (subscription ? PROFESSIONAL_SUBSCRIPTION_PLANS[subscription.tier].priceLabel : `${PLANOS[1].preco}${PLANOS[1].periodo}`),
    [subscription],
  );
  const planoAtualComissao = useMemo(
    () => (subscription ? PROFESSIONAL_SUBSCRIPTION_PLANS[subscription.tier].commissionLabel : PLANOS[1].comissao),
    [subscription],
  );
  const planoAtualSimulacao = useMemo(() => {
    const commissionRate = subscription ? PROFESSIONAL_SUBSCRIPTION_PLANS[subscription.tier].commissionRate : PLANOS[1].comissaoRate;
    const plataforma = Number((EXEMPLO_VENDA * (commissionRate / 100)).toFixed(2));
    const profissional = Number((EXEMPLO_VENDA - plataforma).toFixed(2));

    return { plataforma, profissional };
  }, [subscription]);

  const selecionarPlano = (plano: Plano) => {
    const tier = plano.id as ProfessionalSubscriptionTier;
    const isCurrentPlan = subscription?.tier === tier;

    if (isCurrentPlan) {
      Alert.alert("Plano atual", `Sua conta já está no plano ${plano.nome}.`);
      return;
    }

    Alert.alert(
      "Confirmar alteração",
      `Deseja ativar o plano ${plano.nome} agora?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ativar plano",
          onPress: async () => {
            try {
              setProcessingPlanId(plano.id);
              const updated = await updateProfessionalSubscriptionTier(tier);
              setSubscription(updated);
              Alert.alert("Plano atualizado", `${plano.nome} ativado com sucesso na sua conta.`);
            } catch (error: any) {
              Alert.alert("Erro", error?.message || "Não foi possível atualizar sua assinatura agora.");
            } finally {
              setProcessingPlanId(null);
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="diamond-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>Assinaturas PRO</Text>
            <Text style={styles.sub}>Escolha o plano certo para acelerar reputação, visibilidade e conversão.</Text>
          </View>
        </View>

        <View style={styles.heroSignal}>
          <Ionicons name="sparkles-outline" size={15} color="#facc15" />
          <Text style={styles.heroSignalText}>Profissionais com posicionamento premium tendem a gerar mais confiança e mais propostas qualificadas.</Text>
        </View>
      </View>

      <View style={styles.currentPlanCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plano atual</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Ativo</Text>
          </View>
        </View>
        <Text style={styles.currentPlanName}>{planoAtualLabel}</Text>
        <Text style={styles.currentPlanMeta}>Conta: {user.email}</Text>
        <Text style={styles.currentPlanMeta}>Faixa atual: {planoAtualPreco}</Text>
        <Text style={styles.currentPlanMeta}>Comissão: {planoAtualComissao}</Text>
        <View style={styles.simulationCard}>
          <Text style={styles.simulationLabel}>Exemplo prático em uma venda de {formatMoney(EXEMPLO_VENDA)}</Text>
          <View style={styles.simulationRow}>
            <Text style={styles.simulationMeta}>Plataforma</Text>
            <Text style={styles.simulationMetaValue}>{formatMoney(planoAtualSimulacao.plataforma)}</Text>
          </View>
          <View style={styles.simulationRow}>
            <Text style={styles.simulationMeta}>Seu repasse</Text>
            <Text style={[styles.simulationMetaValue, styles.simulationMetaValueHighlight]}>
              {formatMoney(planoAtualSimulacao.profissional)}
            </Text>
          </View>
        </View>
        <Text style={styles.currentPlanHint}>Operação protegida com renovação controlada e upgrades disponíveis a qualquer momento.</Text>
      </View>

      <View style={styles.planGrid}>
        {PLANOS.map((plano) => (
          <View key={plano.id} style={[styles.planCard, plano.destaque ? styles.planCardFeatured : null]}>
            {plano.selo ? (
              <View style={[styles.planBadge, plano.destaque ? styles.planBadgeFeatured : null]}>
                <Text style={[styles.planBadgeText, plano.destaque ? styles.planBadgeTextFeatured : null]}>{plano.selo}</Text>
              </View>
            ) : null}

            {subscription?.tier === plano.id ? (
              <View style={styles.currentPlanPill}>
                <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                <Text style={styles.currentPlanPillText}>Plano ativo</Text>
              </View>
            ) : null}

            <Text style={styles.planName}>{plano.nome}</Text>
            <Text style={styles.planDescription}>{plano.descricao}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>{plano.preco}</Text>
              <Text style={styles.planPeriod}>{plano.periodo}</Text>
            </View>
            <View style={styles.commissionPill}>
              <Ionicons name="cash-outline" size={14} color="#0B0F1A" />
              <Text style={styles.commissionPillText}>{plano.comissao}</Text>
            </View>

            <View style={styles.planSimulationCard}>
              <Text style={styles.planSimulationTitle}>Simulação de repasse em {formatMoney(EXEMPLO_VENDA)}</Text>
              <View style={styles.planSimulationGrid}>
                <View style={styles.planSimulationMetric}>
                  <Text style={styles.planSimulationMetricLabel}>Plataforma</Text>
                  <Text style={styles.planSimulationMetricValue}>
                    {formatMoney(Number((EXEMPLO_VENDA * (plano.comissaoRate / 100)).toFixed(2)))}
                  </Text>
                </View>
                <View style={styles.planSimulationMetric}>
                  <Text style={styles.planSimulationMetricLabel}>Profissional</Text>
                  <Text style={[styles.planSimulationMetricValue, styles.planSimulationMetricValueHighlight]}>
                    {formatMoney(Number((EXEMPLO_VENDA * (1 - plano.comissaoRate / 100)).toFixed(2)))}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.benefitBlock}>
              {plano.beneficios.map((beneficio) => (
                <View key={`${plano.id}-${beneficio}`} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#facc15" />
                  <Text style={styles.benefitText}>{beneficio}</Text>
                </View>
              ))}
            </View>

            <View style={styles.insightStrip}>
              <Ionicons name="flash-outline" size={14} color="#facc15" />
              <Text style={styles.insightText}>{plano.insight}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.planButton,
                plano.destaque ? styles.planButtonFeatured : null,
                subscription?.tier === plano.id ? styles.planButtonCurrent : null,
                processingPlanId === plano.id ? styles.planButtonDisabled : null,
              ]}
              onPress={() => selecionarPlano(plano)}
              disabled={processingPlanId !== null}
            >
              {processingPlanId === plano.id ? (
                <ActivityIndicator color={plano.destaque ? "#0B0F1A" : "#000"} />
              ) : (
                <Text
                  style={[
                    styles.planButtonText,
                    plano.destaque ? styles.planButtonTextFeatured : null,
                    subscription?.tier === plano.id ? styles.planButtonTextCurrent : null,
                  ]}
                >
                  {subscription?.tier === plano.id ? "Plano ativo" : plano.cta}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.compareCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comparativo rápido</Text>
          <Text style={styles.sectionHint}>Decisão assistida</Text>
        </View>

        {COMPARATIVO.map((row, index) => (
          <View key={row.feature} style={[styles.compareRow, index > 0 ? styles.compareRowBorder : null]}>
            <Text style={styles.compareFeature}>{row.feature}</Text>
            <View style={styles.compareValues}>
              <Text style={styles.compareValue}>{row.starter}</Text>
              <Text style={[styles.compareValue, styles.compareValueHighlight]}>{row.pro}</Text>
              <Text style={styles.compareValue}>{row.elite}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.finalCard}>
        <Text style={styles.finalTitle}>Estruture seu crescimento como uma operação premium</Text>
        <Text style={styles.finalText}>
          O plano certo não vende sozinho, mas aumenta percepção de valor, fortalece autoridade e melhora sua posição nas oportunidades certas.
        </Text>
      </View>
    </ScrollView>
  );
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0F1A",
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    overflow: "hidden",
  },
  heroGlowA: {
    position: "absolute",
    top: -26,
    right: -16,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#facc1518",
  },
  heroGlowB: {
    position: "absolute",
    bottom: -60,
    left: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#38bdf810",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 25,
    fontWeight: "900",
  },
  sub: {
    color: "#9ca3af",
    marginTop: 4,
    lineHeight: 20,
  },
  heroSignal: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    padding: 12,
  },
  heroSignalText: {
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  currentPlanCard: {
    backgroundColor: "#081121",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  activeBadge: {
    backgroundColor: "#0f2d20",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadgeText: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 11,
  },
  currentPlanName: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 20,
  },
  currentPlanMeta: {
    color: "#cbd5e1",
    marginTop: 6,
  },
  currentPlanHint: {
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 20,
  },
  simulationCard: {
    marginTop: 12,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  simulationLabel: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
  },
  simulationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  simulationMeta: {
    color: "#94a3b8",
    fontSize: 12,
  },
  simulationMetaValue: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
  },
  simulationMetaValueHighlight: {
    color: "#facc15",
  },
  planGrid: {
    gap: 12,
  },
  planCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 12,
  },
  planCardFeatured: {
    borderColor: "#facc15",
    shadowColor: "#facc15",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  planBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#10203a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#304767",
  },
  planBadgeFeatured: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  planBadgeText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "900",
  },
  planBadgeTextFeatured: {
    color: "#0B0F1A",
  },
  currentPlanPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#166534",
    backgroundColor: "#0f2d20",
  },
  currentPlanPillText: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "900",
  },
  planName: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 22,
  },
  planDescription: {
    color: "#9ca3af",
    marginTop: 8,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 14,
    marginBottom: 14,
  },
  planPrice: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 28,
  },
  planPeriod: {
    color: "#cbd5e1",
    fontWeight: "700",
    marginBottom: 4,
  },
  commissionPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  commissionPillText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 12,
  },
  planSimulationCard: {
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  planSimulationTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 10,
  },
  planSimulationGrid: {
    flexDirection: "row",
    gap: 10,
  },
  planSimulationMetric: {
    flex: 1,
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 14,
    padding: 10,
  },
  planSimulationMetricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    marginBottom: 6,
  },
  planSimulationMetricValue: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 15,
  },
  planSimulationMetricValueHighlight: {
    color: "#facc15",
  },
  benefitBlock: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  benefitText: {
    color: "#e2e8f0",
    lineHeight: 20,
    flex: 1,
  },
  insightStrip: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 14,
    padding: 12,
  },
  insightText: {
    color: "#cbd5e1",
    lineHeight: 18,
    fontSize: 12,
    flex: 1,
  },
  planButton: {
    marginTop: 16,
    backgroundColor: "#facc15",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
  },
  planButtonFeatured: {
    backgroundColor: "#ffffff",
  },
  planButtonCurrent: {
    backgroundColor: "#0f2d20",
    borderWidth: 1,
    borderColor: "#166534",
  },
  planButtonDisabled: {
    opacity: 0.7,
  },
  planButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 15,
  },
  planButtonTextFeatured: {
    color: "#0B0F1A",
  },
  planButtonTextCurrent: {
    color: "#dcfce7",
  },
  compareCard: {
    backgroundColor: "#081121",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 12,
  },
  compareRow: {
    paddingVertical: 10,
    gap: 8,
  },
  compareRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#1f3353",
  },
  compareFeature: {
    color: "#f8fafc",
    fontWeight: "800",
    marginBottom: 6,
  },
  compareValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  compareValue: {
    flex: 1,
    textAlign: "center",
    color: "#cbd5e1",
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  compareValueHighlight: {
    color: "#0B0F1A",
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  finalCard: {
    backgroundColor: "#081121",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
  },
  finalTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  finalText: {
    color: "#94a3b8",
    lineHeight: 20,
  },
});
