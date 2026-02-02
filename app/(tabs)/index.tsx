import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import RaioAtuacaoModal from "../components/RaioAtuacaoModal";

type Pedido = {
  id: string;
  titulo: string;
  descricao: string;
  created_at: string;
};

export default function InicioProfissional() {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [modalRaio, setModalRaio] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("pedidos")
      .select("id, titulo, descricao, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setPedidos(data as Pedido[]);
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
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Início</Text>

        <Text style={styles.raio}>
          Pedidos próximos ao seu CEP •{" "}
          <Text style={styles.editar} onPress={() => setModalRaio(true)}>
            Editar
          </Text>
        </Text>
      </View>

      {/* BANNERS (placeholder) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.banners}
      >
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.banner}>
            <Text style={styles.bannerText}>Banner {i}</Text>
          </View>
        ))}
      </ScrollView>

      {/* LISTA DE PEDIDOS */}
      <ScrollView
        style={styles.lista}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {pedidos.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma solicitação no momento.</Text>
        ) : (
          pedidos.map((p) => (
            <TouchableOpacity key={p.id} style={styles.card}>
              <Text style={styles.cardTitulo}>{p.titulo}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {p.descricao}
              </Text>
              <Text style={styles.cardData}>
                {new Date(p.created_at).toLocaleString("pt-BR")}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MODAL RAIO */}
      <RaioAtuacaoModal
        visible={modalRaio}
        onClose={() => setModalRaio(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  center: {
    flex: 1,
    backgroundColor: "#03040a",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
  },
  raio: {
    color: "#9ca3af",
    marginTop: 6,
    fontWeight: "600",
  },
  editar: {
    color: "#facc15",
    fontWeight: "900",
  },
  banners: {
    paddingLeft: 16,
    marginTop: 10,
  },
  banner: {
    width: 260,
    height: 120,
    backgroundColor: "#071026",
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#0b1220",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerText: {
    color: "#9ca3af",
    fontWeight: "800",
  },
  lista: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  vazio: {
    color: "#9ca3af",
    marginTop: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  cardTitulo: {
    color: "#facc15",
    fontSize: 16,
    fontWeight: "900",
  },
  cardDesc: {
    color: "#e5e7eb",
    marginTop: 6,
  },
  cardData: {
    color: "#6b7280",
    marginTop: 8,
    fontSize: 12,
  },
});
