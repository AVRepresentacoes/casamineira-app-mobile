import PortalShell from "@/components/fornecedor-web/PortalShell";
import { buildCsv, exportCsvFile } from "@/lib/exportCsv";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type StatusLogistica = "novo" | "preparando" | "enviado" | "entregue" | "cancelado";
type SortField = "created_at" | "total" | "cliente";

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
  clienteNome: string;
  total: number;
  itens: number;
  statusLogistica: StatusLogistica;
  createdAt: string;
};

const PAGE_SIZE = 15;
const STEPS: StatusLogistica[] = ["novo", "preparando", "enviado", "entregue"];

function parseStatus(value: string): StatusLogistica {
  const s = String(value || "").toLowerCase();
  if (s === "preparando" || s === "enviado" || s === "entregue" || s === "cancelado") return s;
  return "novo";
}

function labelStatus(status: StatusLogistica) {
  if (status === "preparando") return "preparando";
  if (status === "enviado") return "enviado";
  if (status === "entregue") return "entregue";
  if (status === "cancelado") return "cancelado";
  return "novo";
}

export default function PortalFornecedorPedidos() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [q, setQ] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return setPedidos([]);

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

      const { data: itensData } = await itensQuery.limit(2000);

      const itens = (itensData as PedidoItem[]) || [];
      if (!itens.length) return setPedidos([]);

      const pedidoIds = [...new Set(itens.map((i) => i.pedido_id))];
      const clienteIds = [...new Set(itens.map((i) => i.cliente_id))];

      const [{ data: pedidosData }, { data: clientesData }] = await Promise.all([
        tenantId
          ? supabase.from("pedidos").select("id, status_logistica").in("id", pedidoIds).eq("tenant_id", tenantId)
          : supabase.from("pedidos").select("id, status_logistica").in("id", pedidoIds),
        tenantId
          ? supabase.from("profiles").select("id, name").in("id", clienteIds).eq("tenant_id", tenantId)
          : supabase.from("profiles").select("id, name").in("id", clienteIds),
      ]);

      const pedidosMap = new Map(
        ((pedidosData as any[]) || []).map((p) => [String(p.id), parseStatus(String(p.status_logistica || "novo"))])
      );
      const clientesMap = new Map(
        ((clientesData as any[]) || []).map((p) => [String(p.id), String(p.name || "Cliente")])
      );

      const grouped = new Map<string, PedidoResumo>();
      for (const item of itens) {
        const id = String(item.pedido_id);
        const current = grouped.get(id);
        if (!current) {
          grouped.set(id, {
            pedidoId: id,
            clienteNome: clientesMap.get(String(item.cliente_id)) || "Cliente",
            total: Number(item.subtotal || 0),
            itens: Number(item.quantidade || 0),
            statusLogistica: pedidosMap.get(id) || "novo",
            createdAt: item.created_at,
          });
        } else {
          current.total += Number(item.subtotal || 0);
          current.itens += Number(item.quantidade || 0);
        }
      }

      setPedidos(Array.from(grouped.values()));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = pedidos.filter((p) => {
      if (!term) return true;
      return p.pedidoId.toLowerCase().includes(term) || p.clienteNome.toLowerCase().includes(term);
    });

    const sorted = [...base].sort((a, b) => {
      if (sortField === "created_at") {
        const av = new Date(a.createdAt).getTime();
        const bv = new Date(b.createdAt).getTime();
        return sortAsc ? av - bv : bv - av;
      }
      if (sortField === "total") {
        return sortAsc ? a.total - b.total : b.total - a.total;
      }
      const cmp = a.clienteNome.localeCompare(b.clienteNome, "pt-BR");
      return sortAsc ? cmp : -cmp;
    });

    return sorted;
  }, [q, pedidos, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  async function updateStatus(id: string, status: StatusLogistica) {
    setSaving(`${id}:${status}`);
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status_logistica: status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) {
        setPedidos((prev) => prev.map((p) => (p.pedidoId === id ? { ...p, statusLogistica: status } : p)));
      }
    } finally {
      setSaving(null);
    }
  }

  async function exportar() {
    if (!filtered.length) {
      Alert.alert("Sem dados", "Não há pedidos para exportar.");
      return;
    }
    try {
      setExporting(true);
      const csv = buildCsv(
        ["pedido_id", "cliente", "total", "itens", "status_logistica", "data"],
        filtered.map((p) => [
          p.pedidoId,
          p.clienteNome,
          Number(p.total || 0).toFixed(2).replace(".", ","),
          p.itens,
          labelStatus(p.statusLogistica),
          new Date(p.createdAt).toLocaleDateString("pt-BR"),
        ])
      );
      await exportCsvFile(`pedidos_fornecedor_${Date.now()}.csv`, csv);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível exportar CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PortalShell
      title="Pedidos"
      subtitle="Operação logística com filtros avançados"
      headerRight={
        <TouchableOpacity style={styles.exportBtn} onPress={() => void exportar()} disabled={exporting}>
          {exporting ? <ActivityIndicator size="small" color="#022c22" /> : <Ionicons name="download-outline" size={14} color="#022c22" />}
          <Text style={styles.exportText}>Exportar CSV</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por pedido ou cliente"
          placeholderTextColor="#64748b"
          value={q}
          onChangeText={(text) => {
            setQ(text);
            setPage(1);
          }}
        />
        <View style={styles.tools}>
          <ToolChip
            label={`Ordenar: ${sortField}`}
            onPress={() =>
              setSortField((p) => (p === "created_at" ? "cliente" : p === "cliente" ? "total" : "created_at"))
            }
          />
          <ToolChip label={sortAsc ? "Ascendente" : "Descendente"} onPress={() => setSortAsc((p) => !p)} />
          <Text style={styles.pageInfo}>
            Página {Math.min(page, totalPages)} de {totalPages}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color="#22c55e" />
        ) : paged.length === 0 ? (
          <Text style={styles.empty}>Nenhum pedido encontrado.</Text>
        ) : (
          paged.map((pedido) => (
            <View key={pedido.pedidoId} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>#{pedido.pedidoId.slice(0, 8)} • {pedido.clienteNome}</Text>
                <Text style={styles.meta}>
                  {new Date(pedido.createdAt).toLocaleDateString("pt-BR")} • {pedido.itens} item(ns)
                </Text>
              </View>
              <Text style={styles.value}>{formatMoney(pedido.total)}</Text>
              <View style={styles.steps}>
                {STEPS.map((s) => {
                  const active = pedido.statusLogistica === s;
                  const busy = saving === `${pedido.pedidoId}:${s}`;
                  return (
                    <TouchableOpacity
                      key={`${pedido.pedidoId}-${s}`}
                      style={[styles.step, active ? styles.stepActive : null]}
                      onPress={() => void updateStatus(pedido.pedidoId, s)}
                      disabled={Boolean(saving)}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={active ? "#022c22" : "#cbd5e1"} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={12} color={active ? "#022c22" : "#94a3b8"} />
                          <Text style={[styles.stepText, active ? styles.stepTextActive : null]}>{s}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page <= 1 ? styles.pageBtnDisabled : null]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <Text style={styles.pageBtnText}>Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages ? styles.pageBtnDisabled : null]}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <Text style={styles.pageBtnText}>Próxima</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PortalShell>
  );
}

function ToolChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.toolChip} onPress={onPress}>
      <Text style={styles.toolChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exportBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exportText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  card: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 12, marginBottom: 12 },
  input: {
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    color: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  tools: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  toolChip: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toolChipText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  pageInfo: { color: "#94a3b8", marginLeft: "auto", fontSize: 12 },
  empty: { color: "#94a3b8" },
  row: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10, gap: 8 },
  title: { color: "#f8fafc", fontWeight: "900" },
  meta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  value: { color: "#22c55e", fontWeight: "900" },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  step: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#111827",
  },
  stepActive: { borderColor: "#22c55e", backgroundColor: "#22c55e" },
  stepText: { color: "#cbd5e1", fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  stepTextActive: { color: "#022c22" },
  paginationRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  pageBtn: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#334155", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
});
