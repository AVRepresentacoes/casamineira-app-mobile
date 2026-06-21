import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PressableScale from "@/components/PressableScale";
import { supabase } from "@/lib/supabase";

interface Proposta {
  id: string;
  pedido_id: string;
  valor: number | null;
  descricao?: string | null;
  mensagem?: string | null;
  status: string;
  created_at: string;
  pagamento_aprovado?: boolean;
}

type Filtro = "todas" | "aceita" | "recusada" | "analise";
type FiltroAtualizado = Filtro | "pagas";

function statusLabel(status: string) {
  if (status === "aceita") return "Aceita";
  if (status === "recusada") return "Recusada";
  return "Em análise";
}

function diasEmAnalise(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function MinhasPropostasProfissional() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroAtualizado>("todas");

  const carregarPropostas = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPropostas([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("propostas")
      .select("id, pedido_id, valor, descricao, mensagem, status, created_at")
      .eq("profissional_id", user.id)
      .order("created_at", { ascending: false });

      if (error) {
        setErro(error.message);
        setPropostas([]);
      } else {
        const lista = ((data || []) as Proposta[]);
        const pedidoIds = Array.from(new Set(lista.map((item) => String(item.pedido_id))));

        const pagamentoPorPedido: Record<string, boolean> = {};
        if (pedidoIds.length > 0) {
          const { data: pagamentos } = await supabase
            .from("pagamentos")
            .select("pedido_id, status_pagamento, status_pagamentos")
            .in("pedido_id", pedidoIds);

          for (const pg of (pagamentos || []) as any[]) {
            const pedidoId = String(pg?.pedido_id || "");
            if (!pedidoId) continue;
            const status = String(pg?.status_pagamento || pg?.status_pagamentos || "").toLowerCase();
            if (status === "aprovada") {
              pagamentoPorPedido[pedidoId] = true;
            }
          }
        }

        setPropostas(
          lista.map((item) => ({
            ...item,
            pagamento_aprovado: Boolean(pagamentoPorPedido[String(item.pedido_id)]),
          }))
        );
      }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPropostas();
    }, [carregarPropostas]),
  );

  const filtradas = useMemo(() => {
    if (filtro === "todas") return propostas;
    if (filtro === "aceita") return propostas.filter((p) => p.status === "aceita");
    if (filtro === "recusada") return propostas.filter((p) => p.status === "recusada");
    if (filtro === "pagas") return propostas.filter((p) => p.status === "aceita" && p.pagamento_aprovado);
    return propostas.filter((p) => p.status !== "aceita" && p.status !== "recusada");
  }, [filtro, propostas]);

  const totalAceitas = propostas.filter((p) => p.status === "aceita").length;
  const emAnalise = propostas.filter((p) => p.status !== "aceita" && p.status !== "recusada").length;
  const taxaAceite = propostas.length > 0 ? (totalAceitas / propostas.length) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  const header = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.headerRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="send-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Pipeline comercial</Text>
            <Text style={styles.header}>Minhas propostas</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Acompanhe o desempenho das propostas enviadas, identifique follow-ups e priorize oportunidades com maior chance de fechamento.
        </Text>
        <View style={styles.heroTips}>
          <View style={styles.tipChip}>
            <Ionicons name="sparkles-outline" size={14} color="#facc15" />
            <Text style={styles.tipText}>Acompanhe propostas quentes</Text>
          </View>
          <View style={styles.tipChip}>
            <Ionicons name="cash-outline" size={14} color="#facc15" />
            <Text style={styles.tipText}>Monitore conversão</Text>
          </View>
        </View>
      </View>

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total enviadas</Text>
          <Text style={styles.statValue}>{propostas.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Taxa de aceite</Text>
          <Text style={[styles.statValue, { color: "#22c55e" }]}>{taxaAceite.toFixed(1)}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Em análise</Text>
          <Text style={[styles.statValue, { color: "#facc15" }]}>{emAnalise}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        <FilterButton active={filtro === "todas"} text="Todas" onPress={() => setFiltro("todas")} />
        <FilterButton active={filtro === "aceita"} text="Aceitas" onPress={() => setFiltro("aceita")} />
        <FilterButton active={filtro === "pagas"} text="Pagas" onPress={() => setFiltro("pagas")} />
        <FilterButton active={filtro === "analise"} text="Análise" onPress={() => setFiltro("analise")} />
        <FilterButton active={filtro === "recusada"} text="Recusadas" onPress={() => setFiltro("recusada")} />
      </ScrollView>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={filtradas}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={carregarPropostas} tintColor="#facc15" />}
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma proposta nesse filtro.</Text>}
      renderItem={({ item }) => {
        const emDias = diasEmAnalise(item.created_at);
        const mostrarFollowup = item.status !== "aceita" && item.status !== "recusada" && emDias >= 2;

        return (
          <PressableScale style={styles.card} onPress={() => router.push(`/(profissional)/pedidos/${item.pedido_id}`)}>
            <View style={styles.rowBetween}>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("pt-BR")}</Text>
              {item.status === "aceita" ? (
                <View style={styles.statusRow}>
                  <Text style={[styles.statusTag, styles.statusAceita]}>Aceita</Text>
                  {item.pagamento_aprovado ? (
                    <Text style={[styles.statusTag, styles.statusPaga]}>Paga</Text>
                  ) : null}
                </View>
              ) : (
                <Text
                  style={[
                    styles.statusTag,
                    item.status === "recusada" ? styles.statusRecusada : styles.statusEnviada,
                  ]}
                >
                  {statusLabel(item.status)}
                </Text>
              )}
            </View>

            <Text style={styles.title}>Pedido #{item.pedido_id.slice(0, 8)}</Text>
            <Text style={styles.text}>Valor: {item.valor !== null ? `R$ ${item.valor.toFixed(2)}` : "A combinar"}</Text>
            <Text style={styles.text}>{item.descricao || item.mensagem || "Sem mensagem cadastrada"}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Validade sugerida: 7 dias</Text>
              {mostrarFollowup ? <Text style={styles.followup}>Follow-up recomendado</Text> : null}
            </View>
          </PressableScale>
        );
      }}
    />
  );
}

function FilterButton({
  active,
  text,
  onPress,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <PressableScale style={[styles.filterBtn, active && styles.filterBtnActive]} onPress={onPress}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{text}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
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
  header: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
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
  heroText: {
    color: "#94a3b8",
    fontSize: 13,
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
  error: {
    color: "#f87171",
    marginBottom: 10,
    fontWeight: "700",
  },
  statsGrid: {
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 12,
    minHeight: 86,
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
  },
  statValue: {
    color: "#facc15",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  filterScroll: {
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0c172d",
  },
  filterBtnActive: {
    borderColor: "#facc15",
    backgroundColor: "#facc15",
  },
  filterText: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 12,
  },
  filterTextActive: {
    color: "#0B0F1A",
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  date: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  statusTag: {
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  statusEnviada: {
    color: "#facc15",
    backgroundColor: "#1f2937",
  },
  statusAceita: {
    color: "#22c55e",
    backgroundColor: "#052e1f",
  },
  statusPaga: {
    color: "#bfdbfe",
    backgroundColor: "#1e3a8a",
  },
  statusRecusada: {
    color: "#f87171",
    backgroundColor: "#3b0a0a",
  },
  title: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  text: {
    color: "#e5e7eb",
    marginBottom: 4,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: {
    color: "#64748b",
    fontSize: 12,
  },
  followup: {
    color: "#facc15",
    fontWeight: "800",
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    color: "#9ca3af",
    textAlign: "center",
  },
});
