import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import { useBranding } from "@/hooks/useBranding";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegisterProfissional() {
  const router = useRouter();
  const { branding } = useBranding();
  const logoSource = branding.logoUrl ? { uri: branding.logoUrl } : require("../../assets/images/icons/icon.png");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!nome || !email || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      if (error) throw error;

      let tenantId: string | null = null;
      try {
        tenantId = await ensureCurrentUserTenantContext();
      } catch {
        try {
          tenantId = await getCurrentTenantId();
        } catch {
          tenantId = null;
        }
      }

      // cria perfil profissional
      await supabase.from("profiles").insert({
        id: data.user?.id,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        nome,
        email,
        tipo: "profissional",
      });

      Alert.alert(
        "Conta criada!",
        "Agora faça login para acessar sua área profissional."
      );

      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Profissional"
      title="Crie uma conta profissional com apresentação alinhada ao site comercial."
      description="Este fluxo antigo continua disponível, mas agora segue a mesma linguagem visual premium dos demais pontos de entrada."
      highlights={[
        "Cadastro direto de conta profissional",
        "Experiência consistente com o restante do marketing",
        "Mesma lógica de autenticação e redirecionamento",
      ]}
      footerActionLabel="Voltar para login"
      onFooterAction={() => router.replace("/(auth)/login")}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Criar conta profissional</Text>
        <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor="#64748b" value={nome} onChangeText={setNome} />
        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Crie uma senha segura" placeholderTextColor="#64748b" secureTextEntry value={senha} onChangeText={setSenha} />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>Criar conta profissional</Text>}
        </TouchableOpacity>
      </View>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 24,
    color: "#f8fafc",
    fontWeight: "900",
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    color: "#F9FAFB",
  },
  button: {
    backgroundColor: "#FACC15",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#0B0F1A",
    fontSize: 16,
    fontWeight: "900",
  },
});
