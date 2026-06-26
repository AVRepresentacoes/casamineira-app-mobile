import { AiWorkerCard } from "@/components/ai-workforce/AiWorkerCard";
import { WorkforceAnalytics, WorkforceKanban, WorkforceTimeline } from "@/components/ai-workforce/AiWorkforcePanels";
import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { useAiWorkforce } from "@/src/ai-workforce/AiWorkforceContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type WorkforceView = "Equipe" | "Kanban" | "Timeline" | "Analytics";

const views: WorkforceView[] = ["Equipe", "Kanban", "Timeline", "Analytics"];

export default function AiWorkforceScreen() {
  const {
    workers,
    tasks,
    analytics,
    orchestrationWorkflow,
    orchestrationResults,
    selectedWorkerId,
    setSelectedWorkerId,
    getWorkerById,
  } = useAiWorkforce();
  const [view, setView] = useState<WorkforceView>("Equipe");
  const selectedWorker = getWorkerById(selectedWorkerId) ?? workers[0];

  const stats = useMemo(
    () => [
      { label: "Agentes IA", value: String(workers.length), icon: "account-group-outline" },
      { label: "Trabalhando", value: String(workers.filter((worker) => worker.status === "Working").length), icon: "progress-clock" },
      { label: "Em revisão", value: String(workers.filter((worker) => worker.status === "Review").length), icon: "clipboard-check-outline" },
      { label: "Produtividade", value: `${analytics.productivity}%`, icon: "chart-line" },
    ],
    [analytics.productivity, workers],
  );

  return (
    <SaasProductShell
      title="AI Workforce™"
      subtitle="Uma empresa de software composta por especialistas em IA, pronta para futura integração com Agents SDK."
    >
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>AI Software Company</Text>
          <Text style={styles.heroTitle}>Especialistas trabalhando em paralelo.</Text>
          <Text style={styles.heroText}>
            Visualize consultoria, arquitetura, design, engenharia, segurança, marketing, publicação e sucesso do cliente como uma força de trabalho coordenada.
          </Text>
        </View>
        <View style={styles.heroPanel}>
          <Text style={styles.heroPanelTitle}>Status global</Text>
          <Text style={styles.heroPanelValue}>Simulação ativa</Text>
          <Text style={styles.heroPanelText}>Sem IA real, sem API e sem backend nesta sprint.</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <MaterialCommunityIcons name={stat.icon as never} size={22} color="#67e8f9" />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orchestrationPanel}>
        <View style={styles.orchestrationHeader}>
          <View>
            <Text style={styles.orchestrationEyebrow}>AI Orchestration Core</Text>
            <Text style={styles.orchestrationTitle}>{orchestrationWorkflow.name}</Text>
            <Text style={styles.orchestrationText}>{orchestrationWorkflow.objective}</Text>
          </View>
          <View style={styles.orchestrationBadge}>
            <Text style={styles.orchestrationBadgeText}>Mock backend-only</Text>
          </View>
        </View>
        <View style={styles.workflowGrid}>
          {orchestrationWorkflow.steps.slice(0, 4).map((step) => {
            const result = orchestrationResults.find((item) => item.taskId === step.taskId);
            return (
              <View key={step.id} style={styles.workflowCard}>
                <Text style={styles.workflowOrder}>Etapa {step.order}</Text>
                <Text style={styles.workflowTitle}>{step.title}</Text>
                <Text style={styles.workflowText}>{result?.summary ?? step.expectedOutput}</Text>
                <Text style={styles.workflowMeta}>{step.approvalState === "pending" ? "Aprovação humana pendente" : "Sem aprovação necessária"}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.tabs}>
        {views.map((item) => {
          const active = view === item;
          return (
            <Pressable key={item} style={[styles.tab, active ? styles.tabActive : null]} onPress={() => setView(item)}>
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      {view === "Equipe" ? (
        <View style={styles.layout}>
          <View style={styles.grid}>
            {workers.map((worker) => (
              <AiWorkerCard key={worker.id} worker={worker} active={worker.id === selectedWorkerId} onPress={() => setSelectedWorkerId(worker.id)} />
            ))}
          </View>
          <View style={styles.sidePanel}>
            <Text style={styles.sideEyebrow}>Agente selecionado</Text>
            <Text style={styles.sideTitle}>{selectedWorker.name}</Text>
            <Text style={styles.sideText}>{selectedWorker.specialty}</Text>
            <View style={styles.skillList}>
              {selectedWorker.skills.map((skill) => (
                <View key={skill.id} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill.name} · {skill.level}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sideEyebrow}>Histórico</Text>
            {selectedWorker.history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <MaterialCommunityIcons name="history" size={15} color="#94a3b8" />
                <Text style={styles.historyText}>{item.activity}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {view === "Kanban" ? <WorkforceKanban tasks={tasks} workers={workers} /> : null}
      {view === "Timeline" ? <WorkforceTimeline /> : null}
      {view === "Analytics" ? <WorkforceAnalytics analytics={analytics} /> : null}
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 26,
  },
  heroCopy: {
    flex: 1,
    minWidth: 300,
    gap: 10,
  },
  kicker: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
  },
  heroText: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 820,
  },
  heroPanel: {
    width: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.24)",
    backgroundColor: "rgba(113, 63, 18, 0.16)",
    padding: 16,
    gap: 7,
  },
  heroPanelTitle: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroPanelValue: {
    color: "#f8fafc",
    fontSize: 23,
    fontWeight: "900",
  },
  heroPanelText: {
    color: "#fef3c7",
    fontSize: 12,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 16,
    gap: 7,
  },
  statValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.9)",
    padding: 10,
  },
  orchestrationPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(8, 13, 24, 0.96)",
    padding: 18,
    gap: 16,
  },
  orchestrationHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  orchestrationEyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  orchestrationTitle: {
    color: "#f8fafc",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  orchestrationText: {
    color: "#b6c3d5",
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 760,
    marginTop: 5,
  },
  orchestrationBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.28)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  orchestrationBadgeText: {
    color: "#fde68a",
    fontSize: 11,
    fontWeight: "900",
  },
  workflowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  workflowCard: {
    flex: 1,
    minWidth: 210,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 7,
  },
  workflowOrder: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  workflowTitle: {
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },
  workflowText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
  },
  workflowMeta: {
    color: "#93c5fd",
    fontSize: 11,
    fontWeight: "900",
  },
  tab: {
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  tabActive: {
    backgroundColor: "#facc15",
  },
  tabText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
  },
  tabTextActive: {
    color: "#07111f",
  },
  layout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    alignItems: "flex-start",
  },
  grid: {
    flex: 1,
    minWidth: 320,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  sidePanel: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 13,
  },
  sideEyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sideTitle: {
    color: "#f8fafc",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  sideText: {
    color: "#b6c3d5",
    fontSize: 13,
    lineHeight: 20,
  },
  skillList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  skillText: {
    color: "#dbeafe",
    fontSize: 11,
    fontWeight: "900",
  },
  historyRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  historyText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
  },
});
