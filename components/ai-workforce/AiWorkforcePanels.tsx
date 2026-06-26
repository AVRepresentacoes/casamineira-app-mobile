import { workforceTimeline } from "@/src/ai-workforce/mock";
import type { AiWorkforceAnalytics, AiWorker, WorkerTask } from "@/src/ai-workforce/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const columns = ["Backlog", "Em andamento", "Revisão", "Concluído"] as const;

export function WorkforceKanban({ tasks, workers }: { tasks: WorkerTask[]; workers: AiWorker[] }) {
  return (
    <View style={styles.kanban}>
      {columns.map((column) => (
        <View key={column} style={styles.kanbanColumn}>
          <Text style={styles.columnTitle}>{column}</Text>
          {tasks
            .filter((task) => task.column === column)
            .map((task) => {
              const worker = workers.find((item) => item.id === task.ownerId);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <Text style={styles.taskPriority}>{task.priority}</Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskOwner}>{worker?.name ?? "AI Worker"}</Text>
                </View>
              );
            })}
        </View>
      ))}
    </View>
  );
}

export function WorkforceTimeline() {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Timeline Global</Text>
      {workforceTimeline.map((item, index) => (
        <View key={item} style={styles.timelineRow}>
          <View style={[styles.timelineMarker, index < 4 ? styles.timelineMarkerActive : null]} />
          <View style={styles.timelineCopy}>
            <Text style={styles.timelineTitle}>{item}</Text>
            <Text style={styles.timelineMeta}>{index < 4 ? "Em progresso simultâneo" : "Próxima etapa"}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function WorkforceAnalytics({ analytics }: { analytics: AiWorkforceAnalytics }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Analytics</Text>
      <View style={styles.metricsGrid}>
        <Metric label="Produtividade" value={`${analytics.productivity}%`} icon="chart-timeline-variant" />
        <Metric label="Custo estimado" value={analytics.estimatedCost} icon="cash-multiple" />
        <Metric label="Economia gerada" value={analytics.generatedSavings} icon="trending-up" />
      </View>
      <Text style={styles.subTitle}>Tempo por agente</Text>
      {analytics.timeByAgent.map((item) => (
        <View key={item.workerId} style={styles.timeRow}>
          <Text style={styles.timeLabel}>{item.label}</Text>
          <View style={styles.timeTrack}>
            <View style={[styles.timeFill, { width: `${Math.min(item.hours * 8, 100)}%` }]} />
          </View>
          <Text style={styles.timeValue}>{item.hours}h</Text>
        </View>
      ))}
    </View>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons name={icon} size={21} color="#67e8f9" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kanban: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kanbanColumn: {
    flex: 1,
    minWidth: 230,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 14,
    gap: 10,
  },
  columnTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  taskCard: {
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    gap: 6,
  },
  taskPriority: {
    color: "#facc15",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  taskTitle: {
    color: "#f8fafc",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  taskOwner: {
    color: "#94a3b8",
    fontSize: 12,
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
  },
  timelineRow: {
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
  },
  timelineMarker: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#64748b",
  },
  timelineMarkerActive: {
    borderColor: "#86efac",
    backgroundColor: "rgba(134, 239, 172, 0.22)",
  },
  timelineCopy: {
    flex: 1,
    gap: 3,
  },
  timelineTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  timelineMeta: {
    color: "#94a3b8",
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metric: {
    flex: 1,
    minWidth: 160,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 13,
    gap: 7,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  subTitle: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  timeLabel: {
    width: 38,
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "900",
  },
  timeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  timeFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#67e8f9",
  },
  timeValue: {
    width: 34,
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
});
