import { SaasProductShell } from "@/components/saas/SaasProductShell";
import {
  consultantNextSteps,
  consultantQuickSuggestions,
  consultantVisualStates,
  initialConsultantMessage,
  placeholderConsultantResponse,
} from "@/src/ai-business-consultant/mock";
import type { ConsultantMessage, ConsultantVisualState } from "@/src/ai-business-consultant/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const stateIcon: Record<ConsultantVisualState, IconName> = {
  nova_conversa: "chatbubble-ellipses-outline",
  aguardando_resposta: "time-outline",
  digitando: "create-outline",
  resposta_recebida: "checkmark-circle-outline",
  erro: "alert-circle-outline",
};

const stateLabel: Record<ConsultantVisualState, string> = {
  nova_conversa: "Nova conversa",
  aguardando_resposta: "Aguardando resposta",
  digitando: "Digitando",
  resposta_recebida: "Resposta recebida",
  erro: "Erro",
};

const simulatedAssistantMessage: ConsultantMessage = {
  id: "simulated-consultant-response",
  role: "assistant",
  timestampLabel: "Visual",
  state: "resposta_recebida",
  content:
    "Perfeito. Nesta versão visual, eu recomendaria partir de um Business DNA™ validado, escolher um Template Premium compatível e personalizar módulos antes de gerar o projeto.",
};

export default function AiBusinessConsultantPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 980;
  const [draft, setDraft] = useState("");
  const [visualState, setVisualState] = useState<ConsultantVisualState>("nova_conversa");
  const [messages, setMessages] = useState<ConsultantMessage[]>([initialConsultantMessage]);

  const stateDescription = useMemo(() => consultantVisualStates.find((item) => item.id === visualState)?.description ?? "", [visualState]);

  function applySuggestion(label: string) {
    const userMessage: ConsultantMessage = {
      id: `suggestion-${Date.now()}`,
      role: "user",
      timestampLabel: "Agora",
      content: label,
      state: "aguardando_resposta",
    };
    setDraft(label);
    setMessages([initialConsultantMessage, userMessage, simulatedAssistantMessage]);
    setVisualState("resposta_recebida");
  }

  function simulateSend() {
    const content = draft.trim() || "Quero transformar minha ideia em uma empresa digital.";
    const userMessage: ConsultantMessage = {
      id: `manual-${Date.now()}`,
      role: "user",
      timestampLabel: "Agora",
      content,
      state: "aguardando_resposta",
    };
    setMessages([initialConsultantMessage, userMessage, simulatedAssistantMessage]);
    setVisualState("resposta_recebida");
  }

  function startNewConversation() {
    setDraft("");
    setMessages([initialConsultantMessage]);
    setVisualState("nova_conversa");
  }

  return (
    <SaasProductShell
      title="Seu Consultor de Negócios com IA"
      subtitle="Conte sua ideia e nós recomendaremos a melhor estrutura para sua empresa digital."
    >
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.badge}>
            <Ionicons name="sparkles-outline" size={16} color="#67e8f9" />
            <Text style={styles.badgeText}>AI Business Consultant™</Text>
          </View>
          <Text style={styles.heroTitle}>Planeje a empresa digital antes de construir.</Text>
          <Text style={styles.heroText}>
            Use esta consultoria visual para alinhar Business DNA™, templates, módulos e próximos passos sem iniciar nenhuma geração automática.
          </Text>
        </View>

        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={() => setVisualState("digitando")}>
            <Ionicons name="flash-outline" size={18} color="#07111f" />
            <Text style={styles.primaryButtonText}>Simular análise</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={startNewConversation}>
            <Ionicons name="refresh-outline" size={18} color="#dbeafe" />
            <Text style={styles.secondaryButtonText}>Nova conversa</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.workspace, compact ? styles.workspaceCompact : null]}>
        <View style={styles.chatPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Conversa</Text>
              <Text style={styles.sectionTitle}>Consultoria guiada</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name={stateIcon[visualState]} size={16} color={visualState === "erro" ? "#fecaca" : "#bbf7d0"} />
              <Text style={styles.statusPillText}>{stateLabel[visualState]}</Text>
            </View>
          </View>

          <View style={styles.messages}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <View key={message.id} style={[styles.messageRow, isUser ? styles.messageRowUser : null]}>
                  <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarAssistant]}>
                    <Ionicons name={isUser ? "person-outline" : "sparkles-outline"} size={18} color={isUser ? "#07111f" : "#67e8f9"} />
                  </View>
                  <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant]}>
                    <Text style={[styles.messageMeta, isUser ? styles.messageMetaUser : null]}>{isUser ? "Você" : "Consultor IA"} · {message.timestampLabel}</Text>
                    <Text style={[styles.messageText, isUser ? styles.messageTextUser : null]}>{message.content}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Sugestões rápidas</Text>
            <View style={styles.suggestionGrid}>
              {consultantQuickSuggestions.map((suggestion) => (
                <Pressable key={suggestion.id} style={styles.suggestionChip} onPress={() => applySuggestion(suggestion.label)}>
                  <Ionicons name="add-circle-outline" size={16} color="#67e8f9" />
                  <Text style={styles.suggestionText}>{suggestion.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="Descreva sua ideia, nicho, público e objetivo..."
              placeholderTextColor="#64748b"
              style={styles.input}
            />
            <Pressable style={styles.sendButton} onPress={simulateSend}>
              <Ionicons name="send-outline" size={18} color="#07111f" />
              <Text style={styles.sendButtonText}>Enviar</Text>
            </Pressable>
          </View>

          <View style={styles.stateBox}>
            <Text style={styles.stateBoxTitle}>Estados visuais preparados</Text>
            <View style={styles.stateGrid}>
              {consultantVisualStates.map((item) => {
                const active = visualState === item.id;
                return (
                  <Pressable key={item.id} style={[styles.stateChip, active ? styles.stateChipActive : null]} onPress={() => setVisualState(item.id)}>
                    <Ionicons name={stateIcon[item.id]} size={15} color={active ? "#07111f" : "#cbd5e1"} />
                    <Text style={[styles.stateChipText, active ? styles.stateChipTextActive : null]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.stateDescription}>{stateDescription}</Text>
          </View>
        </View>

        <View style={styles.sideColumn}>
          <View style={styles.summaryPanel}>
            <View style={styles.panelHeaderCompact}>
              <Text style={styles.sectionEyebrow}>Resumo da Consultoria</Text>
              <Ionicons name="document-text-outline" size={20} color="#67e8f9" />
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Business DNA recomendado</Text>
              <Text style={styles.summaryValue}>{placeholderConsultantResponse.recommendation.businessDnaName}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Templates recomendados</Text>
              <Text style={styles.summaryValue}>{placeholderConsultantResponse.recommendation.templateNames.join(" · ")}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Plano sugerido</Text>
              <Text style={styles.summaryValue}>{placeholderConsultantResponse.recommendation.suggestedPlan}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tempo estimado</Text>
              <Text style={styles.summaryValue}>{placeholderConsultantResponse.recommendation.estimatedTime}</Text>
            </View>

            <View style={styles.resourcesBox}>
              <Text style={styles.resourcesTitle}>Recursos incluídos</Text>
              {placeholderConsultantResponse.recommendation.includedResources.map((resource) => (
                <View key={resource} style={styles.resourceRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#86efac" />
                  <Text style={styles.resourceText}>{resource}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.nextPanel}>
            <Text style={styles.sectionEyebrow}>Próximos Passos</Text>
            {consultantNextSteps.map((step, index) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.integrationPanel}>
            <Text style={styles.sectionEyebrow}>Preparado para integração</Text>
            <Text style={styles.integrationText}>{placeholderConsultantResponse.summary}</Text>
            <View style={styles.integrationActions}>
              <Pressable style={styles.linkButton} onPress={() => router.push("/business-dna" as never)}>
                <Text style={styles.linkButtonText}>Business DNA™</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => router.push("/marketplace" as never)}>
                <Text style={styles.linkButtonText}>Marketplace</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => router.push("/projects" as never)}>
                <Text style={styles.linkButtonText}>Meus Projetos</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 24,
  },
  heroCopy: {
    flex: 1,
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.3)",
    backgroundColor: "rgba(8, 145, 178, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroText: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 760,
  },
  heroActions: {
    justifyContent: "center",
    gap: 10,
    minWidth: 210,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: "#facc15",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#07111f",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(219, 234, 254, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: "900",
  },
  workspace: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  workspaceCompact: {
    flexDirection: "column",
  },
  chatPanel: {
    flex: 1,
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 16,
  },
  sideColumn: {
    width: "100%",
    maxWidth: 390,
    gap: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  panelHeaderCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionEyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(187, 247, 208, 0.22)",
    backgroundColor: "rgba(22, 101, 52, 0.16)",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusPillText: {
    color: "#dcfce7",
    fontSize: 12,
    fontWeight: "900",
  },
  messages: {
    gap: 14,
  },
  messageRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarAssistant: {
    backgroundColor: "rgba(8, 145, 178, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.22)",
  },
  avatarUser: {
    backgroundColor: "#facc15",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 7,
  },
  messageBubbleAssistant: {
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
  },
  messageBubbleUser: {
    borderColor: "rgba(250, 204, 21, 0.35)",
    backgroundColor: "rgba(250, 204, 21, 0.92)",
  },
  messageMeta: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
  },
  messageMetaUser: {
    color: "#334155",
  },
  messageText: {
    color: "#e5eefb",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  messageTextUser: {
    color: "#07111f",
  },
  suggestions: {
    gap: 10,
  },
  suggestionsTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  suggestionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionText: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "800",
  },
  composer: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 82,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(2, 6, 23, 0.5)",
    color: "#f8fafc",
    padding: 14,
    fontSize: 14,
    lineHeight: 21,
  },
  sendButton: {
    width: 118,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  sendButtonText: {
    color: "#07111f",
    fontSize: 13,
    fontWeight: "900",
  },
  stateBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    padding: 14,
    gap: 10,
  },
  stateBoxTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  stateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stateChipActive: {
    backgroundColor: "#67e8f9",
    borderColor: "#67e8f9",
  },
  stateChipText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "900",
  },
  stateChipTextActive: {
    color: "#07111f",
  },
  stateDescription: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  summaryPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 14,
  },
  summaryItem: {
    gap: 4,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "900",
  },
  resourcesBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.1)",
    paddingTop: 14,
    gap: 9,
  },
  resourcesTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resourceText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  nextPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    padding: 18,
    gap: 13,
  },
  stepRow: {
    flexDirection: "row",
    gap: 11,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(103, 232, 249, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
  },
  stepCopy: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  stepDescription: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  integrationPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.2)",
    backgroundColor: "rgba(113, 63, 18, 0.15)",
    padding: 18,
    gap: 12,
  },
  integrationText: {
    color: "#fde68a",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
  },
  integrationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.25)",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  linkButtonText: {
    color: "#fef3c7",
    fontSize: 12,
    fontWeight: "900",
  },
});
