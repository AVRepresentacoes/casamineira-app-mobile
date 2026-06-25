import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { listAiFactoryRuns, type AiFactoryRun } from "@/lib/ai-factory";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

function appNameFromRun(run: AiFactoryRun) {
  const briefing = run.briefing && typeof run.briefing === "object" ? (run.briefing as Record<string, unknown>) : {};
  return String(briefing.appName || "App gerado com IA");
}

export default function AppsScreen() {
  const router = useRouter();
  const [runs, setRuns] = useState<AiFactoryRun[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listAiFactoryRuns()
        .then((data) => {
          if (active) setRuns(data);
        })
        .catch(() => {
          if (active) setRuns([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SaasProductShell title="Apps gerados" subtitle="Projetos criados pela Casa Mineira SaaS com histórico, status e aprovação separados do app Casa Mineira Serviços.">
      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>{runs.length} projeto(s)</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/apps/new")}>
          <Text style={styles.primaryButtonText}>Novo projeto</Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color="#facc15" /> : null}

      <View style={styles.grid}>
        {runs.map((run) => (
          <Pressable key={run.id} style={styles.card} onPress={() => router.push(`/apps/${run.id}`)}>
            <Text style={styles.cardEyebrow}>{run.dry_run ? "Dry run" : "IA real"}</Text>
            <Text style={styles.cardTitle}>{appNameFromRun(run)}</Text>
            <Text style={styles.cardBody} numberOfLines={3}>{run.prompt}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{run.status}</Text>
              <Text style={styles.meta}>{run.approval_status}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {!loading && runs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum app criado ainda</Text>
          <Text style={styles.emptyBody}>Use o Business Studio™ para escolher um modelo e iniciar sua empresa digital.</Text>
        </View>
      ) : null}
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 16,
  },
  toolbarText: {
    color: "#cbd5e1",
    fontWeight: "900",
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: "#facc15",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 18,
    gap: 10,
  },
  cardEyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  cardBody: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  meta: {
    color: "#f8fafc",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  empty: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  emptyBody: {
    color: "#a8b5c7",
  },
});
