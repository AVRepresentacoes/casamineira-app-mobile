import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileTypeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Como você quer usar?</Text>
      <Text style={styles.sub}>Escolha uma opção para continuar.</Text>

      <TouchableOpacity
        style={styles.primary}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.primaryText}>Sou Cliente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={() => router.replace("/(profissional)/(internas)/dashboard")}
      >
        <Text style={styles.secondaryText}>Sou Profissional</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => router.back()}>
        <Text style={styles.linkText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", padding: 22, justifyContent: "center" },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900", marginBottom: 8 },
  sub: { color: "#9ca3af", fontSize: 14, marginBottom: 20 },
  primary: { backgroundColor: "#facc15", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primaryText: { color: "#000", fontWeight: "900" },
  secondary: { marginTop: 12, borderWidth: 1, borderColor: "#374151", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  secondaryText: { color: "#e5e7eb", fontWeight: "900" },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#9ca3af", fontWeight: "800" },
});
