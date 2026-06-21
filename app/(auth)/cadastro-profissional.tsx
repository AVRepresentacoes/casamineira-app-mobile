import { assertEmpresaCanPerform } from "@/lib/saas-commercial";
import { supabase } from "@/lib/supabase";
import { useBranding } from "@/hooks/useBranding";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function CadastroProfissional() {
  const router = useRouter();
  const { branding } = useBranding();
  const logoSource = branding.logoUrl ? { uri: branding.logoUrl } : require("../../assets/images/icons/icon.png");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");

  useEffect(() => {
    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        setSessionUserId(session.user.id);
        setSessionEmail(session.user.email ?? "");
      }
    }

    void carregarSessao();
  }, []);

  async function handleRegister() {
    const effectiveEmail = email.trim() || sessionEmail.trim();

    if (!nome || (!sessionUserId && !effectiveEmail) || (sessionUserId && !effectiveEmail) || (!sessionUserId && !senha)) {
      Alert.alert("Atenção", sessionUserId ? "Preencha nome e email." : "Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      let tenantId: string | null = null;

      if (sessionUserId) {
        try {
          tenantId = await ensureCurrentUserTenantContext();
        } catch {
          try {
            tenantId = await getCurrentTenantId();
          } catch {
            tenantId = null;
          }
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: sessionUserId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            name: nome.trim(),
            role: "profissional",
          });

        if (profileError) {
          Alert.alert("Erro", profileError.message);
          return;
        }

        await assertEmpresaCanPerform("create_profissional");

        await supabase.from("profissionais").upsert({
          user_id: sessionUserId,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          ativo: true,
          disponivel: true,
          raio_km: 10,
          updated_at: new Date().toISOString(),
        });

        Alert.alert("Sucesso", "Perfil profissional ativado nesta conta.");
        router.replace("/(profissional)/menu");
        return;
      }

      // 🔐 Criar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: effectiveEmail,
        password: senha.trim(),
        options: {
          data: {
            name: nome.trim(),
            role: "profissional",
          },
        },
      });

      if (error) {
        if (String(error.message || "").toLowerCase().includes("already registered")) {
          Alert.alert("Conta já existe", "Este email já está cadastrado. Faça login para ativar o perfil profissional.");
          router.replace("/(auth)/login");
          return;
        }
        Alert.alert("Erro", error.message);
        return;
      }

      if (!data.user) {
        Alert.alert("Erro", "Usuário não criado.");
        return;
      }

      const userId = data.user.id;
      await assertEmpresaCanPerform("create_profissional");

      // 👤 Tentar garantir profile já no cadastro.
      // Em alguns cenários de policy isso pode falhar no signUp; a criação também é tentada no login.
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          name: nome.trim(),
          role: "profissional",
        });

      if (profileError) {
        console.log("PROFILE UPSERT WARNING:", profileError);
      }

      await supabase.from("profissionais").upsert({
        user_id: userId,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        ativo: true,
        disponivel: true,
        raio_km: 10,
        updated_at: new Date().toISOString(),
      });

      Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
      router.replace("/(auth)/login");

    } catch {
      Alert.alert("Erro", "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (Platform.OS !== "web") {
    return (
      <View style={styles.mobileContainer}>
        <Image source={logoSource} style={styles.mobileLogo} resizeMode="contain" />
        <Text style={styles.mobileTitle}>Casa Mineira Serviços</Text>
        <Text style={styles.mobileSubtitle}>Cadastro Profissional</Text>

        <TextInput
          placeholder="Nome completo"
          placeholderTextColor="#9ca3af"
          style={styles.mobileInput}
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          style={styles.mobileInput}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {!sessionUserId ? (
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#9ca3af"
            style={styles.mobileInput}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
        ) : null}

        <TouchableOpacity style={styles.mobileButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.mobileButtonText}>Cadastrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.mobileLink}>Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Profissional"
      title="Ative o perfil profissional com uma experiência web mais clara e premium."
      description="Esse fluxo mantém o acesso operacional do profissional separado dos demais perfis e preserva a capacidade da empresa quando houver limites de plano."
      highlights={[
        "Criação ou ativação do perfil profissional na conta atual",
        "Verificação de capacidade comercial antes de habilitar operação",
        "Entrada limpa para agenda, propostas e atendimento",
      ]}
      footerActionLabel="Já tenho conta"
      onFooterAction={() => router.replace("/(auth)/login")}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados do profissional</Text>

        <TextInput
          placeholder="Nome completo"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {!sessionUserId ? (
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#64748b"
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
        ) : (
          <Text style={styles.helper}>Sessão existente detectada. O perfil profissional será ativado na conta atual.</Text>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: branding.primaryColor }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <Text style={styles.buttonText}>{sessionUserId ? "Ativar perfil profissional" : "Criar conta profissional"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center",
  },
  mobileLogo: {
    width: 190,
    height: 190,
    alignSelf: "center",
    marginBottom: 2,
  },
  mobileTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  mobileSubtitle: {
    color: "#facc15",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  mobileInput: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  mobileButton: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  mobileButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
  mobileLink: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
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
  button: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "900",
    color: "#020617",
  },
  helper: {
    color: "#94a3b8",
    lineHeight: 22,
  },
});
