import { setActiveRole } from "@/lib/auth";
import { acceptProfissionalInvite, getProfissionalInvitePublic } from "@/lib/saas-growth";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ConviteProfissionalPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = String(params.token || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState<any | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    getProfissionalInvitePublic(token)
      .then((data) => {
        setInvite(data);
        setEmail(data.email || "");
        setNome(data.nome || "");
      })
      .catch((error: any) => {
        Alert.alert("Convite inválido", error?.message || "Não foi possível carregar o convite.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function ensureAuth() {
    const sessionResult = await supabase.auth.getSession();
    if (sessionResult.data.session?.user) {
      return sessionResult.data.session.user;
    }

    const signUp = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha.trim(),
      options: {
        data: {
          name: nome.trim(),
          role: "profissional",
        },
      },
    });

    if (signUp.error) {
      const message = String(signUp.error.message || "");
      if (!message.toLowerCase().includes("already registered")) {
        throw new Error(message);
      }
    }

    const signIn = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha.trim(),
    });

    if (signIn.error || !signIn.data.user) {
      throw new Error(signIn.error?.message || "Não foi possível autenticar o profissional.");
    }

    return signIn.data.user;
  }

  async function aceitar() {
    if (!token) {
      Alert.alert("Erro", "Token do convite ausente.");
      return;
    }

    if (!nome.trim() || !email.trim()) {
      Alert.alert("Atenção", "Preencha nome e email.");
      return;
    }

    try {
      setSaving(true);
      await ensureAuth();
      await acceptProfissionalInvite(token, nome.trim());
      await setActiveRole("profissional");
      Alert.alert("Convite aceito", "Seu acesso à empresa foi ativado.");
      router.replace("/(profissional)");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível aceitar o convite.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {invite?.empresa_logo_url ? <Image source={{ uri: invite.empresa_logo_url }} style={styles.logo} resizeMode="contain" /> : null}
      <View style={styles.hero}>
        <Text style={styles.title}>Convite profissional</Text>
        <Text style={styles.subtitle}>Você foi convidado para entrar na empresa {invite?.empresa_nome || "parceira"}.</Text>
      </View>
      <View style={styles.card}>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Seu email" placeholderTextColor="#64748b" autoCapitalize="none" />
        <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Sua senha" placeholderTextColor="#64748b" secureTextEntry />
        <TouchableOpacity style={[styles.button, saving ? styles.disabled : null]} onPress={() => void aceitar()} disabled={saving}>
          {saving ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>Aceitar convite</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingBottom: 80, gap: 14 },
  center: { flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center" },
  logo: { width: 180, height: 120, alignSelf: "center" },
  hero: { backgroundColor: "#0b1220", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#1f2937" },
  title: { color: "#fff", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 8, lineHeight: 22 },
  card: { backgroundColor: "#0b1220", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2937" },
  input: { backgroundColor: "#111827", color: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: "#1f2937" },
  button: { backgroundColor: "#facc15", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#020617", fontWeight: "900" },
  disabled: { opacity: 0.7 },
});
