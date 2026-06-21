import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MOTIVOS = [
  "Não encontrei profissionais adequados",
  "Os preços estavam acima do esperado",
  "Tive problemas no atendimento",
  "Consegui resolver por fora do app",
  "Não estou usando no momento",
];

export default function CancelamentoContaScreen() {
  const router = useRouter();
  const [motivoSelecionado, setMotivoSelecionado] = useState("");
  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmarExclusao() {
    if (!motivoSelecionado) {
      Alert.alert("Atenção", "Selecione um motivo principal.");
      return;
    }

    const notaNumerica =
      nota.trim().length > 0 ? Number(nota.replace(/\D/g, "")) : null;

    if (notaNumerica != null && (!Number.isInteger(notaNumerica) || notaNumerica < 0 || notaNumerica > 10)) {
      Alert.alert("Atenção", "Informe uma nota de 0 a 10.");
      return;
    }

    try {
      setEnviando(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
        router.replace("/(auth)/login");
        return;
      }

      const { error } = await supabase.functions.invoke("delete-account", {
        body: {
          motivo: motivoSelecionado,
          nota_experiencia: notaNumerica,
          comentario: comentario.trim() || null,
        },
      });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      Alert.alert(
        "Conta excluída",
        "Sua conta foi removida com sucesso deste aplicativo.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error) {
      console.log("ERRO AO EXCLUIR CONTA:", error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Não foi possível excluir a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#facc15" />
        </TouchableOpacity>
        <Text style={styles.title}>Excluir conta</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Antes de confirmar</Text>
        <Text style={styles.cardText}>
          Ao confirmar, sua conta será excluída e os dados vinculados a ela serão removidos
          conforme nossa política de privacidade e regras legais aplicáveis.
        </Text>
        <Text style={styles.cardText}>
          Antes de concluir, compartilhe seu motivo para mantermos um registro de auditoria e melhoria:
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>1. Qual o principal motivo?</Text>
        {MOTIVOS.map((motivo) => {
          const ativo = motivoSelecionado === motivo;
          return (
            <TouchableOpacity
              key={motivo}
              style={[styles.option, ativo && styles.optionActive]}
              onPress={() => setMotivoSelecionado(motivo)}
            >
              <Text style={[styles.optionText, ativo && styles.optionTextActive]}>{motivo}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>2. De 0 a 10, como foi sua experiência?</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          keyboardType="number-pad"
          placeholder="Ex: 7"
          placeholderTextColor="#6b7280"
          style={styles.input}
          maxLength={2}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>3. Comentários (opcional)</Text>
        <TextInput
          value={comentario}
          onChangeText={setComentario}
          placeholder="Conte o que podemos melhorar..."
          placeholderTextColor="#6b7280"
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          Alert.alert(
            "Excluir conta definitivamente?",
            "Essa ação remove seu acesso ao app e não pode ser desfeita.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Excluir", style: "destructive", onPress: () => void confirmarExclusao() },
            ]
          )
        }
        disabled={enviando}
      >
        {enviando ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.primaryButtonText}>Excluir minha conta</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Se existirem obrigações legais ou fiscais, alguns registros mínimos poderão ser retidos pelo prazo exigido.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    marginRight: 10,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 10,
  },
  cardText: {
    color: "#cbd5e1",
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  option: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  optionActive: {
    borderColor: "#facc15",
    backgroundColor: "#111827",
  },
  optionText: {
    color: "#d1d5db",
    fontSize: 13,
  },
  optionTextActive: {
    color: "#fef3c7",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 110,
  },
  primaryButton: {
    backgroundColor: "#facc15",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#000",
    fontWeight: "800",
  },
  helperText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
});
