import { getQuestionSet } from "@/lib/serviceQuestionnaire";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResumoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { slug, categoria, servico, servicoId, profissional, local } = useLocalSearchParams<{
    slug: string;
    categoria: string;
    servico: string;
    servicoId?: string;
    profissional: string;
    local: string;
  }>();

  const [descricao, setDescricao] = useState("");
  const [midias, setMidias] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questionSet = useMemo(
    () => getQuestionSet(String(slug || ""), String(servico || ""), String(servicoId || "")),
    [slug, servico, servicoId],
  );

  async function selecionarMidia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setMidias([...midias, ...result.assets]);
    }
  }

  function removerMidia(index: number) {
    const novas = [...midias];
    novas.splice(index, 1);
    setMidias(novas);
  }

  function updateAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function avancar() {
    if (!descricao.trim()) return;

    const faltando = questionSet.questions.find(
      (q) => q.required && !String(answers[q.key] || "").trim(),
    );

    if (faltando) {
      return;
    }

    router.push({
      pathname: `/categorias/${slug}/endereco`,
      params: {
        categoria,
        servico,
        servicoId,
        profissional,
        local,
        descricao,
        questionario: JSON.stringify(answers),
      },
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Resumo do Pedido</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resumo do Pedido</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Categoria</Text>
          <Text style={styles.value}>{categoria}</Text>

          <Text style={styles.label}>Serviço</Text>
          <Text style={styles.value}>{servico}</Text>

          <Text style={styles.label}>Profissional</Text>
          <Text style={styles.value}>{profissional}</Text>

          <Text style={styles.label}>Local</Text>
          <Text style={styles.value}>{local}</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.sectionTitle}>{questionSet.title}</Text>
          <Text style={styles.sectionSubtitle}>{questionSet.subtitle}</Text>

          {questionSet.questions.map((q) => (
            <View key={q.key} style={{ marginBottom: 12 }}>
              <Text style={styles.questionLabel}>
                {q.label}
                {q.required ? " *" : ""}
              </Text>

              {q.kind === "select" || q.kind === "yesno" ? (
                <View style={styles.chipWrap}>
                  {(q.options || []).map((opt) => {
                    const active = answers[q.key] === opt;
                    return (
                      <TouchableOpacity
                        key={`${q.key}-${opt}`}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => updateAnswer(q.key, opt)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  style={styles.inputField}
                  value={answers[q.key] || ""}
                  onChangeText={(value) => updateAnswer(q.key, value)}
                  placeholder={q.placeholder || "Digite aqui"}
                  placeholderTextColor="#94a3b8"
                  keyboardType={q.kind === "number" ? "numeric" : "default"}
                />
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Descreva com detalhes</Text>

        <TextInput
          style={styles.input}
          placeholder="Explique o que precisa ser feito..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={5}
          value={descricao}
          onChangeText={setDescricao}
        />

        <Text style={styles.sectionTitle}>Adicione fotos ou vídeo (opcional)</Text>

        <TouchableOpacity style={styles.uploadButton} onPress={selecionarMidia}>
          <Ionicons name="camera-outline" size={22} color="#000" />
          <Text style={styles.uploadText}>Selecionar Mídia</Text>
        </TouchableOpacity>

        <View style={styles.previewContainer}>
          {midias.map((item, index) => (
            <View key={index} style={styles.previewItem}>
              {item.type === "video" ? (
                <Video
                  source={{ uri: item.uri }}
                  style={styles.preview}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                />
              ) : (
                <Image source={{ uri: item.uri }} style={styles.preview} />
              )}

              <TouchableOpacity style={styles.removeButton} onPress={() => removerMidia(index)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.nextButton, !descricao && { opacity: 0.5 }]} disabled={!descricao} onPress={avancar}>
          <Text style={styles.nextText}>Próximo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: {
    backgroundColor: "#0f172a",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 20, paddingBottom: 160 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 16 },
  label: { fontSize: 13, color: "#64748b", marginTop: 10 },
  value: { fontSize: 16, fontWeight: "600", marginTop: 3 },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  sectionSubtitle: { color: "#64748b", marginBottom: 12 },
  questionLabel: { color: "#334155", fontWeight: "700", marginBottom: 7 },
  inputField: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    color: "#0f172a",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  chipActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  chipText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#1d4ed8" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  uploadText: { marginLeft: 8, fontWeight: "bold" },
  previewContainer: { flexDirection: "row", flexWrap: "wrap" },
  previewItem: { position: "relative", marginRight: 10, marginBottom: 10 },
  preview: { width: 100, height: 100, borderRadius: 12 },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 20,
    padding: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  backButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 25,
    width: "45%",
    alignItems: "center",
  },
  backText: { color: "#fff", fontWeight: "bold" },
  nextButton: {
    backgroundColor: "#facc15",
    paddingVertical: 16,
    borderRadius: 25,
    width: "45%",
    alignItems: "center",
  },
  nextText: { color: "#000", fontWeight: "bold" },
});
