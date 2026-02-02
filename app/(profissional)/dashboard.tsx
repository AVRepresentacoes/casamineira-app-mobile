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
import { supabase } from "../../lib/supabase";

type Pedido = {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  status?: string | null;
  created_at?: string | null;
  cliente_nome?: string | null;
};

export default function DashboardProfissional() {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);

      // ✅ Ajuste se sua tabela tiver outro nome ou colunas diferentes
      const { data, error } = await supabase
        .from("pedidos")
        .select("id,titulo,descricao,status,created_at,cliente_nome")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // ✅ Aqui filtra só os pedidos novos/em aberto
      const filtrados = (data || []).filter((p: any) =>
        ["novo", "aberto", "pendente"].includes(String(p.status || "").toLowerCase())
      );

      setPedidos(filtrados as any);
    } catch (e: any) {
      console.log("Erro dashboard profissional:", e?.message);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: string, status: "aceito" | "recusado") => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("✅ Sucesso", `Pedido ${status.toUpperCase()}!`);
      fetchPedidos();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao atualizar pedido");
    }
  };

  useEffect(() => {
    fetchPedidos();

    // ✅ Realtime pra atualizar sozinho
    const channel = supabase
      .channel("pedidos-profissional-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => fetchPedidos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Profissional</Text>
        <Text style={styles.sub}>Pedidos disponíveis para você pegar</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#facc15" />
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>Nenhum pedido novo no momento.</Text>
          <Text style={styles.tip}>Assim que entrar um pedido, aparece aqui automaticamente.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {pedidos.map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.cardTitle}>{p.titulo || "Pedido"}</Text>

              {!!p.cliente_nome && (
                <Text style={styles.line}>Cliente: {p.cliente_nome}</Text>
              )}

              {!!p.descricao && (
                <Text style={styles.desc}>{p.descricao}</Text>
              )}

              <Text style={styles.line}>
                Status: <Text style={{ color: "#facc15" }}>{p.status || "—"}</Text>
              </Text>

              <Text style={styles.date}>
                {p.created_at ? new Date(p.created_at).toLocaleString("pt-BR") : ""}
              </Text>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnAccept]}
                  onPress={() => atualizarStatus(p.id, "aceito")}
                >
                  <Text style={styles.btnTextBlack}>Aceitar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnReject]}
                  onPress={() => atualizarStatus(p.id, "recusado")}
                >
                  <Text style={styles.btnText}>Recusar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },

  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  sub: { color: "#9ca3af", marginTop: 4 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },

  card: {
    marginHorizontal: 16,
    backgroundColor: "#071026",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  cardTitle: { color: "#e6e7e9", fontWeight: "900", fontSize: 16 },
  line: { color: "#9ca3af", marginTop: 8, fontWeight: "700" },
  desc: { color: "#e6e7e9", marginTop: 10, lineHeight: 20 },

  date: { color: "#6b7280", marginTop: 10, fontSize: 12 },

  empty: { color: "#e6e7e9", fontWeight: "900", fontSize: 15 },
  tip: { color: "#9ca3af", marginTop: 8 },

  buttons: { flexDirection: "row", gap: 10, marginTop: 14 },

  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  btnAccept: { backgroundColor: "#facc15" },
  btnReject: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#03040a",
  },

  btnText: { color: "#9ca3af", fontWeight: "900" },
  btnTextBlack: { color: "#000", fontWeight: "900" },
});
