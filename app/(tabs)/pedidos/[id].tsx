import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

export default function PedidoDetalhe() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();

    setPedido(data);
  }

  async function atualizar(status: string) {
    await supabase.from("pedidos").update({ status }).eq("id", id);
    router.back();
  }

  if (!pedido) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{pedido.titulo}</Text>
      <Text style={styles.desc}>{pedido.descricao}</Text>

      <TouchableOpacity
        style={[styles.btn, styles.accept]}
        onPress={() => atualizar("aceito")}
      >
        <Text style={styles.btnText}>Aceitar pedido</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.reject]}
        onPress={() => atualizar("recusado")}
      >
        <Text style={styles.btnText}>Recusar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#05070d", padding: 20 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  desc: { color: "#cbd5f5", marginVertical: 16 },
  btn: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  accept: { backgroundColor: "#22c55e" },
  reject: { backgroundColor: "#ef4444" },
  btnText: { color: "#000", fontWeight: "900" },
});
