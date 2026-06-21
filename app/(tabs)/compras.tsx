import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Compra = {
  id: string;
  categoria?: string | null;
  descricao?: string | null;
  created_at?: string | null;
  status?: string | null;
  status_logistica?: string | null;
  status_pagamento?: string | null;
};

type FiltroCompra = "todos" | "aguardando_pagamento" | "novo" | "preparando" | "enviado" | "entregue";

export default function ComprasCliente() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; fornecedorId?: string }>();

  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<FiltroCompra>("todos");
  const [busca, setBusca] = useState("");

  const carregarCompras = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setCompras([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const tenantId = await resolveCurrentTenantId();
    let pedidosQuery = supabase
      .from("pedidos")
      .select("id, categoria, descricao, created_at, status, status_logistica")
      .eq("cliente_id", session.user.id)
      .eq("categoria", "Marketplace")
      .order("created_at", { ascending: false });
    if (tenantId) {
      pedidosQuery = pedidosQuery.eq("tenant_id", tenantId);
    }
    const { data, error } = await pedidosQuery;

    if (error) {
      console.log("ERRO CARREGAR COMPRAS:", error);
      setCompras([]);
    } else {
      const base = ((data as Compra[]) || []).map((item) => ({ ...item, status_pagamento: "pendente" }));
      const ids = base.map((item) => String(item.id || "")).filter(Boolean);

      if (ids.length === 0) {
        setCompras(base);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let pagamentosQuery = supabase
        .from("pagamentos")
        .select("pedido_id, status_pagamento, status_pagamentos")
        .in("pedido_id", ids);
      if (tenantId) {
        pagamentosQuery = pagamentosQuery.eq("tenant_id", tenantId);
      }
      const { data: pagamentos } = await pagamentosQuery;

      const pagamentoMap = new Map(
        ((pagamentos as any[]) || []).map((row) => [
          String(row.pedido_id || ""),
          String(row.status_pagamento || row.status_pagamentos || "pendente").toLowerCase(),
        ])
      );

      const merged = base.map((item) => ({
        ...item,
        status_pagamento: pagamentoMap.get(String(item.id || "")) || "pendente",
      }));

      setCompras(merged);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarCompras();
    }, [carregarCompras])
  );

  function corLogistica(statusLogistica: string) {
    switch (statusLogistica) {
      case "aguardando_pagamento":
        return "#facc15";
      case "novo":
        return "#f59e0b";
      case "preparando":
        return "#3b82f6";
      case "enviado":
        return "#0ea5e9";
      case "entregue":
        return "#22c55e";
      case "cancelado":
        return "#ef4444";
      default:
        return "#64748b";
    }
  }

  function labelLogistica(statusLogistica: string) {
    switch (statusLogistica) {
      case "aguardando_pagamento":
        return "Aguardando pagamento";
      case "novo":
        return "Pedido recebido";
      case "preparando":
        return "Preparando envio";
      case "enviado":
        return "Em rota";
      case "entregue":
        return "Entregue";
      case "cancelado":
        return "Cancelado";
      default:
        return "Em análise";
    }
  }

  const indicadores = useMemo(() => {
    return {
      total: compras.length,
      aguardandoPagamento: compras.filter((c) => String(c.status_pagamento || "pendente") !== "aprovada").length,
      novo: compras.filter((c) => String(c.status_logistica || "novo") === "novo").length,
      emRota: compras.filter((c) => String(c.status_logistica || "") === "enviado").length,
      entregues: compras.filter((c) => String(c.status_logistica || "") === "entregue").length,
    };
  }, [compras]);

  const comprasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return compras
      .filter((item) => {
        if (filtro === "todos") return true;
        if (filtro === "aguardando_pagamento") return String(item.status_pagamento || "pendente") !== "aprovada";
        if (String(item.status_pagamento || "pendente") !== "aprovada") return false;
        return String(item.status_logistica || "novo") === filtro;
      })
      .filter((item) => {
        if (!termo) return true;
        const descricao = String(item.descricao || "").toLowerCase();
        return descricao.includes(termo) || String(item.id || "").toLowerCase().includes(termo);
      });
  }, [compras, filtro, busca]);

  function voltarTelaAnterior() {
    const from = String(params.from || "");
    if (from === "marketplace") {
      router.replace("/(tabs)/marketplace");
      return;
    }
    if (from === "lojas") {
      router.replace("/(tabs)/lojas");
      return;
    }
    if (from === "loja" && params.fornecedorId) {
      router.replace({
        pathname: "/(tabs)/lojas/[fornecedorId]",
        params: { fornecedorId: String(params.fornecedorId) },
      });
      return;
    }
    if (from === "carrinho") {
      router.replace("/(tabs)/carrinho");
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/lojas");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarTelaAnterior} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#facc15" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Minhas Compras</Text>
          <Text style={styles.subtitle}>Acompanhe status e entrega dos produtos</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.aguardandoPagamento}</Text>
          <Text style={styles.metricLabel}>Pend. pagamento</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.novo}</Text>
          <Text style={styles.metricLabel}>Novos</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.emRota}</Text>
          <Text style={styles.metricLabel}>Em rota</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.entregues}</Text>
          <Text style={styles.metricLabel}>Entregues</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar por ID ou descrição"
        placeholderTextColor="#6b7280"
      />

      <View style={styles.filtersRow}>
        {[
          { id: "todos", label: "Todos" },
          { id: "aguardando_pagamento", label: "Pagar" },
          { id: "novo", label: "Novos" },
          { id: "preparando", label: "Preparando" },
          { id: "enviado", label: "Em rota" },
          { id: "entregue", label: "Entregues" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterChip, filtro === item.id && styles.filterChipActive]}
            onPress={() => setFiltro(item.id as FiltroCompra)}
          >
            <Text style={[styles.filterChipText, filtro === item.id && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.counter}>
        {comprasFiltradas.length} de {compras.length} compras
      </Text>

      <FlatList
        data={comprasFiltradas}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void carregarCompras();
            }}
          />
        }
        renderItem={({ item }) => {
          const pagamentoAprovado = String(item.status_pagamento || "pendente") === "aprovada";
          const pendentePagamento = !pagamentoAprovado;
          const statusLogistica = pagamentoAprovado
            ? String(item.status_logistica || "novo")
            : "aguardando_pagamento";
          const cor = corLogistica(statusLogistica);

          return (
            <TouchableOpacity
              style={[styles.card, pendentePagamento ? styles.cardPending : null]}
              activeOpacity={0.85}
              onPress={() => {
                const pagamentoAprovado = String(item.status_pagamento || "pendente") === "aprovada";
                if (!pagamentoAprovado) {
                  router.push(`/(cliente)/pedidos/${item.id}/pagar`);
                  return;
                }

                router.push({
                  pathname: "/(cliente)/pedidos/[id]",
                  params: { id: String(item.id), focus: "timeline" },
                });
              }}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.categoria}>Compra #{String(item.id).slice(0, 8)}</Text>
                <Text style={styles.dataTop}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : ""}
                </Text>
              </View>

              <Text style={styles.descricao} numberOfLines={2}>
                {item.descricao || "Pedido de produto marketplace."}
              </Text>

              <View style={styles.actionRow}>
                <View style={[styles.statusAction, { borderColor: cor }, pendentePagamento ? styles.statusActionPending : null]}>
                  <Ionicons
                    name={pendentePagamento ? "alert-circle-outline" : "cube-outline"}
                    size={12}
                    color={cor}
                    style={styles.statusActionIcon}
                  />
                  <Text style={[styles.statusActionText, { color: cor }]}>
                    {labelLogistica(statusLogistica)}
                  </Text>
                </View>

                <View style={[styles.trackBtn, pendentePagamento ? styles.trackBtnPending : null]}>
                  <Text style={[styles.trackBtnText, pendentePagamento ? styles.trackBtnPendingText : null]}>
                    {pagamentoAprovado ? "Acompanhar entrega" : "Pagar agora"}
                  </Text>
                  <View style={styles.trackBtnIconWrap}>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={pendentePagamento ? "#854d0e" : "#bae6fd"}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nenhuma compra encontrada.</Text>
            <Text style={styles.emptySub}>Quando você comprar no marketplace, aparecerá aqui.</Text>
          </View>
        }
        contentContainerStyle={comprasFiltradas.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", paddingHorizontal: 16, paddingTop: 20 },
  center: { flex: 1, backgroundColor: "#020617", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
  },
  title: { color: "#facc15", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#9ca3af", marginTop: 2, fontSize: 12 },
  metricsRow: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", gap: 8 },
  metricCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  metricValue: { color: "#facc15", fontSize: 14, fontWeight: "900" },
  metricLabel: { color: "#9ca3af", fontSize: 10, marginTop: 3 },
  searchInput: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  filtersRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: "#facc15", borderColor: "#facc15" },
  filterChipText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#000" },
  counter: { color: "#9ca3af", marginBottom: 14, marginTop: 10 },
  card: {
    backgroundColor: "#0b1220",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#111827",
  },
  cardPending: {
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoria: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  dataTop: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  statusAction: {
    position: "relative",
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f172a",
  },
  statusActionPending: {
    backgroundColor: "#111827",
  },
  statusActionText: { fontWeight: "800", fontSize: 11, width: "100%", textAlign: "center" },
  statusActionIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -6,
  },
  descricao: { color: "#9ca3af", marginTop: 8, marginBottom: 8 },
  actionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  trackBtn: {
    position: "relative",
    flex: 1,
    backgroundColor: "#0369a1",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#075985",
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackBtnPending: {
    backgroundColor: "#22c55e",
    borderColor: "#16a34a",
  },
  trackBtnText: { color: "#fff", fontWeight: "800", fontSize: 13, width: "100%", textAlign: "center" },
  trackBtnPendingText: { color: "#052e16" },
  trackBtnIconWrap: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { color: "#9ca3af", fontSize: 16, marginBottom: 6 },
  emptySub: { color: "#6b7280", fontSize: 13, textAlign: "center", paddingHorizontal: 30 },
});
