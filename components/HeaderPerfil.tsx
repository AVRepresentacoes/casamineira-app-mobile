import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getActiveRole } from "@/lib/auth";
import { useBranding } from "@/hooks/useBranding";

export default function HeaderPerfil() {
  const [role, setRole] = useState<"cliente" | "profissional" | "fornecedor" | null>(null);
  const { branding } = useBranding();

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    const roleAtivo = await getActiveRole();
    setRole(roleAtivo);
  }

  if (!role) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: branding.primaryColor }]}>{branding.appName}</Text>

      <View
        style={[
          styles.badge,
          role === "profissional"
            ? styles.badgeProfissional
            : role === "fornecedor"
            ? styles.badgeFornecedor
            : styles.badgeCliente,
        ]}
      >
        <Text style={styles.badgeText}>
          {role === "profissional" ? "Profissional" : role === "fornecedor" ? "Fornecedor" : "Cliente"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#03040a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#facc15",
    fontSize: 16,
    fontWeight: "900",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeCliente: {
    backgroundColor: "#1e293b",
  },
  badgeProfissional: {
    backgroundColor: "#7c2d12",
  },
  badgeFornecedor: {
    backgroundColor: "#14532d",
  },
  badgeText: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 12,
  },
});
