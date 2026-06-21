import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Step2Descricao() {
  const { categoria } = useLocalSearchParams<{ categoria: string }>();
  const router = useRouter();
  const [descricao, setDescricao] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Descreva o serviço</Text>

      <TextInput
        style={styles.input}
        placeholder="Explique o que precisa..."
        placeholderTextColor="#6b7280"
        multiline
        value={descricao}
        onChangeText={setDescricao}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/(cliente)/pedidos/criar/confirmar",
            params: { categoria, servico: categoria, descricao },
          })
        }
      >
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", padding: 20 },
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#0b1220",
    color: "#fff",
    padding: 16,
    borderRadius: 14,
    height: 150,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { fontWeight: "900", color: "#000" },
});
