import type { AiWorker, WorkerStatus } from "@/src/ai-workforce/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const statusColors: Record<WorkerStatus, string> = {
  Idle: "#94a3b8",
  Thinking: "#facc15",
  Working: "#67e8f9",
  Review: "#c084fc",
  "Waiting Approval": "#fb923c",
  Completed: "#86efac",
  Warning: "#fb7185",
  Error: "#ef4444",
};

export function AiWorkerCard({ worker, active, onPress }: { worker: AiWorker; active?: boolean; onPress?: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const animated = worker.status === "Thinking" || worker.status === "Working";

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    if (animated) loop.start();
    return () => loop.stop();
  }, [animated, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Pressable style={[styles.card, active ? styles.cardActive : null]} onPress={onPress}>
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { transform: [{ scale }] }]}>
          <Text style={styles.avatarText}>{worker.avatar}</Text>
        </Animated.View>
        <View style={styles.workerCopy}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.specialty}>{worker.specialty}</Text>
        </View>
        <MaterialCommunityIcons name={worker.icon} size={22} color="#67e8f9" />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[worker.status] }]} />
        <Text style={styles.status}>{worker.status}</Text>
        <Text style={styles.time}>{worker.estimatedTime}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${worker.progress}%`, backgroundColor: statusColors[worker.status] }]} />
      </View>

      <Text style={styles.label}>Última atividade</Text>
      <Text style={styles.body}>{worker.lastActivity}</Text>
      <Text style={styles.label}>Próxima tarefa</Text>
      <Text style={styles.body}>{worker.nextTask}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 16,
    gap: 10,
  },
  cardActive: {
    borderColor: "rgba(250, 204, 21, 0.55)",
    backgroundColor: "rgba(113, 63, 18, 0.18)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#07111f",
    fontSize: 13,
    fontWeight: "900",
  },
  workerCopy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  specialty: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  status: {
    flex: 1,
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "900",
  },
  time: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  label: {
    color: "#67e8f9",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  body: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
  },
});
