import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type Pedido = {
  id: string;
  categoria?: string | null;
  descricao?: string | null;
  created_at?: string | null;
  status?: string | null;
};

type FiltroStatus = "todos" | "ativos" | "finalizado" | "cancelado";

export default function PedidosCliente() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [naoLidasPorPedido, setNaoLidasPorPedido] = useState<Record<string, number>>({});
  const [totalPropostasPorPedido, setTotalPropostasPorPedido] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarPedidos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
    }, [])
  );

  async function carregarPedidos() {
    setLoading(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setLoading(false);
      setRefreshing(false);
      setPedidos([]);
      setNaoLidasPorPedido({});
      setTotalPropostasPorPedido({});
      return;
    }

    const userId = session.user.id;
    const tenantId = await resolveCurrentTenantId();

    let pedidosQuery = supabase
      .from("pedidos")
      .select("*")
      .eq("cliente_id", userId)
      .order("created_at", { ascending: false });
    if (tenantId) {
      pedidosQuery = pedidosQuery.eq("tenant_id", tenantId);
    }
    const { data, error } = await pedidosQuery;

    if (!error && data) {
      const somenteServicos = (data || []).filter(
        (item: any) => String(item.categoria || "").toLowerCase() !== "marketplace"
      );
      setPedidos(somenteServicos);

      const pedidoIds = somenteServicos.map((item: any) => String(item.id));
      if (pedidoIds.length === 0) {
        setNaoLidasPorPedido({});
        setTotalPropostasPorPedido({});
      } else {
        let propostasQuery = supabase
          .from("propostas")
          .select("id, pedido_id, lida_cliente")
          .in("pedido_id", pedidoIds)
          .order("created_at", { ascending: false });
        if (tenantId) {
          propostasQuery = propostasQuery.eq("tenant_id", tenantId);
        }
        const { data: propostasResumo, error: propostasError } = await propostasQuery;

        if (propostasError) {
          console.log("Erro ao contar propostas não lidas:", propostasError);
          setNaoLidasPorPedido({});
          setTotalPropostasPorPedido({});
        } else {
          const mapaNaoLidas: Record<string, number> = {};
          const mapaTotal: Record<string, number> = {};

          (propostasResumo || []).forEach((item: any) => {
            const pedidoId = String(item.pedido_id);
            mapaTotal[pedidoId] = (mapaTotal[pedidoId] || 0) + 1;
            if (item.lida_cliente === false) {
              mapaNaoLidas[pedidoId] = (mapaNaoLidas[pedidoId] || 0) + 1;
            }
          });

          setNaoLidasPorPedido(mapaNaoLidas);
          setTotalPropostasPorPedido(mapaTotal);
        }
      }
    } else {
      console.log("Erro ao carregar pedidos:", error);
    }

    setLoading(false);
    setRefreshing(false);
  }

  function corStatus(status: string) {
    switch (status) {
      case "aguardando_proposta":
        return "#facc15";
      case "proposta_recebida":
        return "#3b82f6";
      case "aceita":
        return "#6366f1";
      case "em_execucao":
        return "#0ea5e9";
      case "finalizado":
        return "#9ca3af";
      case "cancelado":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  }

  function traduzStatus(status: string) {
    switch (status) {
      case "aguardando_proposta":
        return "Aguardando proposta";
      case "proposta_recebida":
        return "Proposta recebida";
      case "aceita":
        return "Proposta aceita";
      case "em_execucao":
        return "Em execução";
      case "finalizado":
        return "Finalizado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  }

  function corTextoStatus(status: string) {
    if (status === "aguardando_proposta") return "#000";
    return "#fff";
  }

  const indicadores = useMemo(() => {
    const total = pedidos.length;
    const ativos = pedidos.filter((item) =>
      ["aguardando_proposta", "proposta_recebida", "aceita", "em_execucao"].includes(
        String(item.status || "")
      )
    ).length;
    const finalizados = pedidos.filter((item) => item.status === "finalizado").length;
    const naoLidas = Object.values(naoLidasPorPedido).reduce((acc, val) => acc + val, 0);

    return { total, ativos, finalizados, naoLidas };
  }, [pedidos, naoLidasPorPedido]);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pedidos
      .filter((item) => {
        if (filtro === "ativos") {
          return ["aguardando_proposta", "proposta_recebida", "aceita", "em_execucao"].includes(
            String(item.status || "")
          );
        }
        if (filtro === "finalizado") return item.status === "finalizado";
        if (filtro === "cancelado") return item.status === "cancelado";
        return true;
      })
      .filter((item) => {
        if (!termo) return true;
        const categoria = String(item.categoria || "").toLowerCase();
        const descricao = String(item.descricao || "").toLowerCase();
        return categoria.includes(termo) || descricao.includes(termo);
      });
  }, [pedidos, filtro, busca]);

  function renderItem({ item }: { item: Pedido }) {
    const status = String(item.status || "");
    const totalPropostas = totalPropostasPorPedido[String(item.id)] || 0;
    const recebeuProposta = status === "proposta_recebida" || totalPropostas > 0;
    const propostasDisponiveis =
      totalPropostas > 0 ||
      ["proposta_recebida", "aceita", "em_execucao", "finalizado"].includes(status);
    const naoLidas = naoLidasPorPedido[String(item.id)] || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(cliente)/pedidos/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.categoria}>{item.categoria}</Text>

          <View
            style={[
              styles.badge,
              { backgroundColor: corStatus(status) },
            ]}
          >
            <Text style={[styles.badgeText, { color: corTextoStatus(String(item.status || "")) }]}>
              {traduzStatus(status)}
            </Text>
            {recebeuProposta && naoLidas > 0 ? (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {naoLidas > 99 ? "99+" : naoLidas}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.descricao} numberOfLines={2}>
          {item.descricao}
        </Text>

        <Text style={styles.data}>
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : ""}
        </Text>

        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={[
              styles.propostasButton,
              propostasDisponiveis ? styles.propostasButtonActive : styles.propostasButtonDisabled,
            ]}
            activeOpacity={propostasDisponiveis ? 0.85 : 1}
            disabled={!propostasDisponiveis}
          onPress={() => router.push(`/(cliente)/pedidos/${item.id}/proposta`)}
        >
            <Text
              style={[
                styles.propostasButtonText,
                propostasDisponiveis ? styles.propostasButtonTextActive : styles.propostasButtonTextDisabled,
              ]}
            >
              Minhas propostas
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/(tabs)/perfil");
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#facc15" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pedidos de Serviços</Text>
          <Text style={styles.subtitle}>Acompanhe orçamentos e execução dos serviços</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.ativos}</Text>
          <Text style={styles.metricLabel}>Ativos</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.finalizados}</Text>
          <Text style={styles.metricLabel}>Finalizados</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.naoLidas}</Text>
          <Text style={styles.metricLabel}>Não lidas</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar por categoria ou descrição"
        placeholderTextColor="#6b7280"
      />

      <View style={styles.filtersRow}>
        {[
          { id: "todos", label: "Todos" },
          { id: "ativos", label: "Ativos" },
          { id: "finalizado", label: "Finalizados" },
          { id: "cancelado", label: "Cancelados" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterChip,
              filtro === item.id && styles.filterChipActive,
            ]}
            onPress={() => setFiltro(item.id as FiltroStatus)}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === item.id && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.counter}>
        {pedidosFiltrados.length} de {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
      </Text>

      <FlatList
        data={pedidosFiltrados}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarPedidos();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Nenhum pedido encontrado.
            </Text>
            <Text style={styles.emptySub}>
              Ajuste os filtros ou faça uma nova solicitação de serviço.
            </Text>
          </View>
        }
        contentContainerStyle={
          pedidosFiltrados.length === 0 ? { flex: 1 } : { paddingBottom: 40 }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
  },
  title: {
    color: "#facc15",
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 2,
    fontSize: 12,
  },
  metricsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  metricValue: {
    color: "#facc15",
    fontSize: 14,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 10,
    marginTop: 3,
  },
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
  filtersRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  filterChipText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#000",
  },
  counter: {
    color: "#9ca3af",
    marginBottom: 14,
    marginTop: 10,
  },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#0b1220",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#111827",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoria: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  descricao: {
    color: "#9ca3af",
    marginTop: 8,
    marginBottom: 10,
  },
  data: {
    color: "#6b7280",
    fontSize: 12,
  },
  actionsWrap: {
    marginTop: 12,
  },
  counterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  counterText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 10,
    lineHeight: 12,
  },
  propostasButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  propostasButtonDisabled: {
    backgroundColor: "#1f2937",
  },
  propostasButtonActive: {
    backgroundColor: "#16a34a",
  },
  propostasButtonText: {
    fontWeight: "800",
    fontSize: 13,
  },
  propostasButtonTextDisabled: {
    color: "#9ca3af",
  },
  propostasButtonTextActive: {
    color: "#fff",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    position: "relative",
  },
  badgeText: {
    fontWeight: "800",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 6,
  },
  emptySub: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
  },
});
