import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DashboardCliente() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Casa Mineira Serviços</Text>
      <Text style={styles.sub}>Painel do Cliente</Text>
      <Text style={styles.text}>Login ok ✅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", justifyContent: "center", alignItems: "center" },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  sub: { color: "#9ca3af", marginTop: 6 },
  text: { color: "#e5e7eb", marginTop: 12, fontWeight: "900" },
});
