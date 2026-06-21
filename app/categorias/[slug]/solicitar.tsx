import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SolicitarServico() {
  const { servico, slug } = useLocalSearchParams<{
    servico: string;
    slug: string;
  }>();

  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Chegou a hora de pedir 🎉</Text>

      <Text style={styles.texto}>
        Você está solicitando o serviço:
      </Text>

      <Text style={styles.servico}>{servico}</Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={() =>
          router.push(`/categorias/${slug}/detalhes?servico=${servico}`)
        }
      >
        <Text style={styles.botaoTexto}>Iniciar solicitação</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    justifyContent: "center",
    padding: 24,
  },
  titulo: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  texto: { 
    color: "#9ca3af", 
    marginBottom: 6 
  },
  servico: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 24,
  },
  botao: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  botaoTexto: { 
    color: "#000", 
    fontWeight: "900" 
  },
});