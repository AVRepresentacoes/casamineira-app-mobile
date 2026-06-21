import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CriarPedidoStep1() {
  const { categoria, servico } = useLocalSearchParams<{
    categoria: string;
    servico: string;
  }>();

  const router = useRouter();
  const [descricao, setDescricao] = useState("");

  function continuar() {
    if (!descricao.trim()) return;

    router.push({
      pathname: "/(cliente)/pedidos/criar/confirmar",
      params: {
        categoria,
        servico,
        descricao,
      },
    });
  }

  return (
    <View style={styles.container}>
      
      {/* Barra de progresso */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: "33%" }]} />
      </View>
      <Text style={styles.step}>Passo 1 de 3</Text>

      <Text style={styles.title}>{servico}</Text>
      <Text style={styles.subtitle}>
        Descreva o que você precisa
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex: Preciso trocar a fiação da sala..."
        placeholderTextColor="#6b7280"
        multiline
        value={descricao}
        onChangeText={setDescricao}
      />

      <TouchableOpacity style={styles.button} onPress={continuar}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  progressContainer: {
    height: 6,
    backgroundColor: "#111827",
    borderRadius: 10,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#facc15",
    borderRadius: 10,
  },
  step: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 20,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#0b1220",
    color: "#fff",
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#111827",
  },
  button: {
    backgroundColor: "#facc15",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    fontWeight: "900",
    color: "#000",
  },
});