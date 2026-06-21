import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function EscolherCadastro() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icons/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Casa Mineira Serviços</Text>
      <Text style={styles.subtitle}>Escolha como deseja se cadastrar</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(auth)/cadastro-cliente")}
      >
        <Text style={styles.buttonText}>Cadastro Cliente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(auth)/cadastro-profissional")}
      >
        <Text style={styles.buttonText}>Cadastro Profissional</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(auth)/cadastro-fornecedor")}
      >
        <Text style={styles.buttonText}>Cadastro Fornecedor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  logo: {
    width: 190,
    height: 190,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 35,
  },
  button: {
    width: "100%",
    height: 55,
    backgroundColor: "#FACC15",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
