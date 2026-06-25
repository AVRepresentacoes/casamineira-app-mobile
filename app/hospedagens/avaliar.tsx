import { salvarAvaliacaoHospedagem } from "@/lib/caminhosHospedagens";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScoreKey = "notaGeral" | "limpeza" | "atendimento" | "localizacao" | "custoBeneficio";

export default function AvaliarHospedagemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reservaId?: string; hospedagemSlug?: string; hospedagemNome?: string }>();
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    notaGeral: 5,
    limpeza: 5,
    atendimento: 5,
    localizacao: 5,
    custoBeneficio: 5,
  });
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  function setScore(key: ScoreKey, value: number) {
    setScores((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    const hospedagemSlug = String(params.hospedagemSlug || "");
    const hospedagemNome = String(params.hospedagemNome || "Hospedagem");
    if (!hospedagemSlug) {
      Alert.alert("Avaliação indisponível", "Não foi possível identificar a hospedagem.");
      return;
    }
    try {
      setSaving(true);
      await salvarAvaliacaoHospedagem({
        reservaId: params.reservaId ? String(params.reservaId) : null,
        hospedagemSlug,
        hospedagemNome,
        notaGeral: scores.notaGeral,
        limpeza: scores.limpeza,
        atendimento: scores.atendimento,
        localizacao: scores.localizacao,
        custoBeneficio: scores.custoBeneficio,
        comentario,
      });
      Alert.alert("Avaliação enviada", "Obrigado por ajudar outros peregrinos a escolher melhor.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível salvar sua avaliação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Avaliação</Text>
          <Text style={styles.title}>{String(params.hospedagemNome || "Hospedagem")}</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Sua opinião melhora a confiança do Caminho.</Text>
        <Text style={styles.heroText}>Avalie apenas hospedagens que você realmente reservou ou visitou.</Text>
      </View>

      <View style={styles.card}>
        <Score label="Nota geral" value={scores.notaGeral} onChange={(value) => setScore("notaGeral", value)} />
        <Score label="Limpeza" value={scores.limpeza} onChange={(value) => setScore("limpeza", value)} />
        <Score label="Atendimento" value={scores.atendimento} onChange={(value) => setScore("atendimento", value)} />
        <Score label="Localização" value={scores.localizacao} onChange={(value) => setScore("localizacao", value)} />
        <Score label="Custo-benefício" value={scores.custoBeneficio} onChange={(value) => setScore("custoBeneficio", value)} />
        <TextInput
          style={styles.textArea}
          multiline
          value={comentario}
          onChangeText={setComentario}
          placeholder="Conte como foi a hospedagem, chegada, quarto, atendimento e pontos de atenção."
          placeholderTextColor="#8A7B61"
        />
      </View>

      <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#12372A" /> : <Text style={styles.primaryButtonText}>Enviar avaliação</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Score({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Pressable key={item} onPress={() => onChange(item)} hitSlop={8}>
            <Ionicons name={item <= value ? "star" : "star-outline"} size={24} color="#D8A84F" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  hero: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 6 },
  heroTitle: { color: "#FFF9EA", fontSize: 21, lineHeight: 27, fontWeight: "900" },
  heroText: { color: "#E5D9BD", lineHeight: 20 },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 14 },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  scoreLabel: { color: "#12372A", fontWeight: "900", flex: 1 },
  stars: { flexDirection: "row", gap: 2 },
  textArea: { minHeight: 120, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", padding: 12, color: "#12372A", textAlignVertical: "top" },
  primaryButton: { minHeight: 52, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#12372A", fontWeight: "900", fontSize: 15 },
  disabled: { opacity: 0.65 },
});
