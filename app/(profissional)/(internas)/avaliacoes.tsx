import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";

type Avaliacao = {
  id: string;
  nota: number;
  comentario: string;
  created_at: string;
};

export default function AvaliacoesProfissional() {
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState(0);
  const [total, setTotal] = useState(0);
  const [lista, setLista] = useState<Avaliacao[]>([]);

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, created_at")
        .eq("avaliado_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("ERRO AVALIACOES PROFISSIONAL:", error);
        Alert.alert("Erro", "Não foi possível carregar avaliações.");
        setLoading(false);
        return;
      }

      const listaData = (data || []) as Avaliacao[];
      setLista(listaData);
      setTotal(listaData.length);

      if (listaData.length > 0) {
        const soma = listaData.reduce((acc, a) => acc + (a.nota || 0), 0);
        setMedia(soma / listaData.length);
      } else {
        setMedia(0);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  const distribuicao = [5, 4, 3, 2, 1].map((estrela) => {
    const count = lista.filter((item) => item.nota === estrela).length;
    const percentual = total > 0 ? (count / total) * 100 : 0;
    return { estrela, count, percentual };
  });
  const excelente = lista.filter((item) => item.nota === 5).length;
  const positivas = lista.filter((item) => item.nota >= 4).length;

  const header = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="star-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Reputação do perfil</Text>
            <Text style={styles.title}>Avaliações</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Monitore sua reputação, entenda a distribuição das notas e acompanhe sinais de excelência percebidos pelos clientes.
        </Text>
      </View>

      {/* RESUMO */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Nota média</Text>
          <Text style={styles.value}>
            {media.toFixed(1)} ⭐
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total de avaliações</Text>
          <Text style={styles.value}>{total}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Avaliações 5 estrelas</Text>
          <Text style={styles.value}>{excelente}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Distribuição de notas</Text>
        {distribuicao.map((item) => (
          <View key={item.estrela} style={styles.distRow}>
            <Text style={styles.distLabel}>{item.estrela}★</Text>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${item.percentual}%` }]} />
            </View>
            <Text style={styles.distValue}>{item.count}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Meta mensal</Text>
          <Text style={styles.chipValue}>{media >= 4.8 ? "Elite" : media >= 4.3 ? "Excelente" : "Em evolução"}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Retenção de clientes</Text>
          <Text style={styles.chipValue}>{total >= 15 ? "Alta" : "Média"}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Sentimento positivo</Text>
          <Text style={styles.chipValue}>{total > 0 ? `${Math.round((positivas / total) * 100)}%` : "0%"}</Text>
        </View>
      </ScrollView>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={lista}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.nota}>
            {"⭐".repeat(item.nota)}
          </Text>
          <Text style={styles.comentario}>
            {item.comentario || "Sem comentário"}
          </Text>
          <Text style={styles.data}>
            {new Date(item.created_at).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Ionicons name="star-outline" size={24} color="#facc15" />
          <Text style={styles.emptyTitle}>Nenhuma avaliação ainda</Text>
          <Text style={styles.empty}>
            Quando os clientes começarem a avaliar sua operação, a reputação aparece aqui.
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#03040a",
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
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
  heroText: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: "#081121",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: "#9ca3af",
    fontWeight: "700",
  },
  value: {
    color: "#22c55e",
    fontWeight: "900",
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distLabel: {
    color: "#9ca3af",
    width: 36,
    fontWeight: "700",
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#1f2937",
    overflow: "hidden",
    marginRight: 8,
  },
  trackFill: {
    height: "100%",
    backgroundColor: "#facc15",
  },
  distValue: {
    color: "#e5e7eb",
    width: 24,
    textAlign: "right",
    fontWeight: "900",
  },
  chipRow: {
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    minWidth: 150,
    borderWidth: 1,
    borderColor: "#26466f",
    backgroundColor: "#081121",
    borderRadius: 18,
    padding: 12,
  },
  chipLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  chipValue: {
    color: "#facc15",
    fontWeight: "900",
    marginTop: 5,
  },
  item: {
    backgroundColor: "#081121",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  nota: {
    color: "#facc15",
    fontWeight: "900",
  },
  comentario: {
    color: "#e5e7eb",
    marginTop: 6,
  },
  data: {
    color: "#6b7280",
    marginTop: 6,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 18,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  empty: {
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
