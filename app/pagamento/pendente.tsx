import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PressableScale from "@/components/PressableScale";

export default function PagamentoPendente() {
  const router = useRouter();
  const { pedido_id } = useLocalSearchParams<{ pedido_id?: string }>();

  function voltarParaPagamento() {
    if (pedido_id) {
      router.replace({
        pathname: "/(cliente)/pedidos/[id]/pagar",
        params: { id: pedido_id },
      });
      return;
    }

    router.replace("/(tabs)/pedidos");
  }

  return (
    <View style={styles.container}>
      <Ionicons name="time" size={52} color="#facc15" />
      <Text style={styles.title}>Pagamento pendente</Text>
      <Text style={styles.description}>
        O pagamento ainda esta em analise. Volte ao pedido para atualizar o status.
      </Text>

      <PressableScale style={styles.button} onPress={voltarParaPagamento}>
        <Text style={styles.buttonText}>Voltar ao pedido</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070f",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    color: "#e5e7eb",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: "#9ca3af",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 360,
  },
  button: {
    marginTop: 12,
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#111827",
    fontWeight: "800",
  },
});
