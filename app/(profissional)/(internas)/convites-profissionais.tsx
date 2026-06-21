import { createProfissionalInvite, listCurrentEmpresaProfissionalInvites, type ProfissionalInvite } from "@/lib/saas-growth";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ConvitesProfissionaisScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [invites, setInvites] = useState<ProfissionalInvite[]>([]);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listCurrentEmpresaProfissionalInvites();
      setInvites(data);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar convites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  async function criar() {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe o email do profissional.");
      return;
    }

    try {
      setSaving(true);
      const data = await createProfissionalInvite(email.trim().toLowerCase(), nome.trim() || null);
      const fullLink = Linking.createURL(data.invite_url);
      setCopiedLink(fullLink);
      setEmail("");
      setNome("");
      await carregar();
      Alert.alert("Convite criado", `Link do convite: ${fullLink}`);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível criar o convite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Convite de profissionais</Text>
        <Text style={styles.subtitle}>Envie um link de ativação para profissionais entrarem direto na sua empresa.</Text>
      </View>

      <View style={styles.card}>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome do profissional" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email do profissional" placeholderTextColor="#64748b" autoCapitalize="none" />
        <TouchableOpacity style={[styles.button, saving ? styles.disabled : null]} onPress={() => void criar()} disabled={saving}>
          {saving ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>Gerar convite</Text>}
        </TouchableOpacity>
        {copiedLink ? <Text style={styles.helper}>Último link gerado: {copiedLink}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Convites gerados</Text>
        {loading ? (
          <ActivityIndicator color="#facc15" />
        ) : invites.length === 0 ? (
          <Text style={styles.helper}>Nenhum convite criado ainda.</Text>
        ) : (
          invites.map((invite) => (
            <View key={invite.id} style={styles.inviteRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteTitle}>{invite.nome || invite.email}</Text>
                <Text style={styles.helper}>{invite.email}</Text>
                <Text style={styles.helper}>Status: {invite.status}</Text>
              </View>
              <Text style={styles.helper}>{new Date(invite.expires_at).toLocaleDateString("pt-BR")}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 80, gap: 14 },
  hero: { backgroundColor: "#0b1220", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#1f2937" },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 8, lineHeight: 22 },
  card: { backgroundColor: "#0b1220", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#1f2937" },
  input: { backgroundColor: "#111827", color: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: "#1f2937" },
  button: { backgroundColor: "#facc15", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#020617", fontWeight: "900" },
  disabled: { opacity: 0.7 },
  helper: { color: "#94a3b8", marginTop: 8, lineHeight: 20 },
  cardTitle: { color: "#fff", fontWeight: "900", fontSize: 16, marginBottom: 12 },
  inviteRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#111827" },
  inviteTitle: { color: "#e5e7eb", fontWeight: "800" },
});
