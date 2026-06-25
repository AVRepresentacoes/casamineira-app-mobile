import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || "");
    });
  }, []);

  return (
    <SaasProductShell title="Configurações da conta" subtitle="Identidade, sessão e contexto da Casa Mineira SaaS.">
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Produto</Text>
          <Text style={styles.title}>Casa Mineira SaaS</Text>
          <Text style={styles.body}>Plataforma para criar aplicativos com IA, gerenciar projetos, billing e agentes.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Conta autenticada</Text>
          <Text style={styles.title}>{email || "Usuário SaaS"}</Text>
          <Text style={styles.body}>Este login não seleciona perfil de cliente/profissional do app Casa Mineira Serviços.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Domínio principal</Text>
          <Text style={styles.title}>casamineiraservicos.app.br</Text>
          <Text style={styles.body}>O domínio pode continuar o mesmo; a identidade exibida nesta área é Casa Mineira SaaS.</Text>
        </View>
      </View>
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  body: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
});
