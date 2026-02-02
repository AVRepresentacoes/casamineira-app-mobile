import { supabase } from "../supabaseClient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from "react-native";

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams() as { role?: string };
  const role = params.role === "profissional" ? "profissional" : "cliente";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: { nome, role },
        },
      });
      if (error) throw error;

      Alert.alert("Conta criada", "Agora faça login.");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Erro ao criar conta", e?.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />

      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Tipo: {role.toUpperCase()}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor="#6b7280" value={nome} onChangeText={setNome} />

        <Text style={[styles.label, { marginTop: 12 }]}>E-mail</Text>
        <TextInput style={styles.input} placeholder="seuemail@email.com" placeholderTextColor="#6b7280" autoCapitalize="none" value={email} onChangeText={setEmail} />

        <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
        <TextInput style={styles.input} placeholder="********" placeholderTextColor="#6b7280" secureTextEntry value={senha} onChangeText={setSenha} />

        <TouchableOpacity style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]} onPress={onRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryText}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/login")}>
          <Text style={styles.secondaryText}>Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", alignItems: "center", justifyContent: "center", padding: 22 },
  logo: { width: 110, height: 110, marginBottom: 18 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#9ca3af", marginTop: 6, marginBottom: 18, textAlign: "center" },

  card: { width: "100%", backgroundColor: "#071026", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#0b1220" },
  label: { color: "#9ca3af", fontSize: 12, fontWeight: "800" },
  input: { marginTop: 6, backgroundColor: "#03040a", borderWidth: 1, borderColor: "#0b1220", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: "#e6e7e9" },

  primaryBtn: { backgroundColor: "#facc15", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  primaryText: { color: "#000", fontWeight: "900" },

  secondaryBtn: { borderWidth: 1, borderColor: "#374151", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  secondaryText: { color: "#e6e7e9", fontWeight: "900" },
});
