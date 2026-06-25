import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { listAiFactoryAgentLogs, listAiFactoryArtifacts, listAiFactoryRuns, type AiFactoryAgentLog, type AiFactoryArtifact, type AiFactoryRun } from "@/lib/ai-factory";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export default function AppDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [run, setRun] = useState<AiFactoryRun | null>(null);
  const [logs, setLogs] = useState<AiFactoryAgentLog[]>([]);
  const [artifacts, setArtifacts] = useState<AiFactoryArtifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const runs = await listAiFactoryRuns();
        const currentRun = runs.find((item) => item.id === id) || null;
        const [logsData, artifactsData] = await Promise.all([
          currentRun ? listAiFactoryAgentLogs(currentRun.id).catch(() => []) : Promise.resolve([]),
          currentRun ? listAiFactoryArtifacts(currentRun.id).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;
        setRun(currentRun);
        setLogs(logsData);
        setArtifacts(artifactsData);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const briefing = useMemo(() => asRecord(run?.briefing), [run?.briefing]);

  return (
    <SaasProductShell title={String(briefing.appName || "Detalhe do app")} subtitle="Detalhe do projeto gerado pela Casa Mineira SaaS, separado do app Casa Mineira Serviços.">
      <Pressable style={styles.backButton} onPress={() => router.push("/apps")}>
        <Text style={styles.backButtonText}>Voltar para apps</Text>
      </Pressable>

      {loading ? <ActivityIndicator color="#facc15" /> : null}

      {!loading && !run ? (
        <View style={styles.card}>
          <Text style={styles.title}>Projeto não encontrado</Text>
          <Text style={styles.body}>Não encontramos esta geração no histórico da Fábrica IA.</Text>
        </View>
      ) : null}

      {run ? (
        <>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Briefing</Text>
            <Text style={styles.title}>{String(briefing.segment || "Projeto SaaS")}</Text>
            <Text style={styles.body}>{run.prompt}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{run.status}</Text>
              <Text style={styles.meta}>{run.approval_status}</Text>
              <Text style={styles.meta}>{run.dry_run ? "Dry run" : "IA real"}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>Status dos agentes</Text>
              {logs.length ? logs.map((log) => (
                <View key={log.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{log.agent_name}</Text>
                  <Text style={styles.rowMeta}>{log.status}</Text>
                </View>
              )) : <Text style={styles.body}>Nenhum log de agente encontrado para esta geração.</Text>}
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>Artefatos</Text>
              {artifacts.length ? artifacts.map((artifact) => (
                <View key={artifact.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{artifact.artifact_type}</Text>
                  <Text style={styles.rowMeta}>{artifact.file_path || "sem arquivo"}</Text>
                </View>
              )) : <Text style={styles.body}>Nenhum artefato gerado ainda.</Text>}
            </View>
          </View>
        </>
      ) : null}
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 320,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  body: {
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
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.1)",
    paddingTop: 10,
    gap: 4,
  },
  rowTitle: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  rowMeta: {
    color: "#94a3b8",
  },
});
