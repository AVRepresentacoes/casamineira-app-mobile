import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

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
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data, error } = await supabase
      .from("avaliacoes")
      .select("id, nota, comentario, created_at")
      .eq("profissional_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLista(data);
      setTotal(data.length);

      if (data.length > 0) {
        const soma = data.reduce((acc, a) => acc + (a.nota || 0), 0);
        setMedia(soma / data.length);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avaliações</Text>

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
      </View>

      {/* LISTA */}
      <FlatList
        data={lista}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 120 }}
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
          <Text style={styles.empty}>
            Nenhuma avaliação ainda.
          </Text>
        }
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#03040a",
  },
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 12,
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
  item: {
    backgroundColor: "#071026",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 10,
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
  empty: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
});
