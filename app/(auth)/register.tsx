import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { setRole, UserRole } from "../../lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const defaultRole: UserRole =
    params?.role === "profissional" ? "profissional" : "cliente";

  const [role, setRoleState] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const criarConta = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "Senha fraca. Use pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Falha ao criar conta.");

      await setRole(user.id, role);

      Alert.alert("Conta criada ✅", "Agora você já pode entrar.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.sub}>Escolha seu perfil</Text>

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "cliente" && styles.roleActive]}
          onPress={() => setRoleState("cliente")}
        >
          <Text style={[styles.roleText, role === "cliente" && styles.roleTextActive]}>
            Cliente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, role === "profissional" && styles.roleActive]}
          onPress={() => setRoleState("profissional")}
        >
          <Text style={[styles.roleText, role === "profissional" && styles.roleTextActive]}>
            Profissional
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Seu e-mail"
        placeholderTextColor="#6b7280"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Crie uma senha (min 6)"
        placeholderTextColor="#6b7280"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={criarConta}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
        <Text style={styles.linkText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", paddingHorizontal: 20, justifyContent: "center" },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900", textAlign: "center" },
  sub: { color: "#9ca3af", textAlign: "center", marginTop: 8, marginBottom: 18 },

  roleRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  roleActive: { backgroundColor: "#facc15", borderColor: "#facc15" },
  roleText: { color: "#9ca3af", fontWeight: "900" },
  roleTextActive: { color: "#000" },

  input: {
    width: "100%",
    backgroundColor: "#071026",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#e5e7eb",
    marginTop: 10,
  },

  btn: {
    width: "100%",
    marginTop: 16,
    backgroundColor: "#facc15",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#000", fontWeight: "900", fontSize: 15 },

  linkBtn: { marginTop: 14, alignItems: "center" },
  linkText: { color: "#9ca3af", fontWeight: "800" },
});
