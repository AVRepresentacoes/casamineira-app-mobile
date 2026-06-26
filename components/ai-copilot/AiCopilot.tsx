import { BrandLogo } from "@/components/brand/BrandLogo";
import { aiCopilotQuickSuggestions } from "@/src/ai-copilot/mock";
import { useAiCopilot } from "@/src/ai-copilot/AiCopilotContext";
import type { AiCopilotState } from "@/src/ai-copilot/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const stateLabel: Record<AiCopilotState, string> = {
  idle: "Pronto",
  thinking: "Analisando",
  typing: "Digitando",
  completed: "Pronto",
  warning: "Atenção",
};

const stateColor: Record<AiCopilotState, string> = {
  idle: "#86efac",
  thinking: "#facc15",
  typing: "#67e8f9",
  completed: "#86efac",
  warning: "#fb7185",
};

export function AiCopilot() {
  const { width } = useWindowDimensions();
  const compact = width < 860;
  const { state, isOpen, toggle, close, runMockAnalysis, recommendations, insights, actions, history } = useAiCopilot();
  const slide = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slide]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    if (state === "thinking" || state === "typing") {
      loop.start();
    } else {
      loop.stop();
      pulse.setValue(0);
    }
    return () => loop.stop();
  }, [pulse, state]);

  if (Platform.OS !== "web") {
    return null;
  }

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [compact ? 390 : 420, 0],
  });
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <>
      <Pressable style={[styles.floatingButton, webFloatingButtonStyle, compact ? styles.floatingButtonCompact : null]} onPress={toggle}>
        <Ionicons name={isOpen ? "close" : "sparkles"} size={22} color="#07111f" />
      </Pressable>

      <Animated.View style={[styles.panel, webPanelStyle, compact ? styles.panelCompact : null, { opacity, transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <BrandLogo size="small" showText={false} />
            <View>
              <Text style={styles.title}>AI Copilot™</Text>
              <View style={styles.statusRow}>
                <Animated.View style={[styles.statusDot, { backgroundColor: stateColor[state], transform: [{ scale: pulseScale }] }]} />
                <Text style={styles.statusText}>{stateLabel[state]}</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.iconButton} onPress={close}>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            Analisei seu projeto. Percebi que o Business DNA selecionado possui integração nativa com Marketplace. Recomendo manter essa configuração.
          </Text>
          <Pressable style={styles.analysisButton} onPress={runMockAnalysis}>
            <Ionicons name="flash-outline" size={16} color="#07111f" />
            <Text style={styles.analysisButtonText}>Analisar visualmente</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sugestões inteligentes</Text>
          <View style={styles.chipGrid}>
            {aiCopilotQuickSuggestions.map((suggestion) => (
              <Pressable key={suggestion} style={styles.chip} onPress={runMockAnalysis}>
                <Text style={styles.chipText}>✓ {suggestion}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas ações</Text>
          {actions.map((action, index) => (
            <View key={action.id} style={styles.actionRow}>
              <View style={[styles.actionNumber, action.completed ? styles.actionNumberDone : null]}>
                <Text style={[styles.actionNumberText, action.completed ? styles.actionNumberTextDone : null]}>{index + 1}</Text>
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>{action.label}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <Text style={styles.insightCategory}>{insight.category}</Text>
              <Text style={styles.insightText}>{insight.content}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <Ionicons name="time-outline" size={15} color="#94a3b8" />
              <Text style={styles.historyText}>{item.message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas recomendações</Text>
          {recommendations.map((recommendation) => (
            <View key={recommendation.id} style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <Text style={styles.recommendationText}>{recommendation.description}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    right: 22,
    bottom: 22,
    zIndex: 9999,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButtonCompact: {
    right: 16,
    bottom: 16,
  },
  panel: {
    right: 18,
    top: 18,
    bottom: 18,
    zIndex: 9998,
    width: 390,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.16)",
    backgroundColor: "rgba(7, 10, 18, 0.97)",
    padding: 16,
    gap: 14,
  },
  panelCompact: {
    left: 12,
    right: 12,
    top: 12,
    bottom: 84,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  statusText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  messageBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.2)",
    backgroundColor: "rgba(8, 145, 178, 0.12)",
    padding: 14,
    gap: 12,
  },
  messageText: {
    color: "#e5eefb",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  analysisButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: "#facc15",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
  },
  analysisButtonText: {
    color: "#07111f",
    fontSize: 12,
    fontWeight: "900",
  },
  section: {
    gap: 9,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    color: "#dbeafe",
    fontSize: 11,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  actionNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  actionNumberDone: {
    backgroundColor: "#86efac",
  },
  actionNumberText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "900",
  },
  actionNumberTextDone: {
    color: "#07111f",
  },
  actionCopy: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  actionDescription: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16,
  },
  insightCard: {
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 11,
    gap: 5,
  },
  insightCategory: {
    color: "#67e8f9",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  insightText: {
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  historyText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 11,
    lineHeight: 17,
  },
  recommendationCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.18)",
    backgroundColor: "rgba(113, 63, 18, 0.12)",
    padding: 11,
    gap: 5,
  },
  recommendationTitle: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
  },
  recommendationText: {
    color: "#fef3c7",
    fontSize: 11,
    lineHeight: 17,
  },
});

const webFloatingButtonStyle = {
  position: "fixed",
  boxShadow: "0 18px 44px rgba(0, 0, 0, 0.35)",
} as any;

const webPanelStyle = {
  position: "fixed",
  overflow: "auto",
  boxShadow: "0 24px 70px rgba(0, 0, 0, 0.45)",
} as any;
