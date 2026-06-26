import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe seu e-mail para receber o link de recuperação.");
      return;
    }

    Alert.alert(
      "Recuperação de senha",
      "Fluxo visual preparado. A integração real com recuperação de senha será conectada em uma etapa futura.",
    );
  }

  return (
    <View style={styles.page}>
      <LinearGradient colors={["#08101f", "#050914", "#0b1221"]} style={styles.shell}>
        <View style={styles.card}>
          <Pressable style={styles.backButton} onPress={() => router.replace("/login")} accessibilityRole="button">
            <Ionicons name="arrow-back" size={18} color="#cbd5e1" />
            <Text style={styles.backText}>Voltar para login</Text>
          </Pressable>

          <View style={styles.iconWrap}>
            <Ionicons name="key-outline" size={26} color="#dbe8ff" />
          </View>

          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>
            Informe seu e-mail e enviaremos um link de recuperação quando o fluxo estiver conectado.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            placeholder="seu@email.com"
            placeholderTextColor="#7c8798"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryText}>Enviar link de recuperação</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#050914",
  },
  shell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(13, 20, 34, 0.98)",
    padding: 24,
    gap: 14,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  backText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 92, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 255, 0.32)",
    marginTop: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: "#aeb8c8",
    fontSize: 14,
    lineHeight: 22,
  },
  label: {
    color: "#d6deea",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2c3648",
    backgroundColor: "#111827",
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c5cff",
    marginTop: 6,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
});
