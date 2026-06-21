import { Ionicons } from "@expo/vector-icons";
import StatusChamadoRapido from "@/components/rapid/StatusChamadoRapido";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PedidoEnviado() {
  const router = useRouter();
  const { modo, disparados } = useLocalSearchParams<{ modo?: string; disparados?: string }>();
  const ehRapido = modo === "rapido";
  const totalDisparados = Number(disparados || 0);

  return (
    <View style={styles.container}>
      <Ionicons name={ehRapido ? "flash-outline" : "checkmark-circle"} size={72} color={ehRapido ? "#facc15" : "#22c55e"} />

      <Text style={styles.title}>
        {ehRapido ? "Seu chamado rápido está em andamento" : "Pedido enviado com sucesso"}
      </Text>

      <Text style={styles.subtitle}>
        {ehRapido
          ? "Seu chamado está sendo enviado para profissionais próximos."
          : "Agora é só aguardar as propostas dos profissionais."}
      </Text>

      {ehRapido ? (
        <View style={styles.statusWrap}>
          <StatusChamadoRapido mode="disparado" />
          <View style={styles.resumeCard}>
            <Text style={styles.resumeTitle}>Resumo do envio</Text>
            <Text style={styles.resumeText}>
              Chamado enviado para {totalDisparados} profissionais disponíveis.
            </Text>
            <Text style={styles.resumeHint}>
              Estamos aguardando a confirmação do primeiro profissional disponível.
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(tabs)/pedidos")}
      >
        <Text style={styles.buttonText}>Ver Meus Pedidos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.replace("/(tabs)/index")}
      >
        <Text style={styles.secondaryText}>Voltar para Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 20,
    textAlign: "center",
  },

  subtitle: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  statusWrap: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  resumeCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
  },
  resumeTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    marginBottom: 8,
  },
  resumeText: {
    color: "#e2e8f0",
    marginBottom: 6,
  },
  resumeHint: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },

  button: {
    backgroundColor: "#facc15",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginBottom: 15,
  },

  buttonText: {
    fontWeight: "900",
    color: "#000",
  },

  secondaryButton: {
    padding: 10,
  },

  secondaryText: {
    color: "#9ca3af",
  },
});
