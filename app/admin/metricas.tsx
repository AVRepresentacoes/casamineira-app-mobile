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

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function percentOf(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
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

function MetricRibbon({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.ribbonCard}>
      <Text style={styles.ribbonValue}>{value}</Text>
      <Text style={styles.ribbonLabel}>{label}</Text>
      <View style={styles.ribbonMarker} />
      <Text style={styles.ribbonHelper}>{helper}</Text>
    </View>
  );
}

export default function AdminMetricasScreen() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AdminWebDashboard | null>(null);
  const [mode, setMode] = useState<"financeiro" | "planos" | "pipeline">("financeiro");
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

  const conversion = dashboard
    ? dashboard.empresas_ativas + dashboard.empresas_trial > 0
      ? (dashboard.empresas_ativas / (dashboard.empresas_ativas + dashboard.empresas_trial)) * 100
      : 0
    : 0;

  const growthEmpresas = useMemo(
    () => (dashboard?.crescimento_empresas || []).slice(-Number(windowSize)),
    [dashboard?.crescimento_empresas, windowSize],
  );
  const growthPedidos = useMemo(
    () => (dashboard?.crescimento_pedidos || []).slice(-Number(windowSize)),
    [dashboard?.crescimento_pedidos, windowSize],
  );

  const pipelinePoints = useMemo(
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

  const financeHeatmap = useMemo(() => {
    if (!dashboard) return [];
    const totalEmpresas = Number(dashboard.total_empresas || 0);
    const ativas = Number(dashboard.empresas_ativas || 0);
    const trials = Number(dashboard.empresas_trial || 0);
    const inad = Number(dashboard.empresas_inadimplentes || 0);
    const cancel = Number(dashboard.empresas_canceladas || 0);
    const pedidos = Number(dashboard.total_pedidos || 0);
    const usuarios = Number(dashboard.total_usuarios || 0);

    return [
      { id: "mrr-ativa", label: "MRR / ativa", value: ativas ? Math.round(Number(dashboard.mrr_estimado || 0) / ativas) : 0 },
      { id: "arr-ativa", label: "ARR / ativa", value: ativas ? Math.round(Number(dashboard.arr_estimado || 0) / ativas) : 0 },
      { id: "conv", label: "Conversão %", value: Math.round(percentOf(ativas, ativas + trials)) },
      { id: "inad", label: "Inadimplência %", value: Math.round(percentOf(inad, totalEmpresas)) },
      { id: "cancel", label: "Cancelamento %", value: Math.round(percentOf(cancel, totalEmpresas)) },
      { id: "pedidos-ativa", label: "Pedidos / ativa", value: safeAverage(pedidos, ativas) },
      { id: "usuarios-ativa", label: "Usuários / ativa", value: safeAverage(usuarios, ativas) },
    ];
  }, [dashboard]);

  const pipelineSummaryItems = useMemo(() => {
    if (!dashboard) return [];
    const totalEmpresasPeriodo = growthEmpresas.reduce((acc, item) => acc + Number(item.total || 0), 0);
    const totalPedidosPeriodo = growthPedidos.reduce((acc, item) => acc + Number(item.total || 0), 0);
    return [
      { id: "novas-empresas", label: "Novas empresas", value: totalEmpresasPeriodo },
      { id: "novos-pedidos", label: "Novos pedidos", value: totalPedidosPeriodo },
      { id: "pedidos-media", label: "Pedidos / mês", value: safeAverage(totalPedidosPeriodo, Number(windowSize)) },
      { id: "empresas-media", label: "Empresas / mês", value: safeAverage(totalEmpresasPeriodo, Number(windowSize)) },
    ];
  }, [dashboard, growthEmpresas, growthPedidos, windowSize]);

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

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#facc15" />}>
      <AdminPage
        title="Métricas"
        subtitle="Leitura analítica da operação comercial com foco em receita, conversão, planos e ritmo de crescimento."
        actions={
          <View style={styles.actionStack}>
            <AdminSegmentedControl
              value={mode}
              onChange={(value) => setMode(value as typeof mode)}
              options={[
                { label: "Financeiro", value: "financeiro" },
                { label: "Planos", value: "planos" },
                { label: "Pipeline", value: "pipeline" },
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
            <View style={styles.hero}>
              <View style={styles.heroCard}>
                <Text style={styles.heroEyebrow}>Centro analítico</Text>
                <Text style={styles.heroTitle}>Receita, retenção e pipeline sob a mesma lente executiva.</Text>
                <Text style={styles.heroDescription}>
                  Acompanhe o peso do portfólio, o risco financeiro e a conversão da operação com indicadores prontos para reunião de diretoria.
                </Text>
                <View style={styles.heroBand}>
                  <MetricRibbon
                    label="Receita por ativa"
                    value={money(dashboard.empresas_ativas ? dashboard.mrr_estimado / dashboard.empresas_ativas : 0)}
                    helper="MRR médio por conta ativa"
                  />
                  <MetricRibbon label="Conversão" value={percent(conversion)} helper="Teste para conta ativa" />
                  <MetricRibbon label="Janela" value={`${windowSize} meses`} helper="Período de leitura" />
                </View>
              </View>
              <View style={styles.heroSide}>
                <View style={styles.heroSignal}>
                  <Text style={styles.heroSignalValue}>{formatCompact(Number(dashboard.empresas_ativas || 0))}</Text>
                  <Text style={styles.heroSignalLabel}>Empresas monetizando</Text>
                </View>
                <View style={[styles.heroSignal, styles.heroSignalAccent]}>
                  <Text style={styles.heroSignalValue}>{formatCompact(Number(dashboard.empresas_inadimplentes || 0))}</Text>
                  <Text style={styles.heroSignalLabel}>Contas em atenção</Text>
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              <AdminStatCard label="Churn observado" value={percent(percentOf(dashboard.empresas_canceladas || 0, dashboard.total_empresas || 0))} helper="Percentual cancelado da base" />
              <AdminStatCard label="Conversão teste -> ativa" value={percent(conversion)} helper="Eficiência comercial" tone="success" />
              <AdminStatCard label="Receita por ativa" value={money(dashboard.empresas_ativas ? dashboard.arr_estimado / dashboard.empresas_ativas : 0)} helper="ARR médio por conta ativa" />
              <AdminStatCard label="Risco financeiro" value={percent(percentOf(dashboard.empresas_inadimplentes || 0, dashboard.total_empresas || 0))} helper="Peso da inadimplência na base" tone="accent" />
            </View>

            {mode === "financeiro" ? (
              <View style={styles.rowPanels}>
                <View style={styles.panelWide}>
                  <AdminHeatmapChart eyebrow="Radar financeiro" title="Receita e saúde da carteira" items={financeHeatmap} accentColor="#facc15" />
                </View>
                <View style={styles.panelSlim}>
                  <AdminBreakdownChart
                    eyebrow="Situação financeira"
                    title="Distribuição da carteira"
                    items={statusItems}
                    totalLabel="Contas acompanhadas"
                  />
                </View>
              </View>
            ) : null}

            {mode === "planos" ? (
              <View style={styles.rowPanels}>
                <View style={styles.panelWide}>
                  <AdminBreakdownChart eyebrow="Portfólio comercial" title="Participação dos planos na base" items={planItems} totalLabel="Planos na carteira" />
                </View>
                <View style={styles.panelSlim}>
                  <AdminDonutChart
                    eyebrow="Composição do portfólio"
                    title="Distribuição visual dos planos"
                    totalLabel="Planos monitorados"
                    items={planItems}
                  />
                </View>
              </View>
            ) : null}

            {mode === "pipeline" ? (
              <View style={styles.rowPanels}>
                <View style={styles.panelWide}>
                  <AdminTrendChart
                    eyebrow="Ritmo da plataforma"
                    title="Empresas x pedidos por mês"
                    points={pipelinePoints}
                    primaryLabel="Empresas"
                    secondaryLabel="Pedidos"
                  />
                </View>
                <View style={styles.panelSlim}>
                  <AdminHeatmapChart
                    eyebrow="Resumo operacional"
                    title="Movimento do período"
                    items={pipelineSummaryItems}
                  />
                </View>
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
  hero: {
    flexDirection: "row",
    gap: 18,
  },
  heroCard: {
    flex: 1.7,
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(94, 234, 212, 0.16)",
    padding: 24,
    shadowColor: "#020617",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  heroEyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 12,
  },
  heroDescription: {
    color: "#94a8c6",
    marginTop: 10,
    maxWidth: 820,
    lineHeight: 23,
  },
  heroBand: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 20,
  },
  ribbonCard: {
    minWidth: 180,
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(10, 17, 31, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  ribbonValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  ribbonLabel: {
    color: "#dbe6f3",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  ribbonMarker: {
    width: 26,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#7dd3fc",
    marginTop: 8,
  },
  ribbonHelper: {
    color: "#8fa7c4",
    fontSize: 12,
    marginTop: 8,
  },
  heroSide: {
    flex: 0.8,
    gap: 18,
  },
  heroSignal: {
    flex: 1,
    minHeight: 148,
    borderRadius: 30,
    padding: 22,
    justifyContent: "space-between",
    backgroundColor: "rgba(16, 173, 204, 0.88)",
    borderWidth: 1.5,
    borderColor: "rgba(125, 211, 252, 0.24)",
  },
  heroSignalAccent: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(251, 113, 133, 0.18)",
  },
  heroSignalValue: {
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "900",
  },
  heroSignalLabel: {
    color: "#e8f3fb",
    fontSize: 14,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  rowPanels: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  panelWide: {
    flex: 1.6,
  },
  panelSlim: {
    flex: 1,
  },
});
