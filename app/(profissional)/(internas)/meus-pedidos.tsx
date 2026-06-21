import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: string | number;
  categoria?: string | null;
  servico?: string | null;
  descricao?: string | null;
  status?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  created_at?: string | null;
};

export default function MeusPedidosProfissional() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPedidos([]);
        return;
      }

      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("profissional_id", user.id)
        .in("status", ["proposta_recebida", "aceita", "em_execucao", "finalizado"])
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Erro ao carregar meus pedidos:", error);
        setPedidos([]);
        return;
      }

      setPedidos((data as Pedido[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const statusLabel = (status?: string | null) => {
    if (status === "proposta_recebida") return "Negociação";
    if (status === "aceita") return "Aceito";
    if (status === "em_execucao") return "Em execução";
    if (status === "finalizado") return "Finalizado";
    return "Em andamento";
  };

  const statusStyle = (status?: string | null) => {
    if (status === "proposta_recebida") return styles.statusNegociacao;
    if (status === "aceita") return styles.statusAceito;
    if (status === "em_execucao") return styles.statusExecucao;
    if (status === "finalizado") return styles.statusFinalizado;
    return styles.statusDefault;
  };
  const negociacaoCount = pedidos.filter((item) => item.status === "proposta_recebida").length;
  const execucaoCount = pedidos.filter((item) => item.status === "em_execucao").length;
  const finalizadosCount = pedidos.filter((item) => item.status === "finalizado").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.headerRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="clipboard-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Carteira ativa</Text>
            <Text style={styles.title}>Meus pedidos</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Pedidos em negociação, aceitos ou em execução, organizados para leitura rápida e acompanhamento profissional.
        </Text>
        <View style={styles.heroTips}>
          <View style={styles.tipChip}>
            <Ionicons name="checkmark-done-outline" size={14} color="#facc15" />
            <Text style={styles.tipText}>Acompanhe entregas</Text>
          </View>
          <View style={styles.tipChip}>
            <Ionicons name="time-outline" size={14} color="#facc15" />
            <Text style={styles.tipText}>Priorize execução</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Negociação</Text>
            <Text style={styles.metricValue}>{negociacaoCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Em execução</Text>
            <Text style={styles.metricValue}>{execucaoCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Finalizados</Text>
            <Text style={styles.metricValue}>{finalizadosCount}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} tintColor="#facc15" />}
        contentContainerStyle={pedidos.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Você ainda não possui pedidos em negociação/aceitos.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(profissional)/pedidos/${item.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <Text style={styles.categoria}>{item.categoria || "Pedido"}</Text>
              <Text style={[styles.status, statusStyle(item.status)]}>{statusLabel(item.status)}</Text>
            </View>

            <Text style={styles.servico}>{item.servico || "Serviço não informado"}</Text>

            <Text style={styles.local}>
              {item.bairro || "Bairro"} - {item.cidade || "Cidade"}
            </Text>

            <Text style={styles.descricao} numberOfLines={2}>
              {item.descricao || "Sem descrição adicional."}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    padding: 16,
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#03040a",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
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
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#9ca3af",
    lineHeight: 20,
  },
  heroTips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#304767",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tipText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0c172d",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#304767",
    padding: 12,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  list: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoria: {
    color: "#facc15",
    fontWeight: "800",
  },
  status: {
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  statusNegociacao: {
    backgroundColor: "#1f2937",
    color: "#facc15",
  },
  statusAceito: {
    backgroundColor: "#052e1f",
    color: "#22c55e",
  },
  statusExecucao: {
    backgroundColor: "#082f49",
    color: "#38bdf8",
  },
  statusFinalizado: {
    backgroundColor: "#0f2d20",
    color: "#34d399",
  },
  statusDefault: {
    backgroundColor: "#1f2937",
    color: "#cbd5e1",
  },
  servico: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 6,
  },
  local: {
    color: "#94a3b8",
    marginBottom: 6,
  },
  descricao: {
    color: "#9ca3af",
  },
});
