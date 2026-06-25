import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { runAiFactory } from "@/lib/ai-factory";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

export default function AiAppGeneratorScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("Quero criar um aplicativo para uma empresa de serviços com login, painel, pagamentos, automações de WhatsApp e marketing.");
  const [dryRun, setDryRun] = useState(true);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    if (!prompt.trim()) {
      Alert.alert("Atenção", "Descreva o aplicativo que deseja criar com IA.");
      return;
    }

    try {
      setRunning(true);
      const response = await runAiFactory({ prompt, dryRun });
      Alert.alert("Geração iniciada", response.dryRun ? "Projeto criado em modo seguro." : "Projeto criado usando IA real.");
      router.replace(response.runId ? `/apps/${response.runId}` : "/apps");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível executar o gerador de apps com IA.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <SaasProductShell
      title="Gerador de aplicativos com IA"
      subtitle="Descreva o produto e deixe os agentes estruturarem briefing, produto, UX, código, automações, marketing e precificação."
    >
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.eyebrow}>Novo projeto</Text>
            <Text style={styles.title}>Criar app com agentes IA</Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dry run</Text>
            <Switch value={dryRun} onValueChange={setDryRun} trackColor={{ false: "#334155", true: "#facc15" }} thumbColor="#ffffff" />
          </View>
        </View>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Ex: app de delivery local com painel, Pix, WhatsApp e posts..."
          placeholderTextColor="#64748b"
          style={styles.prompt}
        />

        <Pressable style={[styles.primaryButton, running ? styles.disabled : null]} onPress={() => void handleRun()} disabled={running}>
          {running ? <ActivityIndicator color="#08101c" /> : <Text style={styles.primaryButtonText}>Executar agentes IA</Text>}
        </Pressable>
      </View>
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.9)",
    padding: 22,
    gap: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  eyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    color: "#cbd5e1",
    fontWeight: "900",
  },
  prompt: {
    minHeight: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "#070A12",
    color: "#f8fafc",
    padding: 16,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  primaryButton: {
    alignSelf: "flex-start",
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.65,
  },
});
