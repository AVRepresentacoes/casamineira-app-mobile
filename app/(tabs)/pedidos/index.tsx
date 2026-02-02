import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

type Pedido = {
  id: string;
  titulo?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function PedidosScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);

      // ✅ Ajuste aqui se sua tabela tiver outro nome
      const { data, error } = await supabase
        .from("pedidos")
        .select("id,titulo,status,created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      setPedidos((data || []) as any);
    } catch (e: any) {
      console.log("Erro pedidos:", e?.message);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos</Text>
      <Text style={styles.sub}>Lista de pedidos reais do sistema</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#facc15" />
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          {pedidos.length === 0 ? (
            <Text style={styles.empty}>Nenhum pedido encontrado.</Text>
          ) : (
            pedidos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.item}
                onPress={() => router.push(`/pedidos/${p.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{p.titulo || "Pedido"}</Text>
                  <Text style={styles.itemSub}>Status: {p.status || "—"}</Text>
                </View>
                <Text style={styles.itemArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", padding: 16 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  sub: { color: "#9ca3af", marginTop: 4 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  empty: { color: "#9ca3af", marginTop: 14 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    backgroundColor: "#071026",
    gap: 12,
  },
  itemTitle: { color: "#e6e7e9", fontWeight: "900", fontSize: 15 },
  itemSub: { color: "#9ca3af", marginTop: 6, fontSize: 13 },
  itemArrow: { color: "#facc15", fontSize: 26, fontWeight: "900" },
});
