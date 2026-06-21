import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DetalhesServico() {
  const { servico, categoria } = useLocalSearchParams<{
    servico: string;
    categoria: string;
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
      <Text style={styles.title}>{servico}</Text>

      <Text style={styles.label}>Descreva o que você precisa:</Text>

      <TextInput
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Explique o serviço..."
        placeholderTextColor="#6b7280"
        style={styles.input}
        multiline
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
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
  },
  label: {
    color: "#9ca3af",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0b1220",
    color: "#fff",
    padding: 14,
    borderRadius: 14,
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
  },
});
