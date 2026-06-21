import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PedidoCardProps {
  pedido: {
    id: string;
    titulo: string;
    categoria: string;
    valor: number | null;
    cidade: string;
    distancia_km: number | null;
    urgente: boolean;
  };
}

export function PedidoCard({ pedido }: PedidoCardProps) {
  return (
    <View style={styles.card}>
      {pedido.urgente && (
        <View style={styles.badges}>
          <Text style={[styles.badge, styles.badgeUrgente]}>Urgente</Text>
        </View>
      )}

      <Text style={styles.cardTitle}>{pedido.titulo}</Text>
      <Text style={styles.cardSub}>{pedido.categoria}</Text>

      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={16} color="#9ca3af" />
        <Text style={styles.cardText}>
          {pedido.cidade} •{" "}
          {pedido.distancia_km !== null
            ? `${pedido.distancia_km} km`
            : "-- km"}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="cash-outline" size={16} color="#9ca3af" />
        <Text style={styles.cardValue}>
          {pedido.valor !== null
            ? `R$ ${pedido.valor.toFixed(2)}`
            : "Valor a combinar"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => router.push(`/(profissional)/pedidos/${pedido.id}`)}
      >
        <Text style={styles.btnText}>Ver detalhes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  badges: {
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  badgeUrgente: {
    backgroundColor: "#7f1d1d",
    color: "#fff",
  },
  cardTitle: {
    color: "#facc15",
    fontSize: 16,
    fontWeight: "800",
  },
  cardSub: {
    color: "#9ca3af",
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardText: {
    color: "#9ca3af",
  },
  cardValue: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  btnPrimary: {
    backgroundColor: "#facc15",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
});
