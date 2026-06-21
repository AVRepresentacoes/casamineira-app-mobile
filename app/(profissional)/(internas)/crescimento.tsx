import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { supabase } from "@/lib/supabase";
import { loadProfessionalSubscriptionContext, type ProfessionalSubscriptionContext } from "@/lib/pro-subscription";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";

type Proposta = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  valor?: number | null;
};

type Contrato = {
  id: string;
  status?: string | null;
  created_at?: string | null;
};

type Pagamento = {
  id: string;
  created_at?: string | null;
  valor_profissional?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
};

type Avaliacao = {
  id: string;
  nota?: number | null;
};

type BaseItem = {
  id: string;
};

type GrowthState = {
  propostas: Proposta[];
  contratos: Contrato[];
  pagamentos: Pagamento[];
  avaliacoes: Avaliacao[];
  servicos: BaseItem[];
  portfolio: BaseItem[];
  pedidosDisponiveis: number;
  profissionalNome: string;
};

const INITIAL_STATE: GrowthState = {
  propostas: [],
  contratos: [],
  pagamentos: [],
  avaliacoes: [],
  servicos: [],
  portfolio: [],
  pedidosDisponiveis: 0,
  profissionalNome: "Profissional",
};

const MONTHS_TO_SHOW = 6;

function monthKey(dateLike: string | null | undefined) {
  const date = new Date(String(dateLike || new Date().toISOString()));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function money(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function getPaymentStatus(item: Pagamento) {
  return String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
}

function isPaid(item: Pagamento) {
  const status = getPaymentStatus(item);
  return status === "aprovada" || status === "pago";
}

function isPending(item: Pagamento) {
  const status = getPaymentStatus(item);
  return status === "pendente" || status === "aguardar_pagamento";
}

function getLastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
      shortLabel: current.toLocaleDateString("pt-BR", { month: "short" }),
      fullLabel: current.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  });
}

export default function CrescimentoProfissional() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [state, setState] = useState<GrowthState>(INITIAL_STATE);
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState(INITIAL_STATE);
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

      const [
        propostasRes,
        contratosRes,
        pagamentosRes,
        avaliacoesRes,
        servicosRes,
        pedidosRes,
        profileRes,
      ] = await Promise.all([
        tenantId
          ? supabase.from("propostas").select("id, status, created_at, valor").eq("profissional_id", user.id).eq("tenant_id", tenantId)
          : supabase.from("propostas").select("id, status, created_at, valor").eq("profissional_id", user.id),
        tenantId
          ? supabase.from("contratos").select("id, status, created_at").eq("profissional_id", user.id).eq("tenant_id", tenantId)
          : supabase.from("contratos").select("id, status, created_at").eq("profissional_id", user.id),
        tenantId
          ? supabase
              .from("pagamentos")
              .select("id, created_at, valor_profissional, status_pagamento, status_pagamentos")
              .eq("profissional_id", user.id)
              .eq("tenant_id", tenantId)
          : supabase
              .from("pagamentos")
              .select("id, created_at, valor_profissional, status_pagamento, status_pagamentos")
              .eq("profissional_id", user.id),
        tenantId
          ? supabase.from("avaliacoes").select("id, nota").eq("avaliado_id", user.id).eq("tenant_id", tenantId)
          : supabase.from("avaliacoes").select("id, nota").eq("avaliado_id", user.id),
        tenantId
          ? supabase.from("servicos").select("id").eq("user_id", user.id).eq("tenant_id", tenantId)
          : supabase.from("servicos").select("id").eq("user_id", user.id),
        tenantId
          ? supabase.from("pedidos").select("id", { count: "exact", head: true }).is("profissional_id", null).eq("tenant_id", tenantId)
          : supabase.from("pedidos").select("id", { count: "exact", head: true }).is("profissional_id", null),
        tenantId
          ? supabase.from("profiles").select("name, full_name, nome").eq("id", user.id).eq("tenant_id", tenantId).maybeSingle()
          : supabase.from("profiles").select("name, full_name, nome").eq("id", user.id).maybeSingle(),
      ]);

      let portfolioByUserQuery = supabase
        .from("portfolio")
        .select("id")
        .eq("user_id", user.id);

      if (tenantId) portfolioByUserQuery = portfolioByUserQuery.eq("tenant_id", tenantId);

      const { data: portfolioByUser, error: portfolioByUserError } = await portfolioByUserQuery;

      let portfolioData = portfolioByUser;
      if (portfolioByUserError) {
        let portfolioByProfissionalQuery = supabase
          .from("portfolio")
          .select("id")
          .eq("profissional_id", user.id);

        if (tenantId) portfolioByProfissionalQuery = portfolioByProfissionalQuery.eq("tenant_id", tenantId);

        const { data: portfolioByProfissional } = await portfolioByProfissionalQuery;
        portfolioData = portfolioByProfissional || [];
      }

      if (propostasRes.error) throw propostasRes.error;
      if (contratosRes.error) throw contratosRes.error;
      if (pagamentosRes.error) throw pagamentosRes.error;
      if (avaliacoesRes.error) throw avaliacoesRes.error;
      if (servicosRes.error) throw servicosRes.error;
      if (pedidosRes.error) throw pedidosRes.error;

      const profile = profileRes.data as Record<string, string | null> | null;

      setState({
        propostas: (propostasRes.data || []) as Proposta[],
        contratos: (contratosRes.data || []) as Contrato[],
        pagamentos: (pagamentosRes.data || []) as Pagamento[],
        avaliacoes: (avaliacoesRes.data || []) as Avaliacao[],
        servicos: (servicosRes.data || []) as BaseItem[],
        portfolio: (portfolioData || []) as BaseItem[],
        pedidosDisponiveis: Number(pedidosRes.count || 0),
        profissionalNome:
          String(profile?.name || profile?.full_name || profile?.nome || "Profissional"),
      });
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar crescimento.");
      setState(INITIAL_STATE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    loadProfessionalSubscriptionContext().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  const acceptedProposals = useMemo(
    () => state.propostas.filter((item) => item.status === "aceita"),
    [state.propostas],
  );
  const paidPayments = useMemo(
    () => state.pagamentos.filter((item) => isPaid(item)),
    [state.pagamentos],
  );
  const pendingPayments = useMemo(
    () => state.pagamentos.filter((item) => isPending(item)),
    [state.pagamentos],
  );
  const activeContracts = useMemo(
    () => state.contratos.filter((item) => item.status !== "cancelado"),
    [state.contratos],
  );
  const acceptedRate = useMemo(
    () => (state.propostas.length ? (acceptedProposals.length / state.propostas.length) * 100 : 0),
    [acceptedProposals.length, state.propostas.length],
  );
  const paidRevenue = useMemo(
    () => paidPayments.reduce((acc, item) => acc + Number(item.valor_profissional || 0), 0),
    [paidPayments],
  );
  const pendingRevenue = useMemo(
    () => pendingPayments.reduce((acc, item) => acc + Number(item.valor_profissional || 0), 0),
    [pendingPayments],
  );
  const averageTicket = useMemo(
    () => (paidPayments.length ? paidRevenue / paidPayments.length : 0),
    [paidPayments.length, paidRevenue],
  );
  const averageScore = useMemo(() => {
    if (!state.avaliacoes.length) return 0;
    const total = state.avaliacoes.reduce((acc, item) => acc + Number(item.nota || 0), 0);
    return total / state.avaliacoes.length;
  }, [state.avaliacoes]);
  const profileStrength = useMemo(() => {
    const serviceScore = Math.min(state.servicos.length * 18, 100);
    const portfolioScore = Math.min(state.portfolio.length * 20, 100);
    const reviewScore = Math.min(averageScore * 20, 100);
    const commercialScore = Math.min(acceptedRate * 1.5, 100);
    return Math.round((serviceScore + portfolioScore + reviewScore + commercialScore) / 4);
  }, [acceptedRate, averageScore, state.portfolio.length, state.servicos.length]);

  const months = useMemo(() => getLastMonths(MONTHS_TO_SHOW), []);
  const trendData = useMemo(() => {
    return months.map((month) => {
      const propostas = state.propostas.filter((item) => monthKey(item.created_at) === month.key).length;
      const aceites = state.propostas.filter(
        (item) => monthKey(item.created_at) === month.key && item.status === "aceita",
      ).length;
      const receita = state.pagamentos
        .filter((item) => monthKey(item.created_at) === month.key && isPaid(item))
        .reduce((acc, item) => acc + Number(item.valor_profissional || 0), 0);
      return { ...month, propostas, aceites, receita };
    });
  }, [months, state.pagamentos, state.propostas]);

  const maxProposalTrend = useMemo(
    () => Math.max(1, ...trendData.map((item) => item.propostas)),
    [trendData],
  );
  const maxRevenueTrend = useMemo(
    () => Math.max(1, ...trendData.map((item) => item.receita)),
    [trendData],
  );
  const totalPropostasPeriodo = useMemo(
    () => trendData.reduce((acc, item) => acc + item.propostas, 0),
    [trendData],
  );
  const totalAceitesPeriodo = useMemo(
    () => trendData.reduce((acc, item) => acc + item.aceites, 0),
    [trendData],
  );
  const totalReceitaPeriodo = useMemo(
    () => trendData.reduce((acc, item) => acc + item.receita, 0),
    [trendData],
  );
  const melhorMes = useMemo(() => {
    return trendData.reduce(
      (best, item) => (item.receita > best.receita ? item : best),
      trendData[0] || { key: "", shortLabel: "-", fullLabel: "-", propostas: 0, aceites: 0, receita: 0 },
    );
  }, [trendData]);

  const funnel = useMemo(
    () => [
      { label: "Propostas", value: state.propostas.length, tone: "#facc15" },
      { label: "Aceitas", value: acceptedProposals.length, tone: "#22c55e" },
      { label: "Contratos", value: activeContracts.length, tone: "#38bdf8" },
      { label: "Pagamentos", value: paidPayments.length, tone: "#e5e7eb" },
    ],
    [acceptedProposals.length, activeContracts.length, paidPayments.length, state.propostas.length],
  );
  const funnelMax = useMemo(() => Math.max(1, ...funnel.map((item) => item.value)), [funnel]);

  const scorecards = useMemo(
    () => [
      {
        label: "Força comercial",
        value: `${acceptedRate.toFixed(1)}%`,
        progress: Math.min(100, acceptedRate * 1.4),
        tone: "#22c55e",
      },
      {
        label: "Autoridade do perfil",
        value: `${profileStrength}/100`,
        progress: profileStrength,
        tone: "#facc15",
      },
      {
        label: "Qualidade percebida",
        value: `${averageScore.toFixed(1)}★`,
        progress: Math.min(100, averageScore * 20),
        tone: "#38bdf8",
      },
      {
        label: "Monetização pendente",
        value: money(pendingRevenue),
        progress: Math.min(100, pendingRevenue > 0 ? (pendingRevenue / Math.max(paidRevenue + pendingRevenue, 1)) * 100 : 0),
        tone: "#fb7185",
      },
    ],
    [acceptedRate, averageScore, paidRevenue, pendingRevenue, profileStrength],
  );

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((score) => {
        const count = state.avaliacoes.filter((item) => Number(item.nota || 0) === score).length;
        const pct = state.avaliacoes.length ? (count / state.avaliacoes.length) * 100 : 0;
        return { score, count, pct };
      }),
    [state.avaliacoes],
  );

  const opportunitySignals = useMemo(
    () => [
      { label: "Pedidos disponíveis agora", value: String(state.pedidosDisponiveis), tone: "#facc15" },
      { label: "Serviços publicados", value: String(state.servicos.length), tone: "#22c55e" },
      { label: "Projetos no portfólio", value: String(state.portfolio.length), tone: "#38bdf8" },
      { label: "Avaliações recebidas", value: String(state.avaliacoes.length), tone: "#e5e7eb" },
    ],
    [state.avaliacoes.length, state.pedidosDisponiveis, state.portfolio.length, state.servicos.length],
  );
  const growthUnlocked = subscription?.plan.features.growthDashboard ?? true;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            carregar();
          }}
          tintColor="#facc15"
        />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="trending-up-outline" size={22} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>Crescimento</Text>
          </View>
        </View>
        <Text style={[styles.heroHeadline, compact && styles.heroHeadlineCompact]}>
          Painel executivo de performance para {state.profissionalNome}.
        </Text>
        <Text style={styles.heroText}>
          Reunimos aquisição, conversão, reputação, monetização e capacidade operacional em um único cockpit para decisão rápida.
        </Text>
        <View style={styles.heroMetaRow}>
          <MetaChip icon="briefcase-outline" text={`${state.propostas.length} propostas no pipeline`} />
          <MetaChip icon="cash-outline" text={`${money(paidRevenue)} recebidos`} />
          <MetaChip icon="star-outline" text={`${averageScore.toFixed(1)} de reputação`} />
        </View>
      </View>

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <View style={styles.kpiGrid}>
        <KpiCard label="Receita recebida" value={money(paidRevenue)} tone="#22c55e" icon="cash-outline" compact={compact} />
        <KpiCard label="Taxa de aceite" value={`${acceptedRate.toFixed(1)}%`} tone="#facc15" icon="thumbs-up-outline" compact={compact} />
        <KpiCard label="Ticket médio" value={money(averageTicket)} tone="#38bdf8" icon="pricetag-outline" compact={compact} />
        <KpiCard label="Contratos ativos" value={String(activeContracts.length)} tone="#e5e7eb" icon="document-text-outline" compact={compact} />
      </View>

      {!growthUnlocked ? (
        <View style={styles.lockedPanel}>
          <SectionHeader title="Upgrade necessário" hint="Growth dashboard" />
          <Text style={styles.lockedTitle}>Seu plano atual libera apenas a leitura executiva inicial.</Text>
          <Text style={styles.lockedBody}>
            Para destravar radar de crescimento, tração mensal, mapa de oportunidade e direcionadores estratégicos, faça upgrade para Pro Performance ou Elite Black.
          </Text>
          <Text style={styles.lockedUpgradeButton} onPress={() => router.push("/(profissional)/(internas)/assinatura")}>
            Fazer upgrade de plano
          </Text>
        </View>
      ) : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Radar de crescimento" hint="Indicadores compostos" />
        <View style={styles.scoreGrid}>
          {scorecards.map((item) => (
            <ScoreCard
              key={item.label}
              label={item.label}
              value={item.value}
              progress={item.progress}
              tone={item.tone}
              compact={compact}
            />
          ))}
        </View>
      </View> : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Tração mensal" />
        <View style={[styles.tractionHero, compact && styles.tractionHeroCompact]}>
          <View style={styles.tractionSummary}>
            <Text style={styles.tractionEyebrow}>Janela analisada</Text>
            <Text style={styles.tractionHeadline}>Últimos 6 meses de aquisição, conversão e receita.</Text>
            <Text style={styles.tractionText}>
              Visual consolidado para acompanhar ritmo comercial, eficiência de fechamento e evolução monetária.
            </Text>
          </View>
          <View style={[styles.tractionHighlight, compact && styles.tractionHighlightCompact]}>
            <Text style={styles.tractionHighlightLabel}>Melhor mês</Text>
            <Text style={styles.tractionHighlightValue}>{melhorMes.shortLabel.replace(".", "")}</Text>
            <Text style={styles.tractionHighlightText}>{money(melhorMes.receita)}</Text>
          </View>
        </View>

        <View style={styles.tractionMetricRow}>
          <View style={styles.tractionMetricCard}>
            <Text style={styles.tractionMetricLabel}>Propostas no período</Text>
            <Text style={styles.tractionMetricValue}>{totalPropostasPeriodo}</Text>
          </View>
          <View style={styles.tractionMetricCard}>
            <Text style={styles.tractionMetricLabel}>Aceites no período</Text>
            <Text style={styles.tractionMetricValue}>{totalAceitesPeriodo}</Text>
          </View>
          <View style={styles.tractionMetricCard}>
            <Text style={styles.tractionMetricLabel}>Receita consolidada</Text>
            <Text style={styles.tractionMetricValue}>{money(totalReceitaPeriodo)}</Text>
          </View>
        </View>

        <View style={styles.tractionBoard}>
          <View style={styles.tractionBoardHeader}>
            <Text style={styles.tractionBoardTitle}>Receita x volume de propostas</Text>
            <Text style={styles.tractionBoardHint}>Leitura comparativa mensal</Text>
          </View>
          <View style={[styles.dualChart, compact && styles.dualChartCompact]}>
            {trendData.map((item) => {
              const isBestMonth = item.key === melhorMes.key && item.receita > 0;
              return (
                <View key={item.key} style={styles.barGroup}>
                  <View style={[styles.barTrack, compact && styles.barTrackCompact, isBestMonth && styles.barTrackHighlight]}>
                    <View style={[styles.bar, styles.barRevenue, compact && styles.barCompact, isBestMonth && styles.barRevenueHighlight, { height: `${(item.receita / maxRevenueTrend) * 100}%` }]} />
                    <View style={[styles.bar, styles.barProposal, compact && styles.barCompact, { height: `${(item.propostas / maxProposalTrend) * 100}%` }]} />
                  </View>
                  <Text style={[styles.barValue, isBestMonth && styles.barValueHighlight]}>
                    {item.receita > 0 ? `R$ ${Math.round(item.receita)}` : "R$ 0"}
                  </Text>
                  <Text style={[styles.barLabel, compact && styles.barLabelCompact, isBestMonth && styles.barLabelHighlight]}>
                    {item.shortLabel.replace(".", "")}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.chartLegend, compact && styles.chartLegendCompact]}>
            <LegendDot color="#38bdf8" label="Receita" />
            <LegendDot color="#facc15" label="Propostas" />
          </View>
        </View>
      </View> : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Funnel executivo" />
        {funnel.map((item) => (
          <View key={item.label} style={styles.funnelRow}>
            <View style={[styles.funnelHeader, compact && styles.funnelHeaderCompact]}>
              <Text style={styles.funnelLabel}>{item.label}</Text>
              <Text style={[styles.funnelValue, { color: item.tone }]}>{item.value}</Text>
            </View>
            <View style={styles.funnelTrack}>
              <View
                style={[
                  styles.funnelFill,
                  { width: `${(item.value / funnelMax) * 100}%`, backgroundColor: item.tone },
                ]}
              />
            </View>
          </View>
        ))}
      </View> : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Receita dos últimos meses" hint="Linha de tendência" />
        <View style={styles.lineChartCard}>
          <View style={[styles.lineChart, compact && styles.lineChartCompact]}>
            {trendData.map((item, index) => (
              <View key={item.key} style={styles.linePointCol}>
                {index < trendData.length - 1 ? (
                  <View
                    style={[
                      styles.lineConnector,
                      {
                        bottom: `${(item.receita / maxRevenueTrend) * 80 + 14}%`,
                      },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.linePoint,
                    {
                      bottom: `${(item.receita / maxRevenueTrend) * 80 + 6}%`,
                    },
                  ]}
                />
                <Text style={[styles.lineValue, compact && styles.lineValueCompact]}>
                  {item.receita > 0 ? Math.round(item.receita) : 0}
                </Text>
                <Text style={[styles.lineLabel, compact && styles.lineLabelCompact]}>{item.shortLabel.replace(".", "")}</Text>
              </View>
            ))}
          </View>
        </View>
      </View> : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Distribuição de reputação" hint="Qualidade percebida" />
        {distribution.map((item) => (
          <View key={item.score} style={styles.distRow}>
            <Text style={styles.distLabel}>{item.score}★</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: `${item.pct}%` }]} />
            </View>
            <Text style={styles.distCount}>{item.count}</Text>
          </View>
        ))}
      </View> : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Mapa de oportunidade" hint="Capacidade e mercado" />
        <View style={styles.signalGrid}>
          {opportunitySignals.map((item) => (
            <SignalCard key={item.label} label={item.label} value={item.value} tone={item.tone} compact={compact} />
          ))}
        </View>
      </View> : null}

      {growthUnlocked ? <View style={styles.panel}>
        <SectionHeader title="Direcionadores estratégicos" hint="Playbook recomendado" />
        <InsightRow
          title="Acelerar conversão"
          body="Suba taxa de aceite com propostas mais específicas e prazo de resposta mais curto nas oportunidades quentes."
        />
        <InsightRow
          title="Elevar ticket"
          body="Combine serviços, aumente profundidade do escopo e valorize entregáveis no portfólio para justificar preço superior."
        />
        <InsightRow
          title="Blindar reputação"
          body="Conclua contratos com comunicação ativa, agenda sem conflitos e fechamento documentado para sustentar nota alta."
        />
      </View> : null}
    </ScrollView>
  );
}

function MetaChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color="#facc15" />
      <Text style={styles.metaChipText}>{text}</Text>
    </View>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon,
  compact,
}: {
  label: string;
  value: string;
  tone: string;
  icon: keyof typeof Ionicons.glyphMap;
  compact: boolean;
}) {
  return (
    <View style={[styles.kpiCard, compact && styles.kpiCardCompact]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: `${tone}22` }]}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ScoreCard({
  label,
  value,
  progress,
  tone,
  compact,
}: {
  label: string;
  value: string;
  progress: number;
  tone: string;
  compact: boolean;
}) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, compact && styles.scoreValueCompact, { color: tone }]} numberOfLines={2}>
        {value}
      </Text>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function SignalCard({ label, value, tone, compact }: { label: string; value: string; tone: string; compact: boolean }) {
  return (
    <View style={[styles.signalCard, compact && styles.signalCardCompact]}>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={[styles.signalValue, compact && styles.signalValueCompact, { color: tone }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InsightRow({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020617" },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  heroGlow: {
    position: "absolute",
    top: -18,
    right: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#facc1514",
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1 },
  title: { color: "#f8fafc", fontWeight: "900", fontSize: 26 },
  heroHeadlineCompact: { fontSize: 19, lineHeight: 25 },
  heroHeadline: { color: "#ffffff", fontSize: 22, fontWeight: "900", marginBottom: 8 },
  heroText: { color: "#94a3b8", lineHeight: 20, fontSize: 13 },
  heroMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  metaChipText: { color: "#e2e8f0", fontSize: 12, fontWeight: "700", flexShrink: 1 },
  error: { color: "#f87171", marginBottom: 12, fontWeight: "700" },
  lockedPanel: {
    backgroundColor: "#081121",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 14,
  },
  lockedTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
  },
  lockedBody: {
    color: "#94a3b8",
    lineHeight: 20,
    fontSize: 13,
  },
  lockedUpgradeButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    color: "#facc15",
    fontWeight: "900",
    fontSize: 13,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  kpiCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: "#081121",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
  },
  kpiCardCompact: { minWidth: 0, flexBasis: "100%" },
  kpiIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiLabel: { color: "#94a3b8", fontSize: 12, lineHeight: 16 },
  kpiValue: { fontWeight: "900", fontSize: 19, marginTop: 8, flexShrink: 1, lineHeight: 24 },
  panel: {
    backgroundColor: "#081121",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  sectionTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 17 },
  sectionHint: { color: "#cbd5e1", fontWeight: "700", fontSize: 11, flexShrink: 1 },
  scoreGrid: { gap: 10 },
  scoreCard: {
    backgroundColor: "#0c172d",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#304767",
    padding: 12,
  },
  scoreLabel: { color: "#94a3b8", fontSize: 12 },
  scoreValue: { fontWeight: "900", fontSize: 18, marginTop: 8, marginBottom: 8, flexShrink: 1, lineHeight: 23 },
  scoreValueCompact: { fontSize: 17, lineHeight: 21 },
  scoreTrack: {
    height: 8,
    backgroundColor: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
  },
  scoreFill: { height: "100%", borderRadius: 999 },
  tractionHero: {
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  tractionHeroCompact: {
    flexDirection: "column",
  },
  tractionSummary: {
    flex: 1,
  },
  tractionEyebrow: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tractionHeadline: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  tractionText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
  },
  tractionHighlight: {
    minWidth: 106,
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 12,
    justifyContent: "space-between",
  },
  tractionHighlightCompact: {
    minWidth: 0,
  },
  tractionHighlightLabel: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  tractionHighlightValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    textTransform: "capitalize",
    marginTop: 8,
  },
  tractionHighlightText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  tractionMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  tractionMetricCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 18,
    padding: 12,
  },
  tractionMetricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 15,
  },
  tractionMetricValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },
  tractionBoard: {
    backgroundColor: "#0b1427",
    borderWidth: 1,
    borderColor: "#233955",
    borderRadius: 22,
    padding: 14,
  },
  tractionBoardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tractionBoardTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  tractionBoardHint: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  dualChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 180,
    gap: 10,
    marginTop: 4,
  },
  dualChartCompact: { gap: 6, height: 164 },
  barGroup: { flex: 1, alignItems: "center" },
  barTrack: {
    width: "100%",
    maxWidth: 40,
    height: 140,
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  barTrackCompact: { maxWidth: 28, gap: 2, height: 126 },
  barTrackHighlight: {
    backgroundColor: "#12233f",
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  bar: { width: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barCompact: { width: 11 },
  barRevenue: { backgroundColor: "#38bdf8" },
  barRevenueHighlight: { backgroundColor: "#7dd3fc" },
  barProposal: { backgroundColor: "#facc15" },
  barValue: {
    color: "#e2e8f0",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 8,
  },
  barValueHighlight: { color: "#ffffff" },
  barLabel: { color: "#94a3b8", fontSize: 11, marginTop: 8, textTransform: "capitalize" },
  barLabelCompact: { fontSize: 10, marginTop: 6 },
  barLabelHighlight: { color: "#f8fafc", fontWeight: "800" },
  chartLegend: { flexDirection: "row", gap: 12, marginTop: 12 },
  chartLegendCompact: { flexWrap: "wrap", rowGap: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 999 },
  legendText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  funnelRow: { marginBottom: 12 },
  funnelHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, gap: 10 },
  funnelHeaderCompact: { alignItems: "flex-start" },
  funnelLabel: { color: "#cbd5e1", fontWeight: "700", flex: 1, paddingRight: 8 },
  funnelValue: { fontWeight: "900", flexShrink: 1, maxWidth: "38%", textAlign: "right" },
  funnelTrack: {
    height: 10,
    backgroundColor: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
  },
  funnelFill: { height: "100%", borderRadius: 999 },
  lineChartCard: {
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 18,
    padding: 12,
  },
  lineChart: {
    height: 170,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
  },
  lineChartCompact: { height: 150 },
  linePointCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    height: "100%",
  },
  lineConnector: {
    position: "absolute",
    right: "-50%",
    width: "100%",
    height: 2,
    backgroundColor: "#38bdf8",
  },
  linePoint: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#38bdf8",
    borderWidth: 2,
    borderColor: "#dbeafe",
  },
  lineValue: { color: "#e2e8f0", fontSize: 11, fontWeight: "700", marginBottom: 8 },
  lineValueCompact: { fontSize: 10, marginBottom: 6 },
  lineLabel: { color: "#94a3b8", fontSize: 11, textTransform: "capitalize" },
  lineLabelCompact: { fontSize: 10 },
  distRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  distLabel: { color: "#9ca3af", width: 34, fontWeight: "700" },
  distTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  distFill: { height: "100%", backgroundColor: "#facc15", borderRadius: 999 },
  distCount: { color: "#e5e7eb", width: 26, textAlign: "right", fontWeight: "900" },
  signalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  signalCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 18,
    padding: 12,
  },
  signalCardCompact: { minWidth: 0, flexBasis: "100%" },
  signalLabel: { color: "#94a3b8", fontSize: 12, lineHeight: 16 },
  signalValue: { fontWeight: "900", fontSize: 18, marginTop: 8, flexShrink: 1, lineHeight: 23 },
  signalValueCompact: { fontSize: 17, lineHeight: 21 },
  insightRow: {
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  insightTitle: { color: "#f8fafc", fontWeight: "900", marginBottom: 6 },
  insightBody: { color: "#94a3b8", lineHeight: 19 },
});
