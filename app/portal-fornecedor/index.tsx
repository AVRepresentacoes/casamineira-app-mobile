import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Produto = { id: string; ativo: boolean; estoque: number; preco: number };
type Item = { pedido_id: string; titulo: string; subtotal: number; quantidade: number; created_at: string };
type Pedido = { id: string; status_logistica?: string | null };
type Pagamento = {
  valor_profissional?: number | null;
  valor_comissao?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at?: string | null;
};
type Alerta = { id: string; severidade: string; titulo: string };
type PeriodDays = 7 | 30 | 90;

const PERIODS: { label: string; days: PeriodDays }[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

function statusPagamento(item: Pagamento) {
  return String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
}

function isAprovado(item: Pagamento) {
  const s = statusPagamento(item);
  return s === "aprovada" || s === "pago";
}

export default function PortalFornecedorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [pedidosMap, setPedidosMap] = useState<Map<string, Pedido>>(new Map());
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);
  const [selectedTrendDay, setSelectedTrendDay] = useState<string | null>(null);
  const [statusVisibility, setStatusVisibility] = useState({
    novo: true,
    preparando: true,
    enviado: true,
    entregue: true,
    cancelado: true,
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;

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

      const [produtosRes, itensRes, pagamentosRes, alertasRes] = await Promise.all([
        supabase.from("produtos_fornecedor").select("id, ativo, estoque, preco").eq("fornecedor_id", uid),
        supabase
          .from("pedido_produtos_itens")
          .select("pedido_id, titulo, subtotal, quantidade, created_at")
          .eq("fornecedor_id", uid)
          .order("created_at", { ascending: false })
          .limit(1200),
        supabase
          .from("pagamentos")
          .select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at")
          .eq("profissional_id", uid)
          .order("created_at", { ascending: false })
          .limit(600),
        supabase
          .from("fornecedor_alertas_inteligentes")
          .select("id, severidade, titulo")
          .eq("status", "aberto")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const itensRows = (itensRes.data as Item[]) || [];
      setProdutos((produtosRes.data as Produto[]) || []);
      setItens(itensRows);
      setPagamentos((pagamentosRes.data as Pagamento[]) || []);
      setAlertas((alertasRes.data as Alerta[]) || []);

      const ids = [...new Set(itensRows.map((row) => String(row.pedido_id || "")))].filter(Boolean);
      if (ids.length > 0) {
        const { data } = await (tenantId
          ? supabase.from("pedidos").select("id, status_logistica").in("id", ids).eq("tenant_id", tenantId)
          : supabase.from("pedidos").select("id, status_logistica").in("id", ids));
        setPedidosMap(new Map(((data as Pedido[]) || []).map((p) => [String(p.id), p])));
      } else {
        setPedidosMap(new Map());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const data = useMemo(() => {
    const now = Date.now();
    const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
    const previousStart = now - periodDays * 2 * 24 * 60 * 60 * 1000;

    const itensPeriodo = itens.filter((i) => {
      const ms = new Date(i.created_at).getTime();
      return Number.isFinite(ms) && ms >= periodStart;
    });
    const itensPeriodoAnterior = itens.filter((i) => {
      const ms = new Date(i.created_at).getTime();
      return Number.isFinite(ms) && ms >= previousStart && ms < periodStart;
    });

    const pedidosAgg = new Map<string, { subtotal: number; status: string; firstAt: number }>();
    for (const item of itensPeriodo) {
      const id = String(item.pedido_id || "");
      if (!id) continue;
      const createdAtMs = new Date(item.created_at).getTime();
      const safeCreatedAt = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
      const current = pedidosAgg.get(id) || {
        subtotal: 0,
        status: String(pedidosMap.get(id)?.status_logistica || "novo"),
        firstAt: safeCreatedAt,
      };
      current.subtotal += Number(item.subtotal || 0);
      current.firstAt = Math.min(current.firstAt, safeCreatedAt);
      current.status = String(pedidosMap.get(id)?.status_logistica || "novo");
      pedidosAgg.set(id, current);
    }

    const pedidos = Array.from(pedidosAgg.entries()).map(([id, agg]) => ({
      id,
      subtotal: agg.subtotal,
      status: agg.status,
      firstAt: agg.firstAt,
    }));

    const totalPedidos = pedidos.length;
    const faturamento = pedidos.reduce((acc, p) => acc + p.subtotal, 0);
    const ticket = totalPedidos > 0 ? faturamento / totalPedidos : 0;
    const entregues = pedidos.filter((p) => p.status === "entregue").length;
    const pendentes = pedidos.filter((p) => ["novo", "preparando", "enviado"].includes(p.status)).length;
    const atrasoCritico = pedidos.filter((p) => ["novo", "preparando", "enviado"].includes(p.status) && (Date.now() - p.firstAt) >= 36 * 60 * 60 * 1000).length;
    const ativos = produtos.filter((p) => Boolean(p.ativo)).length;
    const semEstoque = produtos.filter((p) => Boolean(p.ativo) && Number(p.estoque || 0) <= 0).length;
    const repasseAprovado = pagamentos
      .filter((p) => {
        if (!isAprovado(p)) return false;
        const ms = new Date(String(p.created_at || "")).getTime();
        return Number.isFinite(ms) && ms >= periodStart;
      })
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const repassePeriodoAnterior = pagamentos
      .filter((p) => {
        if (!isAprovado(p)) return false;
        const ms = new Date(String(p.created_at || "")).getTime();
        return Number.isFinite(ms) && ms >= previousStart && ms < periodStart;
      })
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const margemRepassePct = faturamento > 0 ? (repasseAprovado / faturamento) * 100 : 0;
    const entregaPct = totalPedidos > 0 ? (entregues / totalPedidos) * 100 : 0;

    const vendasPeriodo = itensPeriodo.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
    const vendasPeriodoAnterior = itensPeriodoAnterior.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
    const variacaoPeriodoPct =
      vendasPeriodoAnterior > 0
        ? ((vendasPeriodo - vendasPeriodoAnterior) / vendasPeriodoAnterior) * 100
        : vendasPeriodo > 0
          ? 100
          : 0;

    const statusCounts = {
      novo: pedidos.filter((p) => p.status === "novo").length,
      preparando: pedidos.filter((p) => p.status === "preparando").length,
      enviado: pedidos.filter((p) => p.status === "enviado").length,
      entregue: pedidos.filter((p) => p.status === "entregue").length,
      cancelado: pedidos.filter((p) => p.status === "cancelado").length,
    };
    const pizzaSlices = [
      { label: "Entregue", value: statusCounts.entregue, color: "#22c55e" },
      { label: "Enviado", value: statusCounts.enviado, color: "#a78bfa" },
      { label: "Preparando", value: statusCounts.preparando, color: "#38bdf8" },
      { label: "Novo", value: statusCounts.novo, color: "#f59e0b" },
      { label: "Cancelado", value: statusCounts.cancelado, color: "#ef4444" },
    ];

    const topProdutos = Array.from(
      itensPeriodo.reduce((map, item) => {
        const key = String(item.titulo || "Produto");
        const current = map.get(key) || { titulo: key, qtd: 0, valor: 0 };
        current.qtd += Number(item.quantidade || 0);
        current.valor += Number(item.subtotal || 0);
        map.set(key, current);
        return map;
      }, new Map<string, { titulo: string; qtd: number; valor: number }>())
      .values()
    )
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);

    const chartDays = periodDays === 90 ? 15 : periodDays;
    const chartMap = new Map<string, number>();
    for (let i = chartDays - 1; i >= 0; i -= 1) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      chartMap.set(key, 0);
    }
    for (const item of itensPeriodo) {
      const ms = new Date(item.created_at).getTime();
      if (!Number.isFinite(ms)) continue;
      const key = new Date(ms).toISOString().slice(0, 10);
      if (!chartMap.has(key)) continue;
      chartMap.set(key, Number(chartMap.get(key) || 0) + Number(item.subtotal || 0));
    }
    const trend = Array.from(chartMap.entries()).map(([day, value]) => ({ day, value }));

    const statusTrendMap = new Map<string, { novo: number; preparando: number; enviado: number; entregue: number; cancelado: number }>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      statusTrendMap.set(key, { novo: 0, preparando: 0, enviado: 0, entregue: 0, cancelado: 0 });
    }
    for (const pedido of pedidos) {
      const key = new Date(pedido.firstAt).toISOString().slice(0, 10);
      const bucket = statusTrendMap.get(key);
      if (!bucket) continue;
      if (pedido.status === "entregue") bucket.entregue += 1;
      else if (pedido.status === "enviado") bucket.enviado += 1;
      else if (pedido.status === "preparando") bucket.preparando += 1;
      else if (pedido.status === "cancelado") bucket.cancelado += 1;
      else bucket.novo += 1;
    }
    const statusTrend = Array.from(statusTrendMap.entries()).map(([day, counts]) => ({ day, ...counts }));

    return {
      totalPedidos,
      faturamento,
      ticket,
      entregues,
      pendentes,
      atrasoCritico,
      ativos,
      semEstoque,
      repasseAprovado,
      repassePeriodoAnterior,
      margemRepassePct,
      entregaPct,
      vendasPeriodo,
      vendasPeriodoAnterior,
      variacaoPeriodoPct,
      statusCounts,
      pizzaSlices,
      topProdutos,
      trend,
      statusTrend,
    };
  }, [itens, pedidosMap, produtos, pagamentos, periodDays]);

  return (
    <PortalShell
      title="Painel Geral"
      subtitle="Visão executiva do negócio em tempo real"
      headerRight={
        <TouchableOpacity style={styles.refreshBtn} onPress={() => void carregar()}>
          <Ionicons name="refresh" size={16} color="#022c22" />
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <>
          <View style={styles.periodRow}>
            {PERIODS.map((option) => {
              const active = periodDays === option.days;
              return (
                <TouchableOpacity
                  key={option.days}
                  style={[styles.periodBtn, active ? styles.periodBtnActive : null]}
                  onPress={() => setPeriodDays(option.days)}
                >
                  <Text style={[styles.periodText, active ? styles.periodTextActive : null]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.kpiGrid}>
            <Kpi label="Faturamento" value={formatMoney(data.faturamento)} color="#22c55e" />
            <Kpi label="Pedidos" value={String(data.totalPedidos)} color="#f8fafc" />
            <Kpi label="Ticket médio" value={formatMoney(data.ticket)} color="#38bdf8" />
            <Kpi label="Entregues" value={String(data.entregues)} color="#22c55e" />
            <Kpi label="Pendentes" value={String(data.pendentes)} color="#facc15" />
            <Kpi label="Repasse aprovado" value={formatMoney(data.repasseAprovado)} color="#22c55e" />
            <Kpi label="Produtos ativos" value={String(data.ativos)} color="#f8fafc" />
            <Kpi label="Sem estoque" value={String(data.semEstoque)} color="#ef4444" />
          </View>

          <View style={styles.pulseGrid}>
            <PulseCard
              title={`Vendas ${periodDays} dias`}
              value={formatMoney(data.vendasPeriodo)}
              hint={`Período anterior: ${formatMoney(data.vendasPeriodoAnterior)}`}
              trend={data.variacaoPeriodoPct}
            />
            <PulseCard
              title="Eficiência logística"
              value={`${data.entregaPct.toFixed(1)}%`}
              hint={`${data.entregues} entregues de ${data.totalPedidos} pedidos`}
            />
            <PulseCard
              title="Pedidos críticos"
              value={String(data.atrasoCritico)}
              hint="Abertos há mais de 36h"
              danger={data.atrasoCritico > 0}
            />
            <PulseCard
              title="Repasse sobre vendas"
              value={`${data.margemRepassePct.toFixed(1)}%`}
              hint={`Total repassado: ${formatMoney(data.repasseAprovado)}`}
            />
          </View>

          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Text style={styles.sectionTitle}>Composição logística (Pizza)</Text>
              <DonutComposition slices={data.pizzaSlices} />
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.sectionTitle}>Comparativo executivo</Text>
              <GroupedColumnChart
                items={[
                  {
                    label: "Vendas",
                    current: data.vendasPeriodo,
                    previous: data.vendasPeriodoAnterior,
                  },
                  {
                    label: "Repasse",
                    current: data.repasseAprovado,
                    previous: data.repassePeriodoAnterior,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tendência diária de faturamento</Text>
            <View style={styles.chartRow}>
              {data.trend.map((point) => (
                <TrendBar
                  key={point.day}
                  day={point.day}
                  value={point.value}
                  max={Math.max(...data.trend.map((p) => p.value), 1)}
                  selected={selectedTrendDay === point.day}
                  onPress={() => setSelectedTrendDay((current) => (current === point.day ? null : point.day))}
                />
              ))}
            </View>
            {selectedTrendDay ? (
              <Text style={styles.chartHint}>
                {selectedTrendDay.slice(8, 10)}/{selectedTrendDay.slice(5, 7)}:{" "}
                {formatMoney(Number(data.trend.find((p) => p.day === selectedTrendDay)?.value || 0))}
              </Text>
            ) : (
              <Text style={styles.chartHint}>Toque em uma barra para ver o valor exato.</Text>
            )}
          </View>

          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Text style={styles.sectionTitle}>Colunas empilhadas: logística 7 dias</Text>
              <View style={styles.statusToggleRow}>
                <StatusToggle
                  label="Novo"
                  color="#f59e0b"
                  active={statusVisibility.novo}
                  onPress={() => setStatusVisibility((s) => ({ ...s, novo: !s.novo }))}
                />
                <StatusToggle
                  label="Preparando"
                  color="#38bdf8"
                  active={statusVisibility.preparando}
                  onPress={() => setStatusVisibility((s) => ({ ...s, preparando: !s.preparando }))}
                />
                <StatusToggle
                  label="Enviado"
                  color="#a78bfa"
                  active={statusVisibility.enviado}
                  onPress={() => setStatusVisibility((s) => ({ ...s, enviado: !s.enviado }))}
                />
                <StatusToggle
                  label="Entregue"
                  color="#22c55e"
                  active={statusVisibility.entregue}
                  onPress={() => setStatusVisibility((s) => ({ ...s, entregue: !s.entregue }))}
                />
                <StatusToggle
                  label="Cancelado"
                  color="#ef4444"
                  active={statusVisibility.cancelado}
                  onPress={() => setStatusVisibility((s) => ({ ...s, cancelado: !s.cancelado }))}
                />
              </View>
              <StackedStatusColumns data={data.statusTrend} visible={statusVisibility} />
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.sectionTitle}>Pareto de produtos (faturamento)</Text>
              <ParetoProducts items={data.topProdutos} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status logístico</Text>
            <StatusBar label="Novo" value={data.statusCounts.novo} total={data.totalPedidos} color="#f59e0b" />
            <StatusBar label="Preparando" value={data.statusCounts.preparando} total={data.totalPedidos} color="#38bdf8" />
            <StatusBar label="Enviado" value={data.statusCounts.enviado} total={data.totalPedidos} color="#a78bfa" />
            <StatusBar label="Entregue" value={data.statusCounts.entregue} total={data.totalPedidos} color="#22c55e" />
            <StatusBar label="Cancelado" value={data.statusCounts.cancelado} total={data.totalPedidos} color="#ef4444" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top produtos vendidos</Text>
            {data.topProdutos.length === 0 ? (
              <Text style={styles.empty}>Sem vendas ainda.</Text>
            ) : (
              data.topProdutos.map((item, idx) => (
                <View key={`${item.titulo}-${idx}`} style={styles.rankRow}>
                  <Text style={styles.rankIndex}>#{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankTitle}>{item.titulo}</Text>
                    <Text style={styles.rankMeta}>{item.qtd} unidade(s)</Text>
                  </View>
                  <Text style={styles.rankValue}>{formatMoney(item.valor)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.quickRow}>
            <Quick label="Ir para Copilot IA" icon="sparkles-outline" onPress={() => router.push("/portal-fornecedor/copilot")} />
            <Quick label="Ir para Produtos" icon="cube-outline" onPress={() => router.push("/portal-fornecedor/produtos")} />
            <Quick label="Ir para Pedidos" icon="receipt-outline" onPress={() => router.push("/portal-fornecedor/pedidos")} />
            <Quick label="Ir para Financeiro" icon="wallet-outline" onPress={() => router.push("/portal-fornecedor/financeiro")} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Command Center</Text>
            {alertas.length === 0 ? (
              <Text style={styles.empty}>Sem alertas críticos no momento.</Text>
            ) : (
              alertas.map((a) => (
                <View key={a.id} style={styles.rankRow}>
                  <Text style={[styles.rankIndex, { color: a.severidade === "critica" ? "#ef4444" : a.severidade === "alta" ? "#f97316" : "#facc15" }]}>!</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankTitle}>{a.titulo}</Text>
                    <Text style={styles.rankMeta}>Severidade: {a.severidade}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </PortalShell>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

function Quick({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Ionicons name={icon} size={14} color="#cbd5e1" />
      <Text style={styles.quickText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PulseCard({
  title,
  value,
  hint,
  trend,
  danger = false,
}: {
  title: string;
  value: string;
  hint: string;
  trend?: number;
  danger?: boolean;
}) {
  const hasTrend = typeof trend === "number" && Number.isFinite(trend);
  const trendColor = !hasTrend ? "#94a3b8" : trend >= 0 ? "#22c55e" : "#ef4444";
  const trendText = !hasTrend ? null : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;
  return (
    <View style={[styles.pulseCard, danger ? styles.pulseDanger : null]}>
      <Text style={styles.pulseTitle}>{title}</Text>
      <Text style={[styles.pulseValue, danger ? { color: "#ef4444" } : null]}>{value}</Text>
      <Text style={styles.pulseHint}>{hint}</Text>
      {trendText ? <Text style={[styles.pulseTrend, { color: trendColor }]}>{trendText}</Text> : null}
    </View>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusValue}>
          {value} ({pct.toFixed(1)}%)
        </Text>
      </View>
      <View style={styles.statusTrack}>
        <View style={[styles.statusFill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function DonutComposition({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((acc, item) => acc + item.value, 0);
  let offset = 0;
  return (
    <View style={styles.pizzaWrap}>
      <View style={styles.pizzaOuter}>
        {slices.map((slice) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0;
          const top = offset;
          offset += pct;
          return (
            <View
              key={slice.label}
              style={[
                styles.pizzaSlice,
                {
                  top: `${top}%`,
                  height: `${pct}%`,
                  backgroundColor: slice.color,
                },
              ]}
            />
          );
        })}
        <View style={styles.pizzaInner}>
          <Text style={styles.pizzaCenterLabel}>Total</Text>
          <Text style={styles.pizzaCenterValue}>{total}</Text>
        </View>
      </View>

      <View style={styles.pizzaLegend}>
        {slices.map((slice) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0;
          return (
            <View key={slice.label} style={styles.pizzaLegendRow}>
              <View style={[styles.pizzaDot, { backgroundColor: slice.color }]} />
              <Text style={styles.pizzaLegendText}>
                {slice.label}: {slice.value} ({pct.toFixed(1)}%)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GroupedColumnChart({
  items,
}: {
  items: { label: string; current: number; previous: number }[];
}) {
  const max = Math.max(1, ...items.flatMap((item) => [item.current, item.previous]));
  return (
    <View style={styles.columnsWrap}>
      <View style={styles.columnsArea}>
        {items.map((item) => (
          <View key={item.label} style={styles.columnsGroup}>
            <View style={styles.columnsPair}>
              <View style={[styles.columnBar, styles.columnPrev, { height: `${Math.max(6, (item.previous / max) * 100)}%` }]} />
              <View style={[styles.columnBar, styles.columnCurrent, { height: `${Math.max(6, (item.current / max) * 100)}%` }]} />
            </View>
            <Text style={styles.columnsLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.columnsLegend}>
        <View style={styles.columnsLegendRow}>
          <View style={[styles.columnsLegendDot, styles.columnCurrent]} />
          <Text style={styles.columnsLegendText}>Período atual</Text>
        </View>
        <View style={styles.columnsLegendRow}>
          <View style={[styles.columnsLegendDot, styles.columnPrev]} />
          <Text style={styles.columnsLegendText}>Período anterior</Text>
        </View>
      </View>
    </View>
  );
}

function StackedStatusColumns({
  data,
  visible,
}: {
  data: { day: string; novo: number; preparando: number; enviado: number; entregue: number; cancelado: number }[];
  visible: { novo: boolean; preparando: boolean; enviado: boolean; entregue: boolean; cancelado: boolean };
}) {
  const totals = data.map((d) =>
    (visible.novo ? d.novo : 0) +
    (visible.preparando ? d.preparando : 0) +
    (visible.enviado ? d.enviado : 0) +
    (visible.entregue ? d.entregue : 0) +
    (visible.cancelado ? d.cancelado : 0)
  );
  const max = Math.max(1, ...totals);
  return (
    <View style={styles.stackWrap}>
      {data.map((d) => {
        const total =
          (visible.novo ? d.novo : 0) +
          (visible.preparando ? d.preparando : 0) +
          (visible.enviado ? d.enviado : 0) +
          (visible.entregue ? d.entregue : 0) +
          (visible.cancelado ? d.cancelado : 0);
        return (
          <View key={d.day} style={styles.stackCol}>
            <View style={styles.stackTrack}>
              {visible.entregue ? <View style={[styles.stackSeg, { height: `${(d.entregue / max) * 100}%`, backgroundColor: "#22c55e" }]} /> : null}
              {visible.enviado ? <View style={[styles.stackSeg, { height: `${(d.enviado / max) * 100}%`, backgroundColor: "#a78bfa" }]} /> : null}
              {visible.preparando ? <View style={[styles.stackSeg, { height: `${(d.preparando / max) * 100}%`, backgroundColor: "#38bdf8" }]} /> : null}
              {visible.novo ? <View style={[styles.stackSeg, { height: `${(d.novo / max) * 100}%`, backgroundColor: "#f59e0b" }]} /> : null}
              {visible.cancelado ? <View style={[styles.stackSeg, { height: `${(d.cancelado / max) * 100}%`, backgroundColor: "#ef4444" }]} /> : null}
            </View>
            <Text style={styles.stackDay}>{d.day.slice(8, 10)}/{d.day.slice(5, 7)}</Text>
            <Text style={styles.stackTotal}>{total}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ParetoProducts({
  items,
}: {
  items: { titulo: string; qtd: number; valor: number }[];
}) {
  const total = items.reduce((acc, item) => acc + item.valor, 0);
  let cumulative = 0;
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <View style={{ gap: 8 }}>
      {items.map((item, idx) => {
        cumulative += item.valor;
        const pct = total > 0 ? (item.valor / total) * 100 : 0;
        const cumPct = total > 0 ? (cumulative / total) * 100 : 0;
        return (
          <View key={`${item.titulo}-${idx}`} style={styles.paretoRow}>
            <Text style={styles.paretoName} numberOfLines={1}>{item.titulo}</Text>
            <View style={styles.paretoBarTrack}>
              <View style={[styles.paretoBarFill, { width: `${(item.valor / max) * 100}%` }]} />
            </View>
            <Text style={styles.paretoMeta}>{pct.toFixed(1)}% | Acum: {cumPct.toFixed(1)}%</Text>
          </View>
        );
      })}
      {items.length === 0 ? <Text style={styles.empty}>Sem dados de produtos no período.</Text> : null}
    </View>
  );
}

function StatusToggle({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statusToggle, active ? { borderColor: color, backgroundColor: "#111827" } : styles.statusToggleOff]}
      onPress={onPress}
    >
      <View style={[styles.statusToggleDot, { backgroundColor: color, opacity: active ? 1 : 0.35 }]} />
      <Text style={[styles.statusToggleText, !active ? styles.statusToggleTextOff : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshText: { color: "#022c22", fontWeight: "900" },
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  kpiCard: {
    width: "24%",
    minWidth: 200,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 12,
  },
  kpiLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  kpiValue: { marginTop: 6, fontSize: 19, fontWeight: "900", color: "#f8fafc" },
  pulseGrid: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  pulseCard: {
    width: "24%",
    minWidth: 200,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 12,
  },
  pulseDanger: { borderColor: "#7f1d1d", backgroundColor: "#1f1212" },
  pulseTitle: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  pulseValue: { marginTop: 6, color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  pulseHint: { marginTop: 5, color: "#94a3b8", fontSize: 12 },
  pulseTrend: { marginTop: 6, fontWeight: "900", fontSize: 12 },
  analyticsGrid: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  analyticsCard: {
    width: "49%",
    minWidth: 320,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
  },
  section: {
    marginTop: 14,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
  },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  empty: { color: "#94a3b8" },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  rankIndex: { color: "#facc15", fontWeight: "900", width: 26 },
  rankTitle: { color: "#f8fafc", fontWeight: "800" },
  rankMeta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  rankValue: { color: "#22c55e", fontWeight: "900" },
  statusRow: { marginBottom: 10 },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  statusLabel: { color: "#e2e8f0", fontWeight: "800" },
  statusValue: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  statusTrack: { height: 8, borderRadius: 999, backgroundColor: "#1f2937", overflow: "hidden" },
  statusFill: { height: "100%", borderRadius: 999 },
  quickRow: { marginTop: 14, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickBtn: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickText: { color: "#cbd5e1", fontWeight: "800" },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  periodBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  periodBtnActive: { backgroundColor: "#facc15", borderColor: "#facc15" },
  periodText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  periodTextActive: { color: "#1f2937" },
  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, minHeight: 150 },
  chartHint: { marginTop: 8, color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  statusToggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusToggleOff: { borderColor: "#374151", backgroundColor: "#0f172a" },
  statusToggleDot: { width: 8, height: 8, borderRadius: 999 },
  statusToggleText: { color: "#e2e8f0", fontSize: 11, fontWeight: "800" },
  statusToggleTextOff: { color: "#64748b" },
  pizzaWrap: { flexDirection: "row", alignItems: "center", gap: 14 },
  pizzaOuter: {
    width: 150,
    height: 150,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  pizzaSlice: { position: "absolute", left: 0, right: 0 },
  pizzaInner: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pizzaCenterLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  pizzaCenterValue: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  pizzaLegend: { flex: 1, gap: 6 },
  pizzaLegendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pizzaDot: { width: 10, height: 10, borderRadius: 999 },
  pizzaLegendText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  columnsWrap: { gap: 10 },
  columnsArea: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", minHeight: 160, paddingTop: 12 },
  columnsGroup: { alignItems: "center", width: "42%" },
  columnsPair: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 120 },
  columnBar: { width: 22, borderRadius: 8 },
  columnCurrent: { backgroundColor: "#22c55e" },
  columnPrev: { backgroundColor: "#475569" },
  columnsLabel: { marginTop: 8, color: "#cbd5e1", fontSize: 12, fontWeight: "800" },
  columnsLegend: { flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 6 },
  columnsLegendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  columnsLegendDot: { width: 10, height: 10, borderRadius: 999 },
  columnsLegendText: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  stackWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", minHeight: 190, gap: 8 },
  stackCol: { flex: 1, alignItems: "center" },
  stackTrack: {
    width: "100%",
    maxWidth: 26,
    height: 130,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "flex-end",
  },
  stackSeg: { width: "100%" },
  stackDay: { marginTop: 6, color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  stackTotal: { color: "#cbd5e1", fontSize: 10, fontWeight: "900" },
  paretoRow: { gap: 5 },
  paretoName: { color: "#e2e8f0", fontSize: 12, fontWeight: "800" },
  paretoBarTrack: { height: 8, borderRadius: 999, backgroundColor: "#1f2937", overflow: "hidden" },
  paretoBarFill: { height: "100%", borderRadius: 999, backgroundColor: "#22c55e" },
  paretoMeta: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
});

function TrendBar({
  day,
  value,
  max,
  selected = false,
  onPress,
}: {
  day: string;
  value: number;
  max: number;
  selected?: boolean;
  onPress?: () => void;
}) {
  const height = Math.max(8, Math.round((value / Math.max(max, 1)) * 110));
  const label = `${day.slice(8, 10)}/${day.slice(5, 7)}`;
  return (
    <TouchableOpacity style={{ flex: 1, alignItems: "center" }} onPress={onPress} activeOpacity={0.8}>
      <View
        style={{
          width: "100%",
          maxWidth: 18,
          height,
          borderRadius: 6,
          backgroundColor: selected ? "#facc15" : "#22c55e",
          borderWidth: selected ? 1 : 0,
          borderColor: selected ? "#fde68a" : "transparent",
        }}
      />
      <Text style={{ marginTop: 6, color: "#94a3b8", fontSize: 10 }}>{label}</Text>
    </TouchableOpacity>
  );
}
