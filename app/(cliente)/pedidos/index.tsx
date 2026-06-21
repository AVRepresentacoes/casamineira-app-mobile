import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setPedidos([]);
        return;
      }

      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("cliente_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("ERRO LISTAR PEDIDOS CLIENTE:", error);
        setPedidos([]);
      } else {
        setPedidos(data || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <FlatList
      data={pedidos}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            carregarPedidos();
          }}
        />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(cliente)/pedidos/${item.id}`)}
        >
          <Text style={styles.titulo}>{item.servico || item.categoria}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhum pedido encontrado.</Text>
      }
      contentContainerStyle={pedidos.length === 0 ? styles.emptyWrap : undefined}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  card: {
    backgroundColor: "#111827",
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  titulo: { color: "#fff", fontWeight: "bold" },
  status: { color: "#facc15" },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    color: "#9ca3af",
  },
});
