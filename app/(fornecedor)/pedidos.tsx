import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/cart";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StatusLogistica = "novo" | "preparando" | "enviado" | "entregue" | "cancelado";
type FiltroStatus = "todos" | StatusLogistica;

type PedidoItem = {
  pedido_id: string;
  cliente_id: string;
  titulo: string;
  quantidade: number;
  subtotal: number;
  created_at: string;
};

type PedidoResumo = {
  pedidoId: string;
  clienteId: string;
  clienteNome: string;
  status: string;
  statusLogistica: StatusLogistica;
  itens: { titulo: string; quantidade: number; subtotal: number }[];
  total: number;
  createdAt: string;
};

type SlaLevel = "ok" | "warning" | "late";

function statusColor(status: StatusLogistica) {
  if (status === "entregue") return "#22c55e";
  if (status === "enviado") return "#38bdf8";
  if (status === "preparando") return "#facc15";
  if (status === "cancelado") return "#ef4444";
  return "#94a3b8";
}

function statusLabel(status: StatusLogistica) {
  if (status === "entregue") return "Entregue";
  if (status === "enviado") return "Enviado";
  if (status === "preparando") return "Preparando";
  if (status === "cancelado") return "Cancelado";
  return "Novo";
}

function parseStatusLogistica(value: string): StatusLogistica {
  const s = String(value || "").toLowerCase();
  if (s === "preparando" || s === "enviado" || s === "entregue" || s === "cancelado") return s;
  return "novo";
}

function getSlaLevel(pedido: PedidoResumo): SlaLevel {
  if (pedido.statusLogistica === "entregue" || pedido.statusLogistica === "cancelado") {
    return "ok";
  }
  const createdAt = new Date(pedido.createdAt).getTime();
  const now = Date.now();
  const diffHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60));
  if (diffHours >= 48) return "late";
  if (diffHours >= 24) return "warning";
  return "ok";
}

function getSlaLabel(level: SlaLevel) {
  if (level === "late") return "Atrasado";
  if (level === "warning") return "Atenção";
  return "No prazo";
}

function getSlaColor(level: SlaLevel) {
  if (level === "late") return "#ef4444";
  if (level === "warning") return "#f59e0b";
  return "#22c55e";
}

const ETAPAS_LOGISTICA: { key: StatusLogistica; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "novo", label: "Novo", icon: "sparkles-outline" },
  { key: "preparando", label: "Preparando", icon: "construct-outline" },
  { key: "enviado", label: "Enviado", icon: "car-outline" },
  { key: "entregue", label: "Entregue", icon: "checkmark-done-outline" },
];
const STATUS_ORDEM: StatusLogistica[] = ["novo", "preparando", "enviado", "entregue", "cancelado"];

export default function FornecedorPedidos() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        setPedidos([]);
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

      let itensQuery = supabase
        .from("pedido_produtos_itens")
        .select("pedido_id, cliente_id, titulo, quantidade, subtotal, created_at")
        .eq("fornecedor_id", uid)
        .order("created_at", { ascending: false });

      if (tenantId) itensQuery = itensQuery.eq("tenant_id", tenantId);

      const { data: itensData, error: itensError } = await itensQuery.limit(1200);

      if (itensError || !itensData) {
        setPedidos([]);
        return;
      }

      const itens = itensData as PedidoItem[];
      if (itens.length === 0) {
        setPedidos([]);
        return;
      }

      const pedidoIds = [...new Set(itens.map((i) => i.pedido_id))];
      const clienteIds = [...new Set(itens.map((i) => i.cliente_id))];

      const [{ data: pedidosData }, { data: clientesData }] = await Promise.all([
        tenantId
          ? supabase.from("pedidos").select("id, status, status_logistica").in("id", pedidoIds).eq("tenant_id", tenantId)
          : supabase.from("pedidos").select("id, status, status_logistica").in("id", pedidoIds),
        tenantId
          ? supabase.from("profiles").select("id, name").in("id", clienteIds).eq("tenant_id", tenantId)
          : supabase.from("profiles").select("id, name").in("id", clienteIds),
      ]);

      const pedidosMap = new Map(
        (pedidosData || []).map((p: any) => [
          String(p.id),
          {
            status: String(p.status || "aceita"),
            statusLogistica: parseStatusLogistica(String(p.status_logistica || "novo")),
          },
        ])
      );
      const clientesMap = new Map(
        (clientesData || []).map((p: any) => [String(p.id), String(p.name || "Cliente")])
      );

      const grouped = new Map<string, PedidoResumo>();
      for (const item of itens) {
        const key = String(item.pedido_id);
        const current = grouped.get(key);
        if (!current) {
          grouped.set(key, {
            pedidoId: key,
            clienteId: String(item.cliente_id),
            clienteNome: clientesMap.get(String(item.cliente_id)) || "Cliente",
            status: pedidosMap.get(key)?.status || "aceita",
            statusLogistica: pedidosMap.get(key)?.statusLogistica || "novo",
            itens: [
              {
                titulo: item.titulo,
                quantidade: Number(item.quantidade || 0),
                subtotal: Number(item.subtotal || 0),
              },
            ],
            total: Number(item.subtotal || 0),
            createdAt: item.created_at,
          });
        } else {
          current.itens.push({
            titulo: item.titulo,
            quantidade: Number(item.quantidade || 0),
            subtotal: Number(item.subtotal || 0),
          });
          current.total += Number(item.subtotal || 0);
        }
      }

      const list = Array.from(grouped.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPedidos(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const pedidosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return pedidos
      .filter((pedido) => (filtro === "todos" ? true : pedido.statusLogistica === filtro))
      .filter((pedido) => {
        if (!term) return true;
        return (
          pedido.pedidoId.toLowerCase().includes(term) ||
          pedido.clienteNome.toLowerCase().includes(term) ||
          pedido.itens.some((item) => item.titulo.toLowerCase().includes(term))
        );
      });
  }, [pedidos, filtro, busca]);

  const stats = useMemo(() => {
    const totalPedidos = pedidosFiltrados.length;
    const totalFaturado = pedidosFiltrados.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const pendentes = pedidosFiltrados.filter((p) =>
      ["novo", "preparando", "enviado"].includes(p.statusLogistica)
    ).length;
    const entregues = pedidosFiltrados.filter((p) => p.statusLogistica === "entregue").length;
    const ticketMedio = totalPedidos > 0 ? totalFaturado / totalPedidos : 0;
    return { totalPedidos, totalFaturado, pendentes, entregues, ticketMedio };
  }, [pedidosFiltrados]);

  const secoes = useMemo(() => {
    const map = new Map<StatusLogistica, PedidoResumo[]>();
    for (const status of STATUS_ORDEM) map.set(status, []);
    for (const pedido of pedidosFiltrados) {
      map.get(pedido.statusLogistica)?.push(pedido);
    }
    return STATUS_ORDEM.map((status) => ({
      status,
      label: statusLabel(status),
      pedidos: map.get(status) || [],
    })).filter((secao) => secao.pedidos.length > 0 || filtro === "todos");
  }, [pedidosFiltrados, filtro]);

  async function atualizarStatusLogistica(pedidoId: string, statusLogistica: StatusLogistica) {
    setSavingStatusId(`${pedidoId}:${statusLogistica}`);
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status_logistica: statusLogistica, updated_at: new Date().toISOString() })
        .eq("id", pedidoId);

      if (!error) {
        setPedidos((prev) =>
          prev.map((pedido) =>
            pedido.pedidoId === pedidoId ? { ...pedido, statusLogistica } : pedido
          )
        );
      }
    } finally {
      setSavingStatusId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void carregar();
            }}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Pedidos de produtos</Text>
          <Text style={styles.subtitle}>Gestão premium das vendas da loja</Text>
        </View>

        <View style={styles.kpiRow}>
          <KpiCard label="Pedidos" value={String(stats.totalPedidos)} color="#f8fafc" />
          <KpiCard label="Faturamento" value={formatMoney(stats.totalFaturado)} color="#22c55e" />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard label="Pendentes" value={String(stats.pendentes)} color="#facc15" />
          <KpiCard label="Entregues" value={String(stats.entregues)} color="#38bdf8" />
        </View>
        <View style={styles.kpiSingle}>
          <Text style={styles.kpiSingleLabel}>Ticket médio</Text>
          <Text style={styles.kpiSingleValue}>{formatMoney(stats.ticketMedio)}</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente, pedido ou produto"
          placeholderTextColor="#64748b"
          value={busca}
          onChangeText={setBusca}
        />

        <View style={styles.filterRow}>
          {[
            { id: "todos", label: "Todos" },
            { id: "novo", label: "Novos" },
            { id: "preparando", label: "Preparando" },
            { id: "enviado", label: "Enviados" },
            { id: "entregue", label: "Entregues" },
          ].map((chip) => {
            const active = filtro === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setFiltro(chip.id as FiltroStatus)}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.resultCount}>
          {pedidosFiltrados.length} pedido(s) no filtro atual
        </Text>

        {pedidosFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
            <Text style={styles.emptySub}>
              Ajuste a busca ou filtro. Quando houver novas compras, elas aparecerão aqui.
            </Text>
          </View>
        ) : (
          secoes.map((secao) => (
            <View key={secao.status} style={styles.sectionWrap}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: statusColor(secao.status) }]} />
                <Text style={styles.sectionTitle}>{secao.label}</Text>
                <Text style={styles.sectionCount}>{secao.pedidos.length}</Text>
              </View>

              {secao.pedidos.map((item) => {
                const color = statusColor(item.statusLogistica);
                return (
                  <View key={item.pedidoId} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>Pedido #{item.pedidoId.slice(0, 8)}</Text>
                        <Text style={styles.cardMeta}>
                          {item.clienteNome} • {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                      <View style={styles.badgesCol}>
                        <View style={[styles.statusBadge, { borderColor: color }]}>
                          <View style={[styles.statusDot, { backgroundColor: color }]} />
                          <Text style={[styles.statusText, { color }]}>{statusLabel(item.statusLogistica)}</Text>
                        </View>
                        <View
                          style={[
                            styles.slaBadge,
                            { borderColor: getSlaColor(getSlaLevel(item)) },
                          ]}
                        >
                          <Ionicons name="timer-outline" size={11} color={getSlaColor(getSlaLevel(item))} />
                          <Text style={[styles.slaText, { color: getSlaColor(getSlaLevel(item)) }]}>
                            {getSlaLabel(getSlaLevel(item))}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.moneyRow}>
                      <View>
                        <Text style={styles.moneyLabel}>Total do pedido</Text>
                        <Text style={styles.moneyValue}>{formatMoney(item.total)}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.moneyLabel}>Itens</Text>
                        <Text style={styles.moneyValue}>{item.itens.length}</Text>
                      </View>
                    </View>

                    <View style={styles.itemsBox}>
                      {item.itens.slice(0, 3).map((produto, idx) => (
                        <Text key={`${item.pedidoId}-${idx}`} style={styles.itemLine}>
                          {produto.quantidade}x {produto.titulo}
                        </Text>
                      ))}
                      {item.itens.length > 3 ? (
                        <Text style={styles.itemLineMuted}>+ {item.itens.length - 3} item(ns)</Text>
                      ) : null}
                    </View>

                    <Text style={styles.timelineTitle}>Atualizar logística</Text>
                    <View style={styles.timelineRow}>
                      {ETAPAS_LOGISTICA.map((step) => {
                        const active = item.statusLogistica === step.key;
                        const saving = savingStatusId === `${item.pedidoId}:${step.key}`;
                        return (
                          <TouchableOpacity
                            key={`${item.pedidoId}-${step.key}`}
                            style={[
                              styles.timelineChip,
                              active ? styles.timelineChipActive : null,
                              saving ? styles.timelineChipSaving : null,
                            ]}
                            onPress={() => void atualizarStatusLogistica(item.pedidoId, step.key)}
                            disabled={Boolean(savingStatusId)}
                          >
                            {saving ? (
                              <ActivityIndicator size="small" color={active ? "#022c22" : "#cbd5e1"} />
                            ) : (
                              <>
                                <Ionicons
                                  name={step.icon}
                                  size={13}
                                  color={active ? "#022c22" : "#94a3b8"}
                                />
                                <Text style={[styles.timelineChipText, active ? styles.timelineChipTextActive : null]}>
                                  {step.label}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text numberOfLines={1} style={[styles.kpiValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" },
  hero: { marginBottom: 10 },
  title: { color: "#22c55e", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 3 },

  kpiRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    minHeight: 68,
  },
  kpiLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  kpiValue: { color: "#f8fafc", fontSize: 16, fontWeight: "900", marginTop: 5 },
  kpiSingle: {
    backgroundColor: "#071b13",
    borderWidth: 1,
    borderColor: "#166534",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  kpiSingleLabel: { color: "#86efac", fontWeight: "700", fontSize: 12 },
  kpiSingleValue: { color: "#f8fafc", fontWeight: "900", fontSize: 24, marginTop: 2 },

  searchInput: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 11,
    color: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0b1220",
  },
  filterChipActive: {
    borderColor: "#22c55e",
    backgroundColor: "#14532d",
  },
  filterChipText: { color: "#cbd5e1", fontWeight: "700", fontSize: 11 },
  filterChipTextActive: { color: "#dcfce7" },
  resultCount: { color: "#64748b", fontSize: 12, marginBottom: 8 },

  card: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 15 },
  cardMeta: { color: "#94a3b8", marginTop: 2, fontSize: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#091322",
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  badgesCol: {
    alignItems: "flex-end",
    gap: 5,
  },
  slaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#091322",
  },
  slaText: {
    fontSize: 10,
    fontWeight: "800",
  },

  moneyRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moneyLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  moneyValue: { color: "#22c55e", fontWeight: "900", fontSize: 16, marginTop: 2 },

  itemsBox: {
    marginTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 8,
    gap: 4,
  },
  itemLine: { color: "#cbd5e1", fontSize: 12 },
  itemLineMuted: { color: "#64748b", fontSize: 12, fontWeight: "700" },

  timelineTitle: { color: "#cbd5e1", fontWeight: "800", marginTop: 10, marginBottom: 6, fontSize: 12 },
  timelineRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  timelineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#0a172a",
    minWidth: 78,
    justifyContent: "center",
  },
  timelineChipActive: {
    borderColor: "#22c55e",
    backgroundColor: "#22c55e",
  },
  timelineChipSaving: { opacity: 0.7 },
  timelineChipText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  timelineChipTextActive: { color: "#022c22" },

  emptyCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  emptyTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 15 },
  emptySub: { color: "#94a3b8", marginTop: 5, lineHeight: 19 },
  sectionWrap: {
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 13,
    flex: 1,
  },
  sectionCount: {
    color: "#94a3b8",
    fontWeight: "800",
    fontSize: 12,
  },
});
