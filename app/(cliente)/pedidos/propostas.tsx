import { supabase } from "@/lib/supabase";
import PressableScale from "@/components/PressableScale";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type PropostaCliente = {
  id: string;
  pedido_id: string;
  valor: number | null;
  lida_cliente?: boolean | null;
  descricao?: string | null;
  mensagem?: string | null;
  status: string;
  created_at: string;
  pedido_info?: {
    id: string;
    categoria?: string | null;
    servico?: string | null;
    status?: string | null;
  } | null;
};

type FiltroProposta = "todas" | "aceita" | "recusada" | "enviada";

export default function MinhasPropostasCliente() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroProposta>("todas");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    carregarPropostas();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  useFocusEffect(
    useCallback(() => {
      carregarPropostas();
    }, [])
  );

  async function carregarPropostas() {
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setPropostas([]);
        return;
      }

      const { data, error } = await supabase
        .from("propostas")
        .select(
          "id, pedido_id, valor, lida_cliente, descricao, mensagem, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.log("ERRO LISTAR PROPOSTAS CLIENTE:", error);
        setPropostas([]);
      } else {
        const listaBase = (data || []) as PropostaCliente[];
        const pedidoIds = Array.from(new Set(listaBase.map((item) => String(item.pedido_id))));
        let pedidoMap: Record<string, PropostaCliente["pedido_info"]> = {};

        if (pedidoIds.length > 0) {
          const { data: pedidosData } = await supabase
            .from("pedidos")
            .select("id, categoria, servico, status")
            .in("id", pedidoIds);

          pedidoMap = (pedidosData || []).reduce((acc: Record<string, PropostaCliente["pedido_info"]>, item: any) => {
            acc[String(item.id)] = {
              id: String(item.id),
              categoria: item.categoria,
              servico: item.servico,
              status: item.status,
            };
            return acc;
          }, {});
        }

        const lista = listaBase.map((item) => ({
          ...item,
          pedido_info: pedidoMap[String(item.pedido_id)] || null,
        }));

        setPropostas(lista);

        const idsNaoLidos = lista
          .filter((item) => item.lida_cliente === false)
          .map((item) => item.id);

        if (idsNaoLidos.length > 0) {
          const { error: updateError } = await supabase
            .from("propostas")
            .update({ lida_cliente: true })
            .in("id", idsNaoLidos);

          if (updateError) {
            console.log("ERRO MARCAR PROPOSTAS COMO LIDAS:", updateError);
          } else {
            setPropostas((prev) =>
              prev.map((item) =>
                idsNaoLidos.includes(item.id) ? { ...item, lida_cliente: true } : item
              )
            );
          }
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function traduzStatus(status: string) {
    if (status === "aceita") return "Aceita";
    if (status === "recusada") return "Recusada";
    return "Enviada";
  }

  function corStatus(status: string) {
    if (status === "aceita") return "#22c55e";
    if (status === "recusada") return "#ef4444";
    return "#facc15";
  }

  function corTextoStatus(status: string) {
    if (status === "enviada") return "#000";
    return "#fff";
  }

  const indicadores = useMemo(() => {
    const total = propostas.length;
    const aceitas = propostas.filter((item) => item.status === "aceita").length;
    const recusadas = propostas.filter((item) => item.status === "recusada").length;
    const enviadas = propostas.filter(
      (item) => !["aceita", "recusada"].includes(item.status)
    ).length;
    const valorMedio = propostas
      .filter((item) => item.valor !== null)
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const media = propostas.filter((item) => item.valor !== null).length;

    return {
      total,
      aceitas,
      recusadas,
      enviadas,
      ticketMedio: media > 0 ? valorMedio / media : 0,
      taxaAceite: total > 0 ? (aceitas / total) * 100 : 0,
    };
  }, [propostas]);

  const propostasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return propostas
      .filter((item) => {
        if (filtro === "aceita") return item.status === "aceita";
        if (filtro === "recusada") return item.status === "recusada";
        if (filtro === "enviada") return !["aceita", "recusada"].includes(item.status);
        return true;
      })
      .filter((item) => {
        if (!termo) return true;
        const servico = String(item.pedido_info?.servico || "").toLowerCase();
        const categoria = String(item.pedido_info?.categoria || "").toLowerCase();
        const descricao = String(item.descricao || item.mensagem || "").toLowerCase();
        return (
          servico.includes(termo) ||
          categoria.includes(termo) ||
          descricao.includes(termo)
        );
      });
  }, [propostas, filtro, busca]);

  function renderItem({ item }: { item: PropostaCliente }) {
    const dataFormatada = item.created_at
      ? new Date(item.created_at).toLocaleDateString("pt-BR")
      : "";

    return (
      <PressableScale
        style={styles.card}
        onPress={() => router.push(`/(cliente)/pedidos/${item.pedido_id}/proposta`)}
      >
        <View style={styles.headerRow}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.title}>
              {item.pedido_info?.servico || item.pedido_info?.categoria || "Pedido"}
            </Text>
            <Text style={styles.subtitleTiny}>Pedido #{item.pedido_id.slice(0, 8)}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: corStatus(item.status) }]}>
            <Text style={[styles.badgeText, { color: corTextoStatus(item.status) }]}>
              {traduzStatus(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={2}>
          {item.descricao || item.mensagem || "Sem descrição"}
        </Text>

        <Text style={styles.valor}>
          {item.valor !== null ? `R$ ${Number(item.valor).toFixed(2)}` : "Valor a combinar"}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.footerPill}>
            <Ionicons name="calendar-outline" size={12} color="#93c5fd" />
            <Text style={styles.footerPillText}>{dataFormatada}</Text>
          </View>
          <View style={styles.footerPill}>
            <Ionicons name="eye-outline" size={12} color="#cbd5e1" />
            <Text style={styles.footerPillText}>Abrir detalhes</Text>
          </View>
        </View>
      </PressableScale>
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
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
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
          <Text style={styles.pageTitle}>Minhas propostas</Text>
          <Text style={styles.subtitle}>Compare e acompanhe propostas em tempo real</Text>
        </View>
      </View>

      <View style={styles.executiveCard}>
        <View style={styles.executiveTop}>
          <Text style={styles.executiveTitle}>Resumo executivo</Text>
          <View style={styles.executiveBadge}>
            <Text style={styles.executiveBadgeText}>{indicadores.taxaAceite.toFixed(0)}% aceite</Text>
          </View>
        </View>
        <Text style={styles.executiveText}>
          Você possui {indicadores.enviadas} propostas ativas e ticket médio de R$ {indicadores.ticketMedio.toFixed(2)}.
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.aceitas}</Text>
          <Text style={styles.metricLabel}>Aceitas</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{indicadores.recusadas}</Text>
          <Text style={styles.metricLabel}>Recusadas</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>R$ {indicadores.ticketMedio.toFixed(0)}</Text>
          <Text style={styles.metricLabel}>Ticket médio</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar por serviço, categoria ou descrição"
        placeholderTextColor="#6b7280"
      />

      <View style={styles.filtersRow}>
        {[
          { id: "todas", label: "Todas" },
          { id: "aceita", label: "Aceitas" },
          { id: "recusada", label: "Recusadas" },
          { id: "enviada", label: "Enviadas" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterChip, filtro === item.id && styles.filterChipActive]}
            onPress={() => setFiltro(item.id as FiltroProposta)}
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
        {propostasFiltradas.length} de {propostas.length} propostas
      </Text>

      <FlatList
        data={propostasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarPropostas();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Nenhuma proposta encontrada.</Text>
            <Text style={styles.emptyText}>
              Ajuste os filtros ou aguarde novas propostas dos profissionais.
            </Text>
          </View>
        }
        contentContainerStyle={propostasFiltradas.length === 0 ? styles.emptyContent : { paddingBottom: 24 }}
      />
    </Animated.View>
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
  pageTitle: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  executiveCard: {
    marginTop: 14,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1b2640",
    borderRadius: 16,
    padding: 14,
  },
  executiveTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  executiveTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "800",
  },
  executiveBadge: {
    backgroundColor: "#082f49",
    borderWidth: 1,
    borderColor: "#155e75",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  executiveBadgeText: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "800",
  },
  executiveText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1b2640",
    paddingVertical: 10,
    alignItems: "center",
  },
  metricValue: {
    color: "#facc15",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
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
    marginTop: 10,
    marginBottom: 12,
    fontSize: 12,
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1b2640",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitleWrap: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    flex: 1,
    paddingRight: 8,
  },
  subtitleTiny: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontWeight: "800",
    fontSize: 12,
  },
  desc: {
    color: "#9ca3af",
    marginTop: 8,
  },
  valor: {
    color: "#22c55e",
    fontWeight: "900",
    marginTop: 10,
  },
  footerRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#233149",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  footerPillText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
  },
});
