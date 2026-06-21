import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";

type Notificacao = {
  id: string;
  titulo: string;
  detalhe: string;
  created_at: string;
  tone: string;
};

export default function NotificacoesProfissional() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);

  const carregar = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setLista([]);
        return;
      }

      const [propostasRes, eventosRes] = await Promise.all([
        supabase
          .from("propostas")
          .select("id, status, created_at, pedido_id")
          .eq("profissional_id", uid)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("analytics_eventos")
          .select("id, evento, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const propostaItems: Notificacao[] = (propostasRes.data || []).map((p) => ({
        id: `prop_${p.id}`,
        titulo:
          p.status === "aceita"
            ? "Proposta aceita"
            : p.status === "recusada"
            ? "Proposta recusada"
            : "Proposta em análise",
        detalhe: `Pedido #${String(p.pedido_id || "").slice(0, 8)}`,
        created_at: String(p.created_at),
        tone: p.status === "aceita" ? "#22c55e" : p.status === "recusada" ? "#f87171" : "#facc15",
      }));

      const eventoItems: Notificacao[] = (eventosRes.data || []).map((e) => ({
        id: `ev_${e.id}`,
        titulo: "Evento operacional",
        detalhe: String(e.evento || "Atualização").replaceAll("_", " "),
        created_at: String(e.created_at),
        tone: "#38bdf8",
      }));

      const merged = [...propostaItems, ...eventoItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setLista(merged.slice(0, 20));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);
  const criticas = lista.filter((item) => item.tone === "#f87171").length;
  const positivas = lista.filter((item) => item.tone === "#22c55e").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#facc15" />}
    >
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="notifications-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Radar operacional</Text>
            <Text style={styles.title}>Central de notificações</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Consolide respostas de propostas e sinais operacionais em uma fila única de leitura executiva.
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Positivas</Text>
            <Text style={styles.metricValue}>{positivas}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Críticas</Text>
            <Text style={styles.metricValue}>{criticas}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{lista.length}</Text>
          </View>
        </View>
      </View>

      {lista.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={24} color="#facc15" />
          <Text style={styles.emptyTitle}>Sem notificações por enquanto</Text>
          <Text style={styles.empty}>Quando houver movimentação operacional ou propostas, tudo aparece aqui.</Text>
        </View>
      ) : (
        lista.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={[styles.dot, { backgroundColor: item.tone }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardText}>{item.detalhe}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString("pt-BR")}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020617" },
  heroCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  heroText: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  metricsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  metricCard: { flex: 1, backgroundColor: "#0c172d", borderWidth: 1, borderColor: "#304767", borderRadius: 16, padding: 12 },
  metricLabel: { color: "#94a3b8", fontSize: 11 },
  metricValue: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 6 },
  card: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 999, marginTop: 6 },
  cardTitle: { color: "#e5e7eb", fontWeight: "900" },
  cardText: { color: "#9ca3af", marginTop: 4 },
  date: { color: "#64748b", marginTop: 6, fontSize: 12 },
  emptyCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  empty: { color: "#6b7280", textAlign: "center", lineHeight: 20 },
});
