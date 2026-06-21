import { enviarProposta as enviarPropostaNoBanco } from "@/lib/marketplace";
import { supabase } from "@/lib/supabase";
import { formatCurrencyInputBR, parseCurrencyInputBR } from "@/lib/currency";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EnviarPropostaProfissional() {
  const { id: pedidoId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [jaEnviou, setJaEnviou] = useState(false);

  useEffect(() => {
    async function checkPropostaExistente() {
      if (!pedidoId) {
        setChecking(false);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setChecking(false);
        return;
      }

      const { data } = await supabase
        .from("propostas")
        .select("id")
        .eq("pedido_id", pedidoId)
        .eq("profissional_id", session.user.id)
        .maybeSingle();

      const { data: pedidoData } = await supabase
        .from("pedidos")
        .select("tipo_atendimento")
        .eq("id", pedidoId)
        .maybeSingle();

      if ((pedidoData as any)?.tipo_atendimento === "rapido") {
        Alert.alert(
          "Chamado rápido",
          "Este pedido está no modo rápido. Use a tela de Chamados Rápidos para aceitar.",
          [
            {
              text: "Ir para chamados",
              onPress: () => router.replace("/(profissional)/(internas)/chamados-rapidos"),
            },
          ],
        );
        setChecking(false);
        return;
      }

      setJaEnviou(!!data);
      setChecking(false);
    }

    checkPropostaExistente();
  }, [pedidoId, router]);

  async function handleEnviarProposta() {
    if (loading) return;
    if (!pedidoId) {
      Alert.alert("Erro", "Pedido inválido.");
      return;
    }

    const valorNumero = parseCurrencyInputBR(valor);
    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      Alert.alert("Valor inválido", "Informe um valor maior que zero.");
      return;
    }
    if (!descricao.trim()) {
      Alert.alert("Mensagem obrigatória", "Descreva sua proposta.");
      return;
    }

    setLoading(true);
    try {
      await enviarPropostaNoBanco({
        pedidoId,
        valor: valorNumero,
        descricao: descricao.trim(),
      });

      Alert.alert("Sucesso", "Proposta enviada com sucesso.");
      router.replace("/(profissional)/(internas)/propostas");
    } catch (err) {
      console.log("ERRO INESPERADO PROPOSTA:", err);
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Não foi possível enviar a proposta."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (jaEnviou) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Você já enviou proposta para este pedido.</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("/(profissional)/(internas)/propostas")}
        >
          <Text style={styles.secondaryText}>Ver minhas propostas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="create-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Negociação profissional</Text>
            <Text style={styles.title}>Enviar proposta</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Estruture uma proposta clara, com valor bem apresentado e uma descrição objetiva do que está incluso.
        </Text>
        <View style={styles.heroTips}>
          <View style={styles.tipChip}>
            <Ionicons name="cash-outline" size={14} color="#facc15" />
            <Text style={styles.tipText}>Valor competitivo</Text>
          </View>
          <View style={styles.tipChip}>
            <Ionicons name="document-text-outline" size={14} color="#facc15" />
            <Text style={styles.tipText}>Escopo bem definido</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="wallet-outline" size={18} color="#facc15" />
            <Text style={styles.sectionTitle}>Condições da proposta</Text>
          </View>
          <Text style={styles.sectionHint}>Preenchimento</Text>
        </View>

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="R$ 0,00"
          placeholderTextColor="#6b7280"
          keyboardType="numeric"
          value={valor}
          onChangeText={(texto) => setValor(formatCurrencyInputBR(texto))}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva o que está incluso na proposta..."
          placeholderTextColor="#6b7280"
          multiline
          textAlignVertical="top"
          value={descricao}
          onChangeText={setDescricao}
        />

        <View style={styles.infoStrip}>
          <Ionicons name="sparkles-outline" size={16} color="#facc15" />
          <Text style={styles.infoStripText}>
            Propostas objetivas e com escopo claro tendem a acelerar a decisão do cliente.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleEnviarProposta}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="#000" />
            <Text style={styles.buttonText}>Enviar proposta</Text>
          </>
        )}
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
  },
  heroText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
  },
  heroTips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#304767",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tipText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#081121",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  sectionHint: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
  },
  label: {
    color: "#9CA3AF",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#304767",
    color: "#FFF",
    padding: 14,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 130,
  },
  infoStrip: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#0c172d",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#304767",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoStripText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#FACC15",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryText: {
    color: "#E5E7EB",
    fontWeight: "700",
  },
});
