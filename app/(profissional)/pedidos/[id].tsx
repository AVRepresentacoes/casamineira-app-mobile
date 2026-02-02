import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

type Pedido = {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  status?: string | null;
  valor?: number | null;
  created_at?: string | null;
  endereco?: string | null;
};

export default function PedidoDetalheProfissional() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const fetchPedido = async () => {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setPedido(data as any);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao carregar pedido");
      setPedido(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPedido();
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#e5e7eb", fontWeight: "900" }}>
          Pedido não encontrado
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{pedido.titulo || "Pedido"}</Text>
        <Text style={styles.sub}>Detalhes do serviço</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{pedido.status || "—"}</Text>

        <Text style={[styles.label, { marginTop: 14 }]}>Valor</Text>
        <Text style={styles.value}>
          {pedido.valor != null ? `R$ ${Number(pedido.valor).toFixed(2)}` : "—"}
        </Text>

        <Text style={[styles.label, { marginTop: 14 }]}>Descrição</Text>
        <Text style={styles.text}>{pedido.descricao || "Sem descrição"}</Text>

        <Text style={[styles.label, { marginTop: 14 }]}>Criado em</Text>
        <Text style={styles.text}>
          {pedido.created_at ? new Date(pedido.created_at).toLocaleString("pt-BR") : "—"}
        </Text>

        <Text style={[styles.label, { marginTop: 14 }]}>Endereço</Text>
        <Text style={styles.text}>{pedido.endereco || "—"}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#03040a", padding: 18 },

  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  sub: { color: "#9ca3af", marginTop: 4 },

  card: {
    marginHorizontal: 16,
    backgroundColor: "#071026",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  label: { color: "#9ca3af", fontWeight: "800" },
  value: { color: "#e5e7eb", fontWeight: "900", marginTop: 6 },

  text: { color: "#e5e7eb", marginTop: 6, lineHeight: 22 },

  btn: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#000", fontWeight: "900" },
});
