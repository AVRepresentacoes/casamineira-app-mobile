import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { getRole } from "../../lib/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Login falhou. Usuário inválido.");

      const role = await getRole(user.id);

      if (role === "profissional") {
        router.replace("/(profissional)");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Casa Mineira Serviços</Text>
      <Text style={styles.subtitle}>Entre na sua conta</Text>

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
        placeholder="Sua senha"
        placeholderTextColor="#6b7280"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={entrar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.linkText}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 110, height: 110, marginBottom: 18 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#9ca3af", marginTop: 6, marginBottom: 18 },

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

  linkBtn: { marginTop: 14 },
  linkText: { color: "#9ca3af", fontWeight: "800" },
});
