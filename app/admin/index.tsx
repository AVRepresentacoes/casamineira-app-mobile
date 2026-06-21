import { AdminBreakdownChart, AdminDonutChart, AdminHeatmapChart, AdminTrendChart } from "@/components/admin-web/AdminChartsLazy";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { AdminSegmentedControl } from "@/components/admin-web/AdminSegmentedControl";
import { AdminStatCard } from "@/components/admin-web/AdminStatCard";
import { normalizeAdminPlanoNome } from "@/lib/admin-display";
import { adminWebGetDashboard, type AdminWebDashboard } from "@/lib/admin-web";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

function money(value: number) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

function percentValue(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function safeAverage(total: number, base: number) {
  if (!base) return 0;
  return Math.round(total / base);
}

function formatCompact(value: number) {
  return Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function GaugePanel({
  title,
  value,
  color,
  helper,
}: {
  title: string;
  value: number;
  color: string;
  helper: string;
}) {
  const clamped = Math.max(0, Math.min(value, 100));
  const endColor = value >= 85 ? "#f8fafc" : "rgba(248, 250, 252, 0.25)";

  return (
    <View style={styles.gaugePanel}>
      <Text style={styles.gaugeTitle}>{title}</Text>
      <View style={styles.gaugeBody}>
        <View style={styles.gaugeVisual}>
          <View style={styles.gaugeHalo} />
          <View style={styles.gaugeTrackArc} />
          <View
            style={[
              styles.gaugeArc,
              {
                borderColor: color,
                borderRightColor: endColor,
                borderBottomColor: "transparent",
                borderLeftColor: color,
                transform: [{ rotate: `${-90 + clamped * 1.8}deg` }],
              },
            ]}
          />
          <View style={styles.gaugeMask} />
          <View style={styles.gaugeBaseShadow} />
        </View>
        <View style={styles.gaugeCenter}>
          <Text style={styles.gaugeValue}>{clamped.toFixed(1)}%</Text>
          <Text style={styles.gaugeHelper}>{helper}</Text>
        </View>
      </View>
    </View>
  );
}

function SignalMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.signalMetric}>
      <Text style={styles.signalMetricValue}>{value}</Text>
      <Text style={styles.signalMetricLabel}>{label}</Text>
      <View style={styles.signalMetricBar} />
      <Text style={styles.signalMetricHelper}>{helper}</Text>
    </View>
  );
}

function ActivityFeed({
  items,
}: {
  items: { id: string; title: string; detail: string; tone: "info" | "success" | "alert" }[];
}) {
  return (
    <View style={styles.activityCard}>
      <Text style={styles.panelEyebrow}>Central de atividade</Text>
      <Text style={styles.panelTitle}>Movimentos recentes da operação</Text>
      <View style={styles.activityList}>
        {items.map((item) => (
          <View key={item.id} style={styles.activityRow}>
            <View style={[styles.activityDot, activityDotStyles[item.tone]]} />
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function RankingPanel({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: { id: string; label: string; value: number; color?: string }[];
}) {
  const topValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return (
    <View style={styles.rankingCard}>
      <Text style={styles.panelEyebrow}>{eyebrow}</Text>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.rankingList}>
        {items.slice(0, 6).map((item) => (
          <View key={item.id} style={styles.rankingRow}>
            <Text style={styles.rankingLabel}>{item.label}</Text>
            <View style={styles.rankingTrack}>
              <View
                style={[
                  styles.rankingFill,
                  {
                    width: `${Math.max((Number(item.value || 0) / topValue) * 100, 6)}%`,
                    backgroundColor: item.color || "#f59e0b",
                  },
                ]}
              />
            </View>
            <Text style={styles.rankingValue}>{formatCompact(item.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AdminWebDashboard | null>(null);
  const [view, setView] = useState<"visao" | "receita" | "base">("visao");
  const [windowSize, setWindowSize] = useState<"3" | "6">("6");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDashboard(await adminWebGetDashboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const growthEmpresas = useMemo(
    () => (dashboard?.crescimento_empresas || []).slice(-Number(windowSize)),
    [dashboard?.crescimento_empresas, windowSize],
  );
  const growthPedidos = useMemo(
    () => (dashboard?.crescimento_pedidos || []).slice(-Number(windowSize)),
    [dashboard?.crescimento_pedidos, windowSize],
  );

  const growthPoints = useMemo(
    () =>
      growthEmpresas.map((item, index) => ({
        id: item.mes,
        label: item.label.replace("/", " "),
        value: Number(item.total || 0),
        secondaryValue: Number(growthPedidos[index]?.total || 0),
      })),
    [growthEmpresas, growthPedidos],
  );

  const planItems = useMemo(
    () =>
      (dashboard?.planos_mais_usados || []).map((item, index) => ({
        id: `${item.slug}-${index}`,
        label: normalizeAdminPlanoNome(item.nome, item.slug),
        value: Number(item.total || 0),
        color: ["#38bdf8", "#facc15", "#4ade80", "#c084fc", "#fb7185"][index % 5],
      })),
    [dashboard?.planos_mais_usados],
  );

  const statusItems = useMemo(
    () =>
      (dashboard?.assinaturas_por_status || []).map((item, index) => ({
        id: `${item.status}-${index}`,
        label: item.status.replaceAll("_", " "),
        value: Number(item.total || 0),
        color: ["#facc15", "#38bdf8", "#4ade80", "#fb7185", "#c084fc"][index % 5],
      })),
    [dashboard?.assinaturas_por_status],
  );

  const heatmapItems = useMemo(() => {
    if (!dashboard) return [];
    const totalEmpresas = Number(dashboard.total_empresas || 0);
    const empresasAtivas = Number(dashboard.empresas_ativas || 0);
    const empresasTrial = Number(dashboard.empresas_trial || 0);
    const empresasInadimplentes = Number(dashboard.empresas_inadimplentes || 0);
    const empresasCanceladas = Number(dashboard.empresas_canceladas || 0);
    const totalPedidos = Number(dashboard.total_pedidos || 0);
    const totalUsuarios = Number(dashboard.total_usuarios || 0);
    const totalClientes = Number(dashboard.total_clientes || 0);
    const totalProfissionais = Number(dashboard.total_profissionais || 0);

    return [
      { id: "ativacao", label: "Ativação %", value: percentValue(empresasAtivas, totalEmpresas) },
      { id: "trial", label: "Teste %", value: percentValue(empresasTrial, totalEmpresas) },
      { id: "inad", label: "Inadimplência %", value: percentValue(empresasInadimplentes, totalEmpresas) },
      { id: "cancel", label: "Cancelamento %", value: percentValue(empresasCanceladas, totalEmpresas) },
      { id: "pedidos-empresa", label: "Pedidos / empresa", value: totalEmpresas ? Math.round(totalPedidos / totalEmpresas) : 0 },
      { id: "usuarios-empresa", label: "Usuários / empresa", value: totalEmpresas ? Math.round(totalUsuarios / totalEmpresas) : 0 },
      { id: "clientes-empresa", label: "Clientes / empresa", value: totalEmpresas ? Math.round(totalClientes / totalEmpresas) : 0 },
      { id: "prof-ativa", label: "Profissionais / ativa", value: empresasAtivas ? Math.round(totalProfissionais / empresasAtivas) : 0 },
    ];
  }, [dashboard]);

  const conversionRate = dashboard
    ? percentValue(Number(dashboard.empresas_ativas || 0), Number(dashboard.empresas_ativas || 0) + Number(dashboard.empresas_trial || 0))
    : 0;
  const healthScore = dashboard
    ? Math.max(
        0,
        Math.min(
          100,
          55 +
            percentValue(Number(dashboard.empresas_ativas || 0), Number(dashboard.total_empresas || 0)) -
            percentValue(Number(dashboard.empresas_inadimplentes || 0), Number(dashboard.total_empresas || 0)),
        ),
      )
    : 0;
  const fulfillmentScore = dashboard
    ? Math.max(0, Math.min(100, 48 + safeAverage(Number(dashboard.total_pedidos || 0), Number(dashboard.total_empresas || 0))))
    : 0;

  const financialHealthItems = useMemo(() => {
    if (!dashboard) return [];
    const totalEmpresas = Number(dashboard.total_empresas || 0);
    const ativas = Number(dashboard.empresas_ativas || 0);
    const trials = Number(dashboard.empresas_trial || 0);
    const inad = Number(dashboard.empresas_inadimplentes || 0);
    const pedidos = Number(dashboard.total_pedidos || 0);
    const usuarios = Number(dashboard.total_usuarios || 0);

    return [
      { id: "conv", label: "Conversão %", value: conversionRate },
      { id: "risco", label: "Risco financeiro %", value: percentValue(inad, totalEmpresas) },
      { id: "trials", label: "Peso do teste %", value: percentValue(trials, totalEmpresas) },
      { id: "mrr-ativa", label: "MRR / ativa", value: ativas ? Math.round(Number(dashboard.mrr_estimado || 0) / ativas) : 0 },
      { id: "pedidos-ativa", label: "Pedidos / ativa", value: safeAverage(pedidos, ativas) },
      { id: "usuarios-ativa", label: "Usuários / ativa", value: safeAverage(usuarios, ativas) },
    ];
  }, [conversionRate, dashboard]);

  const activityItems = useMemo(
    () =>
      dashboard
        ? [
            {
              id: "trial",
              title: `${dashboard.empresas_trial || 0} empresas em período de teste`,
              detail: "Fluxo comercial aberto para ativação.",
              tone: "info" as const,
            },
            {
              id: "active",
              title: `${dashboard.empresas_ativas || 0} contas já monetizando`,
              detail: "Base recorrente com pagamento em andamento.",
              tone: "success" as const,
            },
            {
              id: "risk",
              title: `${dashboard.empresas_inadimplentes || 0} contas sob risco financeiro`,
              detail: "Carteira que exige ação de cobrança ou retenção.",
              tone: "alert" as const,
            },
          ]
        : [],
    [dashboard],
  );

  const baseMixItems = useMemo(
    () =>
      dashboard
        ? [
            { id: "usuarios", label: "Usuários ativos", value: Number(dashboard.total_usuarios || 0), color: "#38bdf8" },
            { id: "clientes", label: "Clientes", value: Number(dashboard.total_clientes || 0), color: "#f59e0b" },
            { id: "profissionais", label: "Profissionais", value: Number(dashboard.total_profissionais || 0), color: "#4ade80" },
            { id: "pedidos", label: "Pedidos", value: Number(dashboard.total_pedidos || 0), color: "#f87171" },
          ]
        : [],
    [dashboard],
  );

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#facc15" />}
      showsVerticalScrollIndicator={false}
    >
      <AdminPage
        title="Painel executivo"
        subtitle="Torre de controle da plataforma com receita, atividade da base, capacidade operacional e sinais de risco em uma única leitura."
        actions={
          <View style={styles.actionStack}>
            <AdminSegmentedControl
              value={view}
              onChange={(value) => setView(value as typeof view)}
              options={[
                { label: "Visão geral", value: "visao" },
                { label: "Receita", value: "receita" },
                { label: "Base", value: "base" },
              ]}
            />
            <AdminSegmentedControl
              value={windowSize}
              onChange={(value) => setWindowSize(value as typeof windowSize)}
              options={[
                { label: "3 meses", value: "3" },
                { label: "6 meses", value: "6" },
              ]}
            />
          </View>
        }
      >
        {loading && !dashboard ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#facc15" />
          </View>
        ) : null}

        {dashboard ? (
          <>
            <View style={styles.commandGrid}>
              <View style={styles.commandLead}>
                <View style={styles.commandShell}>
                  <Text style={styles.panelEyebrow}>Torre de controle</Text>
                  <Text style={styles.commandTitle}>Indicadores centrais da plataforma SaaS.</Text>
                  <Text style={styles.commandDescription}>
                    Receita, crescimento e capacidade operacional organizados como uma mesa executiva para leitura rápida do dono da plataforma.
                  </Text>
                  <View style={styles.commandMetrics}>
                    <SignalMetric label="Receita mensal" value={money(dashboard.mrr_estimado || 0)} helper="MRR estimado atual" />
                    <SignalMetric label="Receita anual" value={money(dashboard.arr_estimado || 0)} helper="ARR projetado" />
                    <SignalMetric label="Janela ativa" value={`${windowSize} meses`} helper="Período em análise" />
                  </View>
                </View>
                <View style={styles.kpiGrid}>
                  <AdminStatCard label="Empresas" value={String(dashboard.total_empresas || 0)} helper="Base cadastrada" />
                  <AdminStatCard label="Usuários" value={String(dashboard.total_usuarios || 0)} helper="Sem super admins" />
                  <AdminStatCard label="Clientes" value={String(dashboard.total_clientes || 0)} helper="Relacionamento" />
                  <AdminStatCard label="Pedidos" value={String(dashboard.total_pedidos || 0)} helper="Volume operacional" />
                </View>
              </View>

              <View style={styles.commandMiddle}>
                <GaugePanel title="Saúde comercial" value={healthScore} helper="Base ativa vs. risco" color="#fb923c" />
                <GaugePanel title="Conversão" value={conversionRate} helper="Teste para conta paga" color="#60a5fa" />
                <GaugePanel title="Capacidade" value={fulfillmentScore} helper="Ritmo operacional" color="#f87171" />
              </View>

              <View style={styles.commandRight}>
                <View style={styles.metricBoard}>
                  <SignalMetric label="Empresas ativas" value={formatCompact(Number(dashboard.empresas_ativas || 0))} helper="Contas em faturamento" />
                  <SignalMetric label="Em teste" value={formatCompact(Number(dashboard.empresas_trial || 0))} helper="Pipeline imediato" />
                  <SignalMetric
                    label="Inadimplentes"
                    value={formatCompact(Number(dashboard.empresas_inadimplentes || 0))}
                    helper="Exigem retenção"
                  />
                </View>
                <ActivityFeed items={activityItems} />
              </View>
            </View>

            {view === "visao" ? (
              <>
                <View style={styles.lowerGrid}>
                  <View style={styles.primaryColumn}>
                    <AdminTrendChart
                      eyebrow="Produção da plataforma"
                      title="Crescimento de empresas e pedidos"
                      points={growthPoints}
                      primaryLabel="Empresas"
                      secondaryLabel="Pedidos"
                    />
                  </View>
                  <View style={styles.secondaryColumn}>
                    <RankingPanel eyebrow="Ranking de status" title="Carteira por situação atual" items={statusItems} />
                  </View>
                </View>

                <View style={styles.lowerGrid}>
                  <View style={styles.primaryColumn}>
                    <AdminHeatmapChart eyebrow="Radar operacional" title="Eficiência e intensidade da operação" items={heatmapItems} />
                  </View>
                  <View style={styles.secondaryColumn}>
                    <RankingPanel eyebrow="Ranking comercial" title="Planos com maior presença na base" items={planItems} />
                  </View>
                </View>
              </>
            ) : null}

            {view === "receita" ? (
              <View style={styles.lowerGrid}>
                <View style={styles.primaryColumn}>
                  <AdminBreakdownChart eyebrow="Mix comercial" title="Participação dos planos na carteira" items={planItems} totalLabel="Planos ativos" />
                </View>
                <View style={styles.secondaryColumn}>
                  <AdminDonutChart
                    eyebrow="Receita da carteira"
                    title="Composição dos planos monitorados"
                    items={planItems}
                    totalLabel="Planos ativos"
                  />
                </View>
                <View style={styles.secondaryColumn}>
                  <RankingPanel eyebrow="Movimento financeiro" title="Sinais críticos da carteira" items={financialHealthItems.map((item) => ({ ...item, color: "#fb923c" }))} />
                </View>
              </View>
            ) : null}

            {view === "base" ? (
              <View style={styles.lowerGrid}>
                <View style={styles.primaryColumn}>
                  <AdminTrendChart
                    eyebrow="Expansão da base"
                    title="Formação de empresas ao longo do tempo"
                    points={growthPoints.map((item) => ({
                      ...item,
                      secondaryValue: undefined,
                    }))}
                    primaryLabel="Empresas"
                    primaryColor="#4ade80"
                  />
                </View>
                <View style={styles.secondaryColumn}>
                  <AdminDonutChart eyebrow="Composição da base" title="Distribuição da base ativa" totalLabel="Entidades" items={baseMixItems} />
                </View>
              </View>
            ) : null}

            {view === "receita" ? (
              <View style={styles.fullWidth}>
                <AdminHeatmapChart
                  eyebrow="Indicadores financeiros"
                  title="Eficiência financeira da carteira"
                  accentColor="#facc15"
                  items={financialHealthItems}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </AdminPage>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: 10,
    alignItems: "flex-end",
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
  },
  commandGrid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  commandLead: {
    flex: 1.55,
    gap: 18,
  },
  commandShell: {
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(94, 234, 212, 0.16)",
    padding: 24,
    minHeight: 280,
    shadowColor: "#020617",
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  panelEyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  commandTitle: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 12,
    maxWidth: 680,
  },
  commandDescription: {
    color: "#94a8c6",
    marginTop: 10,
    maxWidth: 720,
    lineHeight: 24,
  },
  commandMetrics: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 20,
  },
  signalMetric: {
    minWidth: 180,
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(10, 17, 31, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  signalMetricValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  signalMetricLabel: {
    color: "#d8e1ed",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  signalMetricBar: {
    height: 4,
    width: 26,
    borderRadius: 999,
    marginTop: 8,
    backgroundColor: "#7dd3fc",
  },
  signalMetricHelper: {
    color: "#88a0bf",
    fontSize: 12,
    marginTop: 8,
  },
  commandMiddle: {
    flex: 1,
    gap: 18,
  },
  gaugePanel: {
    flex: 1,
    minHeight: 186,
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    padding: 20,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  gaugeTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  gaugeBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginTop: 10,
  },
  gaugeVisual: {
    width: 148,
    height: 108,
    position: "relative",
    overflow: "hidden",
  },
  gaugeHalo: {
    position: "absolute",
    top: 18,
    left: 16,
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.04)",
  },
  gaugeTrackArc: {
    position: "absolute",
    top: 10,
    left: 2,
    width: 144,
    height: 144,
    borderWidth: 18,
    borderRadius: 999,
    borderColor: "rgba(148, 163, 184, 0.16)",
    borderBottomColor: "transparent",
  },
  gaugeArc: {
    position: "absolute",
    top: 10,
    left: 2,
    width: 144,
    height: 144,
    borderWidth: 18,
    borderRadius: 999,
  },
  gaugeMask: {
    position: "absolute",
    top: 82,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: "rgba(8, 14, 28, 0.96)",
  },
  gaugeBaseShadow: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 6,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
  },
  gaugeCenter: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    paddingRight: 4,
  },
  gaugeValue: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  gaugeHelper: {
    color: "#8ea4c0",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    maxWidth: 132,
  },
  commandRight: {
    flex: 1.1,
    gap: 18,
  },
  metricBoard: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    backgroundColor: "rgba(12, 168, 199, 0.86)",
    borderRadius: 30,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(125, 211, 252, 0.24)",
  },
  activityCard: {
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 20,
    flex: 1,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 10,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },
  activityList: {
    marginTop: 18,
    gap: 14,
  },
  activityRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  activityCopy: {
    flex: 1,
  },
  activityTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  activityDetail: {
    color: "#90a6c3",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  lowerGrid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  primaryColumn: {
    flex: 1.7,
  },
  secondaryColumn: {
    flex: 1,
    gap: 18,
  },
  fullWidth: {
    width: "100%",
  },
  rankingCard: {
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 20,
    minHeight: 320,
  },
  rankingList: {
    marginTop: 18,
    gap: 14,
  },
  rankingRow: {
    gap: 8,
  },
  rankingLabel: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
  },
  rankingTrack: {
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(148, 163, 184, 0.10)",
  },
  rankingFill: {
    height: "100%",
    borderRadius: 999,
  },
  rankingValue: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    alignSelf: "flex-end",
  },
});

const activityDotStyles = StyleSheet.create({
  info: { backgroundColor: "#38bdf8" },
  success: { backgroundColor: "#4ade80" },
  alert: { backgroundColor: "#fb7185" },
});
