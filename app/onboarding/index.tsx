import { useRouter } from "expo-router";
import React from "react";
import { useBranding } from "@/hooks/useBranding";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingIndex() {
  const router = useRouter();
  const { branding } = useBranding();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: branding.primaryColor }]}>{branding.appName}</Text>
      <Text style={styles.sub}>
        Serviços rápidos, profissionais verificados e pagamento seguro.
      </Text>

      <TouchableOpacity
        style={[styles.primary, { backgroundColor: branding.primaryColor }]}
        onPress={() => router.push("/(auth)/cadastro-opcao")}
      >
        <Text style={styles.primaryText}>Continuar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondary} onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.secondaryText}>Já tenho conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", padding: 22, justifyContent: "center" },
  title: { color: "#facc15", fontSize: 26, fontWeight: "900", marginBottom: 10 },
  sub: { color: "#9ca3af", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  primary: { backgroundColor: "#facc15", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primaryText: { color: "#000", fontWeight: "900" },
  secondary: { marginTop: 12, borderWidth: 1, borderColor: "#374151", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  secondaryText: { color: "#e5e7eb", fontWeight: "800" },
});
