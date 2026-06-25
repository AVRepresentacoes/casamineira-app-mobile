import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function SaasLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (session?.user) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Informe email e senha para entrar na Casa Mineira SaaS.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Alert.alert("Erro no login", error.message);
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.log("SAAS LOGIN ERROR:", error);
      Alert.alert("Erro", "Não foi possível entrar agora.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="sparkles" size={22} color="#08101c" />
          </View>
          <View>
            <Text style={styles.brandTitle}>Casa Mineira SaaS</Text>
            <Text style={styles.brandSubtitle}>Crie aplicativos com IA</Text>
          </View>
        </View>

        <Text style={styles.title}>Entre na plataforma para criar, gerenciar e publicar apps com agentes IA.</Text>
        <Text style={styles.subtitle}>
          Este acesso é exclusivo da Casa Mineira SaaS. O app Casa Mineira Serviços continua isolado no fluxo operacional de clientes e profissionais.
        </Text>

        <View style={styles.proofGrid}>
          <Proof icon="apps-outline" title="Apps gerados" body="Projetos, templates e histórico em um painel próprio." />
          <Proof icon="flash-outline" title="Agentes IA" body="Briefing, produto, design, backend, automação e marketing." />
          <Proof icon="business-outline" title="Empresas" body="Gestão de conta, billing, créditos e configurações." />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Login SaaS</Text>
        <Text style={styles.cardTitle}>Acessar plataforma</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#64748b"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Senha"
          placeholderTextColor="#64748b"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={[styles.primaryButton, loading ? styles.disabled : null]} onPress={() => void handleLogin()} disabled={loading}>
          {loading ? <ActivityIndicator color="#08101c" /> : <Text style={styles.primaryButtonText}>Entrar no dashboard</Text>}
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push("/app-servicos")}>
          <Text style={styles.secondaryButtonText}>Ir para Casa Mineira Serviços</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Proof({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.proofCard}>
      <Ionicons name={icon} size={20} color="#22d3ee" />
      <Text style={styles.proofTitle}>{title}</Text>
      <Text style={styles.proofBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A12",
    padding: 24,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 24,
  },
  loading: {
    flex: 1,
    backgroundColor: "#070A12",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    flex: 1.2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "#0B0F1A",
    padding: 30,
    justifyContent: "space-between",
    gap: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: "#f8fafc",
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "900",
    maxWidth: 760,
  },
  subtitle: {
    color: "#b6c3d5",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 720,
  },
  proofGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  proofCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 16,
    gap: 8,
  },
  proofTitle: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  proofBody: {
    color: "#94a3b8",
    lineHeight: 20,
    fontSize: 13,
  },
  card: {
    width: 430,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  cardEyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "#070A12",
    color: "#f8fafc",
    paddingHorizontal: 14,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.65,
  },
});
