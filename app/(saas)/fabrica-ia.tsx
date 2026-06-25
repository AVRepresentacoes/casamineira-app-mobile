import {
  generateAiFactoryArtifacts,
  listAiFactoryArtifacts,
  listAiFactoryAuditLogs,
  listAiFactoryAgentLogs,
  listAiFactoryRuns,
  runAiFactory,
  updateAiFactoryRunApproval,
  type AiFactoryAgentLog,
  type AiFactoryAuditLog,
  type AiFactoryArtifact,
  type AiFactoryRun,
} from "@/lib/ai-factory";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function money(value: unknown) {
  const number = Number(value || 0);
  return `R$ ${number.toFixed(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function statusLabel(status: AiFactoryRun["status"]) {
  const labels = {
    queued: "Na fila",
    running: "Rodando",
    completed: "Concluida",
    failed: "Falhou",
  };
  return labels[status] || status;
}

function approvalLabel(status: AiFactoryRun["approval_status"]) {
  const labels = {
    pending: "Aguardando aprovacao",
    approved: "Aprovada",
    rejected: "Reprovada",
  };
  return labels[status] || status;
}

export default function SaasAiFactoryScreen() {
  const [runs, setRuns] = useState<AiFactoryRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AiFactoryAgentLog[]>([]);
  const [artifacts, setArtifacts] = useState<AiFactoryArtifact[]>([]);
  const [auditLogs, setAuditLogs] = useState<AiFactoryAuditLog[]>([]);
  const [prompt, setPrompt] = useState("Quero um app para minha barbearia com agendamento, Pix, painel administrativo, WhatsApp automático e posts para Instagram.");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [generatingArtifacts, setGeneratingArtifacts] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  const selectedRun = useMemo(
    () => runs.find((item) => item.id === selectedRunId) || runs[0] || null,
    [runs, selectedRunId],
  );

  const briefing = asRecord(selectedRun?.briefing);
  const result = asRecord(selectedRun?.result);
  const appGeneration = asRecord(result.appGeneration);
  const marketing = asRecord(result.marketing);
  const automation = asRecord(result.automation);
  const pricing = asRecord(result.pricing);

  const stats = useMemo(() => {
    const completed = runs.filter((item) => item.status === "completed").length;
    const pending = runs.filter((item) => item.approval_status === "pending").length;
    const approved = runs.filter((item) => item.approval_status === "approved").length;
    return { completed, pending, approved };
  }, [runs]);

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAiFactoryRuns();
      setRuns(data);
      if (!selectedRunId && data[0]?.id) setSelectedRunId(data[0].id);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel carregar a fabrica de IA.");
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  const loadLogs = useCallback(async (runId: string | null) => {
    if (!runId) {
      setLogs([]);
      return;
    }

    try {
      setLoadingLogs(true);
      setLogs(await listAiFactoryAgentLogs(runId));
    } catch (error) {
      console.log("AI FACTORY LOGS ERROR:", error);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const loadArtifacts = useCallback(async (runId: string | null) => {
    if (!runId) {
      setArtifacts([]);
      return;
    }

    try {
      setLoadingArtifacts(true);
      setArtifacts(await listAiFactoryArtifacts(runId));
    } catch (error) {
      console.log("AI FACTORY ARTIFACTS ERROR:", error);
      setArtifacts([]);
    } finally {
      setLoadingArtifacts(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async (runId: string | null) => {
    if (!runId) {
      setAuditLogs([]);
      return;
    }

    try {
      setLoadingAudit(true);
      setAuditLogs(await listAiFactoryAuditLogs(runId));
    } catch (error) {
      console.log("AI FACTORY AUDIT ERROR:", error);
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRuns();
    }, [loadRuns]),
  );

  useFocusEffect(
    useCallback(() => {
      void loadLogs(selectedRun?.id || null);
      void loadArtifacts(selectedRun?.id || null);
      void loadAuditLogs(selectedRun?.id || null);
    }, [loadArtifacts, loadAuditLogs, loadLogs, selectedRun?.id]),
  );

  async function handleRun() {
    try {
      setRunning(true);
      const response = await runAiFactory({ prompt, dryRun });
      await loadRuns();
      if (response.runId) setSelectedRunId(response.runId);
      Alert.alert("Fabrica executada", response.dryRun ? "Run criada em modo seguro." : "IA real executada no backend.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel executar a fabrica.");
    } finally {
      setRunning(false);
    }
  }

  async function handleApproval(status: "approved" | "rejected") {
    if (!selectedRun) return;

    try {
      await updateAiFactoryRunApproval(selectedRun.id, status, approvalNotes);
      setApprovalNotes("");
      await loadRuns();
      Alert.alert("Status atualizado", status === "approved" ? "Run aprovada para a proxima etapa." : "Run reprovada para revisao.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel atualizar a aprovacao.");
    }
  }

  async function handleGenerateArtifacts() {
    if (!selectedRun) return;

    if (selectedRun.approval_status !== "approved") {
      Alert.alert("Aprovacao necessaria", "A run precisa estar aprovada antes de gerar client.json e provision.sql.");
      return;
    }

    try {
      setGeneratingArtifacts(true);
      const generated = await generateAiFactoryArtifacts(selectedRun.id);
      setArtifacts(generated);
      Alert.alert("Artefatos gerados", "client.json, provision.sql e manifesto foram preparados para revisao.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel gerar artefatos.");
    } finally {
      setGeneratingArtifacts(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadRuns()} tintColor="#facc15" />}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Fabrica automatizada</Text>
          <Text style={styles.title}>Painel de agentes IA</Text>
          <Text style={styles.subtitle}>Acompanhe briefings, planos, logs dos agentes e aprovacoes antes de gerar arquivos ou builds.</Text>
        </View>
        <View style={styles.headerMetrics}>
          <MetricCard label="Concluidas" value={String(stats.completed)} />
          <MetricCard label="Pendentes" value={String(stats.pending)} />
          <MetricCard label="Aprovadas" value={String(stats.approved)} />
        </View>
      </View>

      <View style={styles.launchPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Novo pedido</Text>
            <Text style={styles.panelHint}>A IA roda somente pela Edge Function. O modo seguro nao consome OpenAI.</Text>
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
          placeholder="Descreva o app, sistema, marketing e automacoes..."
          placeholderTextColor="#64748b"
          style={styles.promptInput}
        />
        <TouchableOpacity style={[styles.primaryButton, running ? styles.disabled : null]} onPress={() => void handleRun()} disabled={running}>
          {running ? <ActivityIndicator color="#020617" /> : <Text style={styles.primaryButtonText}>Executar fabrica</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.workspace}>
        <View style={styles.runsColumn}>
          <Text style={styles.sectionTitle}>Execucoes recentes</Text>
          <FlatList
            data={runs}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color="#facc15" />
              ) : (
                <Text style={styles.emptyText}>Nenhuma run registrada ainda.</Text>
              )
            }
            renderItem={({ item }) => {
              const active = item.id === selectedRun?.id;
              return (
                <TouchableOpacity style={[styles.runItem, active ? styles.runItemActive : null]} onPress={() => setSelectedRunId(item.id)}>
                  <View style={styles.runTop}>
                    <Text style={styles.runTitle}>{String(asRecord(item.briefing).appName || "App sem nome")}</Text>
                    <View style={[styles.badge, item.dry_run ? styles.badgeMuted : styles.badgeLive]}>
                      <Text style={styles.badgeText}>{item.dry_run ? "Dry" : "IA"}</Text>
                    </View>
                  </View>
                  <Text style={styles.runPrompt} numberOfLines={2}>{item.prompt}</Text>
                  <View style={styles.runMeta}>
                    <Text style={styles.metaText}>{statusLabel(item.status)}</Text>
                    <Text style={styles.metaText}>{approvalLabel(item.approval_status)}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.detailColumn}>
          {selectedRun ? (
            <>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailEyebrow}>{String(briefing.segment || "segmento")}</Text>
                  <Text style={styles.detailTitle}>{String(briefing.appName || "App sem nome")}</Text>
                  <Text style={styles.detailSub}>{selectedRun.prompt}</Text>
                </View>
                <View style={[styles.approvalBadge, approvalStyles[selectedRun.approval_status]]}>
                  <Text style={styles.approvalText}>{approvalLabel(selectedRun.approval_status)}</Text>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <InfoBlock title="Funcionalidades" items={asList(briefing.features)} />
                <InfoBlock title="Template e arquitetura" items={[String(appGeneration.template || "template pendente"), ...asList(appGeneration.architecture)]} />
                <InfoBlock title="Marketing" items={[String(marketing.positioning || "posicionamento pendente"), ...asList(marketing.socialPosts)]} />
                <InfoBlock title="Automacoes" items={[...asList(automation.whatsappFlows), ...asList(automation.n8nFlows)]} />
              </View>

              <View style={styles.pricingRow}>
                <MetricCard label="Setup" value={money(pricing.setupPrice)} />
                <MetricCard label="Mensalidade" value={money(pricing.monthlyPrice)} />
                <MetricCard label="Reserva IA" value={money(pricing.aiCostReserve)} />
                <MetricCard label="Custo estimado" value={money(selectedRun.estimated_cost_brl)} />
              </View>

              <View style={styles.approvalPanel}>
                <Text style={styles.panelTitle}>Aprovacao humana</Text>
                <Text style={styles.panelHint}>Aprovacao libera a run para a proxima etapa. Ainda nao gera arquivos nem builds automaticamente.</Text>
                <TextInput
                  value={approvalNotes}
                  onChangeText={setApprovalNotes}
                  placeholder="Observacoes para a proxima etapa"
                  placeholderTextColor="#64748b"
                  style={styles.notesInput}
                />
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => void handleApproval("rejected")}>
                    <Text style={styles.rejectButtonText}>Reprovar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveButton} onPress={() => void handleApproval("approved")}>
                    <Text style={styles.approveButtonText}>Aprovar etapa</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.artifactsPanel}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelTitle}>Artefatos white-label</Text>
                    <Text style={styles.panelHint}>Gera arquivos compatíveis com o fluxo existente em clients/&lt;slug&gt;, sem escrever no repositório nem executar build.</Text>
                  </View>
                  {loadingArtifacts ? <ActivityIndicator color="#facc15" /> : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.secondaryActionButton,
                    selectedRun.approval_status !== "approved" || generatingArtifacts ? styles.disabled : null,
                  ]}
                  onPress={() => void handleGenerateArtifacts()}
                  disabled={selectedRun.approval_status !== "approved" || generatingArtifacts}
                >
                  {generatingArtifacts ? (
                    <ActivityIndicator color="#bfdbfe" />
                  ) : (
                    <Text style={styles.secondaryActionButtonText}>Gerar client.json e provision.sql</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.artifactList}>
                  {artifacts.length ? (
                    artifacts.map((artifact) => <ArtifactPreview key={artifact.id} artifact={artifact} />)
                  ) : (
                    <Text style={styles.emptyText}>Aprove a run e gere os artefatos para revisar os arquivos aqui.</Text>
                  )}
                </View>
              </View>

              <View style={styles.logsPanel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Logs dos agentes</Text>
                  {loadingLogs ? <ActivityIndicator color="#facc15" /> : <Text style={styles.panelHint}>{logs.length} registros</Text>}
                </View>
                <View style={styles.logsList}>
                  {logs.length ? logs.map((log) => <AgentLogRow key={log.id} log={log} />) : <Text style={styles.emptyText}>Logs aparecerao quando a persistencia estiver ativa.</Text>}
                </View>
              </View>

              <View style={styles.logsPanel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Auditoria</Text>
                  {loadingAudit ? <ActivityIndicator color="#facc15" /> : <Text style={styles.panelHint}>{auditLogs.length} eventos</Text>}
                </View>
                <View style={styles.logsList}>
                  {auditLogs.length ? auditLogs.map((log) => <AuditLogRow key={log.id} log={log} />) : <Text style={styles.emptyText}>Eventos de auditoria aparecerao apos a proxima execucao ou geracao de artefatos.</Text>}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>Selecione ou execute uma run</Text>
              <Text style={styles.emptyText}>O detalhe da fabrica sera exibido aqui.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoTitle}>{title}</Text>
      {items.slice(0, 6).map((item, index) => (
        <Text key={`${title}-${index}`} style={styles.infoItem}>• {item}</Text>
      ))}
    </View>
  );
}

function AgentLogRow({ log }: { log: AiFactoryAgentLog }) {
  const output = asRecord(log.output);
  return (
    <View style={styles.logRow}>
      <View style={styles.logDot} />
      <View style={styles.logCopy}>
        <Text style={styles.logTitle}>{log.agent_name}</Text>
        <Text style={styles.logText}>{String(output.summary || log.status)}</Text>
      </View>
      <Text style={styles.logStatus}>{log.status}</Text>
    </View>
  );
}

function ArtifactPreview({ artifact }: { artifact: AiFactoryArtifact }) {
  return (
    <View style={styles.artifactCard}>
      <View style={styles.artifactHeader}>
        <Text style={styles.artifactPath}>{artifact.file_path}</Text>
        <Text style={styles.artifactType}>{artifact.artifact_type}</Text>
      </View>
      <Text style={styles.artifactContent} numberOfLines={8}>{artifact.content}</Text>
    </View>
  );
}

function AuditLogRow({ log }: { log: AiFactoryAuditLog }) {
  return (
    <View style={styles.logRow}>
      <View style={[styles.logDot, log.status === "failed" || log.status === "denied" ? styles.logDotAlert : null]} />
      <View style={styles.logCopy}>
        <Text style={styles.logTitle}>{log.action}</Text>
        <Text style={styles.logText}>{formatDate(log.created_at)} • {log.ip_address || "IP nao registrado"}</Text>
      </View>
      <Text style={styles.logStatus}>{log.status}</Text>
    </View>
  );
}

const approvalStyles = StyleSheet.create({
  pending: { backgroundColor: "rgba(250, 204, 21, 0.16)", borderColor: "rgba(250, 204, 21, 0.36)" },
  approved: { backgroundColor: "rgba(34, 197, 94, 0.18)", borderColor: "rgba(34, 197, 94, 0.40)" },
  rejected: { backgroundColor: "rgba(248, 113, 113, 0.16)", borderColor: "rgba(248, 113, 113, 0.36)" },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  header: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 18,
    gap: 16,
  },
  headerCopy: {
    gap: 6,
  },
  eyebrow: {
    color: "#67e8f9",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    lineHeight: 21,
  },
  headerMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  metricValue: {
    color: "#ffffff",
    marginTop: 8,
    fontSize: 20,
    fontWeight: "900",
  },
  launchPanel: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  panelHint: {
    color: "#94a3b8",
    marginTop: 4,
    maxWidth: 620,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    color: "#e5e7eb",
    fontWeight: "800",
  },
  promptInput: {
    minHeight: 112,
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#020617",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.72,
  },
  workspace: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  runsColumn: {
    flex: 0.8,
    minWidth: 300,
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
  },
  detailColumn: {
    flex: 1.6,
    minWidth: 340,
    gap: 14,
  },
  sectionTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 12,
  },
  separator: {
    height: 10,
  },
  runItem: {
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 12,
    gap: 8,
  },
  runItemActive: {
    borderColor: "#facc15",
  },
  runTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  runTitle: {
    color: "#ffffff",
    fontWeight: "900",
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeMuted: {
    backgroundColor: "#334155",
  },
  badgeLive: {
    backgroundColor: "#0369a1",
  },
  badgeText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 11,
  },
  runPrompt: {
    color: "#94a3b8",
    lineHeight: 18,
  },
  runMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "800",
  },
  dateText: {
    color: "#64748b",
    fontSize: 12,
  },
  detailHeader: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    gap: 12,
  },
  detailEyebrow: {
    color: "#facc15",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  detailTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  detailSub: {
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 20,
  },
  approvalBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  approvalText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    minWidth: 230,
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
  },
  infoTitle: {
    color: "#ffffff",
    fontWeight: "900",
    marginBottom: 10,
  },
  infoItem: {
    color: "#cbd5e1",
    lineHeight: 20,
    marginBottom: 4,
  },
  pricingRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  approvalPanel: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    gap: 12,
  },
  artifactsPanel: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    gap: 12,
  },
  secondaryActionButton: {
    backgroundColor: "#172554",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryActionButtonText: {
    color: "#bfdbfe",
    fontWeight: "900",
  },
  artifactList: {
    gap: 10,
  },
  artifactCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 12,
    gap: 10,
  },
  artifactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  artifactPath: {
    color: "#ffffff",
    fontWeight: "900",
    flex: 1,
  },
  artifactType: {
    color: "#67e8f9",
    fontWeight: "900",
    fontSize: 12,
  },
  artifactContent: {
    color: "#cbd5e1",
    backgroundColor: "#020617",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 10,
    lineHeight: 18,
    fontFamily: "monospace",
    fontSize: 12,
  },
  notesInput: {
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 12,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    minWidth: 130,
    backgroundColor: "#3f1d24",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#fecaca",
    fontWeight: "900",
  },
  approveButton: {
    flex: 1,
    minWidth: 130,
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  approveButtonText: {
    color: "#020617",
    fontWeight: "900",
  },
  logsPanel: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    gap: 12,
  },
  logsList: {
    gap: 10,
  },
  logRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 12,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    marginTop: 5,
  },
  logDotAlert: {
    backgroundColor: "#ef4444",
  },
  logCopy: {
    flex: 1,
  },
  logTitle: {
    color: "#ffffff",
    fontWeight: "900",
  },
  logText: {
    color: "#94a3b8",
    marginTop: 4,
  },
  logStatus: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 12,
  },
  emptyPanel: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 18,
  },
  emptyTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 17,
  },
  emptyText: {
    color: "#94a3b8",
    lineHeight: 20,
  },
});
