import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "../../lib/supabase";


export default function Register() {
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

      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            tipo: "profissional",
          },
        },
      });

      if (error) {
        Alert.alert("Erro", error.message);
        return;
      }

      Alert.alert(
        "Conta criada!",
        "Agora faça login para começar a receber pedidos."
      );

      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Erro", "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Perfil profissional"
      title="Crie sua conta profissional com a mesma linguagem premium dos fluxos comerciais."
      description="Esta tela legada foi padronizada visualmente para não destoar do restante da camada de aquisição, mantendo o comportamento intacto."
      highlights={[
        "Entrada dedicada para profissional",
        "Mesma lógica de criação e redirecionamento",
        "Visual alinhado ao marketing e onboarding",
      ]}
      footerActionLabel="Voltar para login"
      onFooterAction={() => router.replace("/(auth)/login")}
    >
      <View style={styles.card}>
        <TextInput
          placeholder="Nome completo"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          placeholder="E-mail"
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
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>
              Criar conta profissional
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Ao continuar, você concorda com nossos termos de uso.
        </Text>
      </View>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: 760,
    width: "100%",
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },

  input: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: 16,
    padding: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#FACC15",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  footerText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    marginTop: 16,
  },
});
