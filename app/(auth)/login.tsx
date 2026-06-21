import { setActiveRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useBranding } from "@/hooks/useBranding";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FORNECEDOR_EMAILS_CACHE_KEY = "@fornecedor_emails_cache_v1";

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

export default function Login() {
  const router = useRouter();
  const { branding } = useBranding();
  const logoSource = branding.logoUrl ? { uri: branding.logoUrl } : require("../../assets/images/icons/icon.png");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loadingRole, setLoadingRole] = useState<"cliente" | "profissional" | "fornecedor" | null>(null);
  const [fornecedorEmailsCache, setFornecedorEmailsCache] = useState<string[]>([]);
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const isKnownFornecedorEmail = useMemo(
    () => (normalizedEmail ? fornecedorEmailsCache.includes(normalizedEmail) : false),
    [fornecedorEmailsCache, normalizedEmail]
  );

  useEffect(() => {
    async function loadFornecedorEmailsCache() {
      try {
        const raw = await AsyncStorage.getItem(FORNECEDOR_EMAILS_CACHE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFornecedorEmailsCache(
            parsed
              .map((item) => normalizeEmail(String(item)))
              .filter(Boolean)
          );
        }
      } catch (error) {
        console.log("FORNECEDOR CACHE LOAD ERROR:", error);
      }
    }
    void loadFornecedorEmailsCache();
  }, []);

  async function handleLogin(roleDestino: "cliente" | "profissional" | "fornecedor") {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }

    try {
      setLoadingRole(roleDestino);

      // 🔐 Login no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha.trim(),
      });

      if (error) {
        console.log("LOGIN ERROR:", error);
        Alert.alert("Erro no login", error.message);
        return;
      }

      if (!data.user) {
        Alert.alert("Erro", "Usuário não encontrado.");
        return;
      }

      const userId = data.user.id;
      const nameFromMetadata =
        typeof data.user.user_metadata?.name === "string"
          ? data.user.user_metadata.name
          : typeof data.user.user_metadata?.nome === "string"
          ? data.user.user_metadata.nome
          : null;
      const nomeFallback = nameFromMetadata || data.user.email?.split("@")[0] || "Usuário";
      let tenantId: string | null = null;

      try {
        tenantId = await ensureCurrentUserTenantContext();
      } catch (tenantInitError) {
        console.log("TENANT CONTEXT LOGIN WARNING:", tenantInitError);
        try {
          tenantId = await getCurrentTenantId();
        } catch (tenantFallbackError) {
          console.log("TENANT FALLBACK LOGIN WARNING:", tenantFallbackError);
        }
      }

      const { data: fornecedorData, error: fornecedorError } = await supabase
        .from("profissionais")
        .select("fornecedor_ativo")
        .eq("user_id", userId)
        .maybeSingle();

      if (fornecedorError) {
        console.log("FORNECEDOR CHECK LOGIN ERROR:", fornecedorError);
      }

      const isFornecedor = Boolean((fornecedorData as { fornecedor_ativo?: boolean } | null)?.fornecedor_ativo);
      const loginEmail = normalizeEmail(data.user.email || email);

      if (isFornecedor) {
        const nextCache = Array.from(new Set([...fornecedorEmailsCache, loginEmail])).filter(Boolean);
        setFornecedorEmailsCache(nextCache);
        void AsyncStorage.setItem(FORNECEDOR_EMAILS_CACHE_KEY, JSON.stringify(nextCache));
      } else if (loginEmail && fornecedorEmailsCache.includes(loginEmail)) {
        const nextCache = fornecedorEmailsCache.filter((item) => item !== loginEmail);
        setFornecedorEmailsCache(nextCache);
        void AsyncStorage.setItem(FORNECEDOR_EMAILS_CACHE_KEY, JSON.stringify(nextCache));
      }

      if (roleDestino === "fornecedor" && !isFornecedor) {
        Alert.alert(
          "Cadastro de fornecedor não encontrado",
          "Finalize seu cadastro com CNPJ para entrar como fornecedor."
        );
        router.replace("/(auth)/cadastro-fornecedor");
        return;
      }

      const roleFinal = isFornecedor ? "fornecedor" : roleDestino;
      if (isFornecedor && roleDestino !== "fornecedor") {
        Alert.alert(
          "Conta de fornecedor",
          "Esta conta é exclusiva de fornecedor. Você será direcionado para o painel de fornecedor."
        );
      }

      const rolePerfil = roleFinal === "cliente" ? "cliente" : "profissional";
      let existingProfileRole: "cliente" | "profissional" | null = null;

      try {
        let profileQuery = supabase
          .from("profiles")
          .select("role")
          .eq("id", userId);

        if (tenantId) {
          profileQuery = profileQuery.eq("tenant_id", tenantId);
        }

        const { data: existingProfile, error: existingProfileError } = await profileQuery.maybeSingle();

        if (existingProfileError) {
          console.log("PROFILE READ LOGIN WARNING:", existingProfileError);
        } else if (existingProfile?.role === "cliente" || existingProfile?.role === "profissional") {
          existingProfileRole = existingProfile.role;
        }
      } catch (existingProfileUnexpectedError) {
        console.log("PROFILE READ LOGIN UNEXPECTED WARNING:", existingProfileUnexpectedError);
      }

      const rolePersistido =
        existingProfileRole === "profissional" && rolePerfil === "cliente"
          ? "profissional"
          : rolePerfil;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          name: nomeFallback,
          role: rolePersistido,
        });

      if (profileError) {
        console.log("PROFILE UPSERT LOGIN ERROR:", profileError);
        Alert.alert("Erro", "Nao foi possivel sincronizar seu perfil agora.");
        return;
      }

      if (roleFinal === "profissional" || roleFinal === "fornecedor") {
        const { error: profissionalError } = await supabase
          .from("profissionais")
          .upsert({
            user_id: userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            ativo: true,
            disponivel: true,
            raio_km: 10,
            updated_at: new Date().toISOString(),
          });

        if (profissionalError) {
          console.log("PROFISSIONAL UPSERT LOGIN ERROR:", profissionalError);
          Alert.alert("Erro", "Nao foi possivel preparar sua area profissional agora.");
          return;
        }
      }

      await setActiveRole(roleFinal);
      router.replace(
        roleFinal === "fornecedor"
          ? "/(fornecedor)"
          : roleFinal === "profissional"
          ? "/(profissional)"
          : "/(tabs)"
      );

    } catch (err) {
      console.log("UNEXPECTED ERROR:", err);
      Alert.alert("Erro", "Erro inesperado.");
    } finally {
      setLoadingRole(null);
    }
  }

  const loginForm = (
    <View style={styles.mobileForm}>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.mobileInput]}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {isKnownFornecedorEmail ? (
        <Text style={styles.fornecedorHint}>
          Conta identificada como fornecedor. Use a entrada dedicada para fornecedor.
        </Text>
      ) : null}

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        style={[styles.input, styles.mobileInput]}
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity
        style={[styles.button, styles.mobilePrimaryButton, { backgroundColor: branding.primaryColor }, isKnownFornecedorEmail ? styles.buttonDisabled : null]}
        onPress={() => handleLogin("cliente")}
        disabled={loadingRole !== null || isKnownFornecedorEmail}
      >
        {loadingRole === "cliente" ? (
          <ActivityIndicator color="#020617" />
        ) : (
          <Text style={styles.buttonText}>Entrar como cliente</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.secondaryButton,
          styles.mobileSecondaryButton,
          { borderColor: branding.accentColor },
          isKnownFornecedorEmail ? styles.buttonDisabled : null,
        ]}
        onPress={() => handleLogin("profissional")}
        disabled={loadingRole !== null || isKnownFornecedorEmail}
      >
        {loadingRole === "profissional" ? (
          <ActivityIndicator color={branding.primaryColor} />
        ) : (
          <Text style={[styles.secondaryButtonText, { color: branding.primaryColor }]}>Entrar como profissional</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, styles.mobileSecondaryButton, { borderColor: "#22c55e" }]}
        onPress={() => handleLogin("fornecedor")}
        disabled={loadingRole !== null}
      >
        {loadingRole === "fornecedor" ? (
          <ActivityIndicator color="#22c55e" />
        ) : (
          <Text style={[styles.secondaryButtonText, { color: "#22c55e" }]}>Entrar como fornecedor</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push(Platform.OS === "web" ? "/(auth)/cadastro-opcao" : "/(auth)/escolher-cadastro")}
      >
        <Text style={[styles.linkText, { color: branding.primaryColor }]}>Ainda não tenho conta</Text>
      </TouchableOpacity>
    </View>
  );

  if (Platform.OS !== "web") {
    return (
      <View style={styles.mobileContainer}>
        <Image source={logoSource} style={styles.mobileLogo} resizeMode="contain" />
        <Text style={styles.mobileTitle}>Casa Mineira Serviços</Text>
        <Text style={styles.mobileSubtitle}>Conectando profissionais e clientes</Text>
        {loginForm}
      </View>
    );
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Acesso principal"
      title="Entre no produto pelo contexto certo sem misturar operação, fornecedor e SaaS."
      description="Cliente, profissional, fornecedor e empresa usam entradas separadas. O login abaixo mantém essa distinção e direciona cada conta para seu ambiente correto."
      highlights={[
        "Direcionamento por perfil após autenticação",
        "Fluxo independente para fornecedor e onboarding SaaS",
        "Experiência web consistente com o marketing do produto",
      ]}
      footerActionLabel={Platform.OS === "web" ? "Criar empresa SaaS" : undefined}
      onFooterAction={Platform.OS === "web" ? () => router.push("/(auth)/onboarding-empresa") : undefined}
    >
      {loginForm}
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: "center",
  },
  mobileLogo: {
    width: 162,
    height: 162,
    alignSelf: "center",
    marginBottom: 2,
  },
  mobileTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  mobileSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  mobileForm: {
    width: "100%",
    gap: 10,
  },
  card: {
    maxWidth: 760,
    width: "100%",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    padding: 24,
    gap: 12,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    color: "#e2e8f0",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  mobileInput: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0,
    fontSize: 15,
  },
  button: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  mobilePrimaryButton: {
    marginTop: 6,
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonText: {
    fontWeight: "800",
    color: "#020617",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  mobileSecondaryButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryButtonText: {
    fontWeight: "800",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  fornecedorHint: {
    color: "#86efac",
    fontSize: 12,
    lineHeight: 20,
  },
  linkButton: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 2,
  },
  linkText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
