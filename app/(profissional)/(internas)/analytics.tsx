import { useEmpresaCommercial } from "@/hooks/useEmpresaCommercial";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import {
  hasProfessionalFullAccess,
  loadProfessionalSubscriptionContext,
  type ProfessionalSubscriptionContext,
} from "@/lib/pro-subscription";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";

type Funnel = {
  propostas: number;
  aceites: number;
  pagamentosAprovados: number;
};

type Evento = {
  id: string;
  evento: string;
  created_at: string;
};

type PropostaLite = {
  status?: string | null;
  created_at: string;
};

type PagamentoLite = {
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at: string;
  valor_profissional?: number | null;
};

type DayPoint = {
  key: string;
  label: string;
  propostas: number;
  pagamentos: number;
};

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function normalizeStatus(status?: string | null) {
  return String(status || "").toLowerCase();
}

function isPagamentoAprovado(pagamento: Pick<PagamentoLite, "status_pagamento" | "status_pagamentos">) {
  const status = normalizeStatus(pagamento.status_pagamento || pagamento.status_pagamentos);
  return status === "aprovada" || status === "pago";
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function money(v: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

export default function AnalyticsProfissional() {
  const { commercial, loadingCommercial } = useEmpresaCommercial();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<Funnel>({
    propostas: 0,
    aceites: 0,
    pagamentosAprovados: 0,
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [serie7d, setSerie7d] = useState<DayPoint[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [receita7d, setReceita7d] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;

      if (!uid) {
        setFunnel({ propostas: 0, aceites: 0, pagamentosAprovados: 0 });
        setEventos([]);
        setSerie7d([]);
        setTicketMedio(0);
        setReceita7d(0);
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
        propostasCountRes,
        aceitesCountRes,
        pagamentosCountRes,
        eventosRes,
        propostasTimelineRes,
        pagamentosTimelineRes,
      ] = await Promise.all([
        tenantId
          ? supabase.from("propostas").select("id", { count: "exact", head: true }).eq("profissional_id", uid).eq("tenant_id", tenantId)
          : supabase.from("propostas").select("id", { count: "exact", head: true }).eq("profissional_id", uid),
        tenantId
          ? supabase.from("propostas").select("id", { count: "exact", head: true }).eq("profissional_id", uid).eq("status", "aceita").eq("tenant_id", tenantId)
          : supabase.from("propostas").select("id", { count: "exact", head: true }).eq("profissional_id", uid).eq("status", "aceita"),
        tenantId
          ? supabase
              .from("pagamentos")
              .select("id", { count: "exact", head: true })
              .eq("profissional_id", uid)
              .eq("tenant_id", tenantId)
              .or("status_pagamento.eq.aprovada,status_pagamentos.eq.aprovada,status_pagamento.eq.pago,status_pagamentos.eq.pago")
          : supabase
              .from("pagamentos")
              .select("id", { count: "exact", head: true })
              .eq("profissional_id", uid)
              .or("status_pagamento.eq.aprovada,status_pagamentos.eq.aprovada,status_pagamento.eq.pago,status_pagamentos.eq.pago"),
        tenantId
          ? supabase.from("analytics_eventos").select("id, evento, created_at").eq("user_id", uid).eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(12)
          : supabase.from("analytics_eventos").select("id, evento, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(12),
        tenantId
          ? supabase.from("propostas").select("status, created_at").eq("profissional_id", uid).eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(120)
          : supabase.from("propostas").select("status, created_at").eq("profissional_id", uid).order("created_at", { ascending: false }).limit(120),
        tenantId
          ? supabase.from("pagamentos").select("status_pagamento, status_pagamentos, created_at, valor_profissional").eq("profissional_id", uid).eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(120)
          : supabase.from("pagamentos").select("status_pagamento, status_pagamentos, created_at, valor_profissional").eq("profissional_id", uid).order("created_at", { ascending: false }).limit(120),
      ]);

      if (propostasCountRes.error) throw propostasCountRes.error;
      if (aceitesCountRes.error) throw aceitesCountRes.error;
      if (pagamentosCountRes.error) throw pagamentosCountRes.error;
      if (eventosRes.error) throw eventosRes.error;
      if (propostasTimelineRes.error) throw propostasTimelineRes.error;
      if (pagamentosTimelineRes.error) throw pagamentosTimelineRes.error;

      setFunnel({
        propostas: Number(propostasCountRes.count || 0),
        aceites: Number(aceitesCountRes.count || 0),
        pagamentosAprovados: Number(pagamentosCountRes.count || 0),
      });

      setEventos((eventosRes.data as Evento[]) || []);

      const propostasTimeline = (propostasTimelineRes.data || []) as PropostaLite[];
      const pagamentosTimeline = (pagamentosTimelineRes.data || []) as PagamentoLite[];

      const days: DayPoint[] = [];
      const map = new Map<string, DayPoint>();
      const hoje = new Date();

      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(hoje);
        d.setHours(0, 0, 0, 0);
        d.setDate(hoje.getDate() - i);
        const key = toDateKey(d);
        const row: DayPoint = {
          key,
          label: WEEK_LABELS[d.getDay()] || `${d.getDate()}`,
          propostas: 0,
          pagamentos: 0,
        };
        days.push(row);
        map.set(key, row);
      }

      for (const proposta of propostasTimeline) {
        const d = new Date(proposta.created_at);
        const key = toDateKey(d);
        const row = map.get(key);
        if (row) {
          row.propostas += 1;
        }
      }

      let receitaAprovada7d = 0;
      let totalAprovados = 0;
      let somaAprovados = 0;

      for (const pagamento of pagamentosTimeline) {
        const aprovado = isPagamentoAprovado(pagamento);
        if (aprovado) {
          totalAprovados += 1;
          somaAprovados += Number(pagamento.valor_profissional || 0);
        }

        const d = new Date(pagamento.created_at);
        const key = toDateKey(d);
        const row = map.get(key);
        if (row && aprovado) {
          row.pagamentos += 1;
          receitaAprovada7d += Number(pagamento.valor_profissional || 0);
        }
      }

      setSerie7d(days);
      setReceita7d(receitaAprovada7d);
      setTicketMedio(totalAprovados > 0 ? somaAprovados / totalAprovados : 0);
      setSelectedDayKey((prev) => prev || days[days.length - 1]?.key || null);
    } catch (error: any) {
      setErro(error?.message || "Nao foi possivel carregar analytics.");
      setFunnel({ propostas: 0, aceites: 0, pagamentosAprovados: 0 });
      setEventos([]);
      setSerie7d([]);
      setTicketMedio(0);
      setReceita7d(0);
      setSelectedDayKey(null);
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

  const taxaAceite = useMemo(
    () => (funnel.propostas > 0 ? (funnel.aceites / funnel.propostas) * 100 : 0),
    [funnel]
  );

  const taxaPagamento = useMemo(
    () => (funnel.aceites > 0 ? (funnel.pagamentosAprovados / funnel.aceites) * 100 : 0),
    [funnel]
  );

  const maiorPropostas7d = useMemo(
    () => Math.max(1, ...serie7d.map((p) => p.propostas)),
    [serie7d]
  );

  const maiorPagamentos7d = useMemo(
    () => Math.max(1, ...serie7d.map((p) => p.pagamentos)),
    [serie7d]
  );

  const selectedDay = useMemo(
    () => serie7d.find((p) => p.key === selectedDayKey) || null,
    [selectedDayKey, serie7d]
  );
  const analyticsMode = subscription?.plan.features.analytics || "basic";
  const advancedAnalyticsUnlocked = analyticsMode === "advanced" || analyticsMode === "complete";
  const eliteHasFullAccess = hasProfessionalFullAccess(subscription);
  const blockedByCompanyPlan = !loadingCommercial && commercial && !commercial.acesso_relatorios;

  if (blockedByCompanyPlan && !eliteHasFullAccess) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Relatórios premium</Text>
        <Text style={styles.emptyText}>
          Seu plano atual não inclui analytics avançado. Faça upgrade da assinatura da empresa para liberar esta área.
        </Text>
      </View>
    );
  }

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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="stats-chart-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Leitura analítica</Text>
            <Text style={styles.title}>Analytics</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Visão operacional com indicadores de conversão e desempenho semanal.</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="sparkles-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>Pipeline e conversão</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="cash-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{money(receita7d)} em 7 dias</Text>
          </View>
        </View>
      </View>

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <View style={styles.kpiGrid}>
        <KpiCard label="Propostas" value={String(funnel.propostas)} tone="#facc15" />
        <KpiCard label="Aceites" value={String(funnel.aceites)} tone="#38bdf8" />
        <KpiCard label="Pagamentos" value={String(funnel.pagamentosAprovados)} tone="#22c55e" />
        <KpiCard label="Taxa de aceite" value={`${taxaAceite.toFixed(1)}%`} tone="#e5e7eb" />
        <KpiCard label="Taxa de pagamento" value={`${taxaPagamento.toFixed(1)}%`} tone="#e5e7eb" />
        <KpiCard label="Ticket médio" value={money(ticketMedio)} tone="#facc15" />
      </View>

      {!advancedAnalyticsUnlocked ? (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedTitle}>Analytics avançado bloqueado no seu plano</Text>
          <Text style={styles.lockedText}>
            O plano {subscription?.plan.label || "Starter PRO"} libera a leitura essencial. Para destravar séries detalhadas e eventos operacionais, faça upgrade para Pro Performance ou Elite Black.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Funil de conversão</Text>
        <FunnelLine
          label="Propostas"
          value={funnel.propostas}
          widthPercent={100}
          color="#facc15"
        />
        <FunnelLine
          label="Aceites"
          value={funnel.aceites}
          widthPercent={funnel.propostas > 0 ? (funnel.aceites / funnel.propostas) * 100 : 0}
          color="#38bdf8"
        />
        <FunnelLine
          label="Pagamentos"
          value={funnel.pagamentosAprovados}
          widthPercent={funnel.aceites > 0 ? (funnel.pagamentosAprovados / funnel.aceites) * 100 : 0}
          color="#22c55e"
        />
      </View>

      {advancedAnalyticsUnlocked ? <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimos 7 dias</Text>
        <Text style={styles.cardHint}>Receita aprovada no período: {money(receita7d)}</Text>

        <Text style={styles.chartLabel}>Propostas por dia</Text>
        <View style={styles.chartRow}>
          {serie7d.map((ponto) => {
            const barHeight = (ponto.propostas / maiorPropostas7d) * 86;
            const selected = selectedDayKey === ponto.key;
            return (
              <Pressable
                key={`prop-${ponto.key}`}
                style={[styles.chartCol, selected && styles.chartColSelected]}
                onPress={() => setSelectedDayKey(ponto.key)}
              >
                <Text style={styles.chartValue}>{ponto.propostas}</Text>
                <View style={[styles.bar, { height: Math.max(6, barHeight), backgroundColor: "#facc15" }]} />
                <Text style={styles.chartAxis}>{ponto.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.chartLabel, { marginTop: 12 }]}>Pagamentos aprovados por dia</Text>
        <View style={styles.chartRow}>
          {serie7d.map((ponto) => {
            const barHeight = (ponto.pagamentos / maiorPagamentos7d) * 86;
            const selected = selectedDayKey === ponto.key;
            return (
              <Pressable
                key={`pay-${ponto.key}`}
                style={[styles.chartCol, selected && styles.chartColSelected]}
                onPress={() => setSelectedDayKey(ponto.key)}
              >
                <Text style={styles.chartValue}>{ponto.pagamentos}</Text>
                <View style={[styles.bar, { height: Math.max(6, barHeight), backgroundColor: "#22c55e" }]} />
                <Text style={styles.chartAxis}>{ponto.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedDay ? (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>Detalhes de {selectedDay.label}</Text>
            <Text style={styles.dayDetailLine}>Propostas: {selectedDay.propostas}</Text>
            <Text style={styles.dayDetailLine}>Pagamentos aprovados: {selectedDay.pagamentos}</Text>
          </View>
        ) : null}
      </View> : null}

      {advancedAnalyticsUnlocked ? <View style={styles.card}>
        <Text style={styles.cardTitle}>Eventos recentes</Text>
        {eventos.length === 0 ? (
          <Text style={styles.empty}>Sem eventos ainda.</Text>
        ) : (
          eventos.map((ev) => (
            <View key={ev.id} style={styles.eventRow}>
              <View style={styles.eventDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{ev.evento}</Text>
                <Text style={styles.eventDate}>{new Date(ev.created_at).toLocaleString("pt-BR")}</Text>
              </View>
            </View>
          ))
        )}
      </View> : null}
    </ScrollView>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function FunnelLine({
  label,
  value,
  widthPercent,
  color,
}: {
  label: string;
  value: number;
  widthPercent: number;
  color: string;
}) {
  return (
    <View style={styles.funnelLineWrap}>
      <View style={styles.funnelLabelRow}>
        <Text style={styles.funnelLabel}>{label}</Text>
        <Text style={styles.funnelLabel}>{value}</Text>
      </View>
      <View style={styles.funnelTrack}>
        <View style={[styles.funnelFill, { width: `${Math.max(6, Math.min(100, widthPercent))}%`, backgroundColor: color }]} />
      </View>
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
    paddingBottom: 36,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 18,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 6,
    lineHeight: 20,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetaText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  error: {
    color: "#f87171",
    fontWeight: "700",
  },
  lockedCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
  },
  lockedTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
  },
  lockedText: {
    color: "#94a3b8",
    lineHeight: 20,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "48.5%",
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 12,
  },
  kpiLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 20,
    padding: 14,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 8,
    fontSize: 15,
  },
  cardHint: {
    color: "#94a3b8",
    marginBottom: 10,
    fontSize: 12,
  },
  funnelLineWrap: {
    marginBottom: 10,
  },
  funnelLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  funnelLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  funnelTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    overflow: "hidden",
  },
  funnelFill: {
    height: "100%",
    borderRadius: 999,
  },
  chartLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 12,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 2,
  },
  chartCol: {
    width: "13.2%",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 8,
    paddingVertical: 2,
  },
  chartColSelected: {
    backgroundColor: "#0b1220",
  },
  chartValue: {
    color: "#94a3b8",
    fontSize: 10,
    marginBottom: 4,
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 6,
  },
  chartAxis: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 4,
  },
  dayDetail: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  dayDetailTitle: {
    color: "#e2e8f0",
    fontWeight: "900",
    marginBottom: 4,
  },
  dayDetailLine: {
    color: "#94a3b8",
    marginTop: 2,
    fontSize: 12,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#facc15",
  },
  eventName: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  eventDate: {
    color: "#94a3b8",
    marginTop: 2,
    fontSize: 12,
  },
  empty: {
    color: "#64748b",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
