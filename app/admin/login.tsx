import { adminWebLogin } from "@/lib/admin-web";
import { isCurrentUserSuperAdmin } from "@/lib/saas-admin";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Informe email e senha do proprietário.");
      return;
    }

    try {
      setLoading(true);
      await adminWebLogin(email, password);
      const allowed = await isCurrentUserSuperAdmin();

      if (!allowed) {
        throw new Error("Este usuário não possui acesso ao painel super admin.");
      }

      router.replace("/admin");
    } catch (error: any) {
      Alert.alert("Acesso negado", error?.message || "Não foi possível entrar no painel administrativo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.backdropA} />
      <View style={styles.backdropB} />

      <View style={styles.card}>
        <View style={styles.brandRibbon}>
          <Text style={styles.brandRibbonText}>Casa Mineira Admin</Text>
        </View>
        <View style={styles.logoWrap}>
          <Image source={require("../../assets/images/icons/icon.png")} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.eyebrow}>Painel Super Admin</Text>
        <Text style={styles.title}>Login exclusivo do proprietário</Text>
        <Text style={styles.subtitle}>
          Este acesso é separado do app operacional e liberado apenas para usuários com o papel <Text style={styles.highlight}>super_admin</Text>.
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email do proprietário"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor="#64748b"
          secureTextEntry
        />

        <Pressable style={[styles.button, loading ? styles.disabled : null]} onPress={() => void handleLogin()} disabled={loading}>
          {loading ? <ActivityIndicator color="#08101c" /> : <Text style={styles.buttonText}>Entrar no painel</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#08101c",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backdropA: {
    position: "absolute",
    top: 80,
    left: 80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.12)",
  },
  backdropB: {
    position: "absolute",
    bottom: 80,
    right: 80,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.10)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.20)",
    padding: 28,
  },
  brandRibbon: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(103, 232, 249, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.22)",
    marginBottom: 14,
  },
  brandRibbonText: {
    color: "#dafeff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 104,
    height: 104,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 10,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 10,
    lineHeight: 22,
  },
  highlight: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 14,
    color: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 14,
  },
  button: {
    marginTop: 18,
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.7,
  },
});
