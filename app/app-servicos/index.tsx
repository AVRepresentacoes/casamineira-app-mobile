import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppServicosEntryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="construct-outline" size={24} color="#08101c" />
        </View>
        <Text style={styles.eyebrow}>Produto separado</Text>
        <Text style={styles.title}>Casa Mineira Serviços</Text>
        <Text style={styles.body}>
          Este é o app operacional para clientes solicitarem profissionais. Ele não é o login principal da Casa Mineira SaaS.
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.primaryButtonText}>Abrir app de serviços</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/login")}>
            <Text style={styles.secondaryButtonText}>Voltar ao SaaS</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A12",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 28,
    gap: 14,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
  },
  body: {
    color: "#a8b5c7",
    lineHeight: 24,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: "#facc15",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.16)",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
});
