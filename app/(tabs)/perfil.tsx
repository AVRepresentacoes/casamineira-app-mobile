import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const { data: perfil } = await supabase
      .from("profissionais")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (perfil) {
      setNome(perfil.nome || "");
      setTelefone(perfil.telefone || "");
      setCidade(perfil.cidade || "");
      setBio(perfil.bio || "");
    }

    setLoading(false);
  }

  async function salvarPerfil() {
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const { error } = await supabase.from("profissionais").upsert({
      user_id: data.user.id,
      nome,
      telefone,
      cidade,
      bio,
    });

    setSaving(false);
    if (error) Alert.alert("Erro", error.message);
    else Alert.alert("Sucesso", "Perfil salvo com sucesso");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil Profissional</Text>
      <Text style={styles.subtitle}>Dados públicos do seu perfil</Text>

      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.label}>Telefone</Text>
      <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} />

      <Text style={styles.label}>Cidade</Text>
      <TextInput style={styles.input} value={cidade} onChangeText={setCidade} />

      <Text style={styles.label}>Bio Profissional</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        multiline
        value={bio}
        onChangeText={setBio}
      />

      <TouchableOpacity style={styles.btn} onPress={salvarPerfil} disabled={saving}>
        <Text style={styles.btnText}>
          {saving ? "Salvando..." : "Salvar Perfil"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "#facc15", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#9ca3af", marginBottom: 20 },
  label: { color: "#9ca3af", marginTop: 12, fontWeight: "700" },
  input: {
    backgroundColor: "#071026",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    marginTop: 6,
  },
  btn: {
    backgroundColor: "#facc15",
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#000", fontWeight: "900" },
});
