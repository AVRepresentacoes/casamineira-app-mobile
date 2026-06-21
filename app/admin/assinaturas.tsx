import { AdminBadge } from "@/components/admin-web/AdminBadge";
import { AdminDonutChart } from "@/components/admin-web/AdminChartsLazy";
import { AdminEmptyState } from "@/components/admin-web/AdminEmptyState";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin-web/AdminTable";
import { normalizeAdminPlanoNome } from "@/lib/admin-display";
import { adminWebListAssinaturas, adminWebUpdateAssinatura, type AdminWebAssinaturaRow } from "@/lib/admin-web";
import { getSaasPlanos, type SaasPlano } from "@/lib/saas-admin";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AdminAssinaturasScreen() {
  const [rows, setRows] = useState<AdminWebAssinaturaRow[]>([]);
  const [planos, setPlanos] = useState<SaasPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [assinaturas, planosData] = await Promise.all([
        adminWebListAssinaturas(search, status),
        getSaasPlanos(),
      ]);
      setRows(assinaturas);
      setPlanos(planosData);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar as assinaturas.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function setStatusQuick(row: AdminWebAssinaturaRow, nextStatus: string) {
    try {
      await adminWebUpdateAssinatura({ assinaturaId: row.assinatura_id, status: nextStatus });
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar a assinatura.");
    }
  }

  async function extendTrial(row: AdminWebAssinaturaRow) {
    const nextDate = new Date(row.trial_fim || Date.now());
    nextDate.setDate(nextDate.getDate() + 7);

    try {
      await adminWebUpdateAssinatura({
        assinaturaId: row.assinatura_id,
        trialAtivo: true,
        status: "trial",
        trialFim: nextDate.toISOString(),
      });
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível estender o trial.");
    }
  }

  async function cyclePlan(row: AdminWebAssinaturaRow) {
    if (!planos.length) return;
    const currentIndex = planos.findIndex((item) => item.id === row.plano_id);
    const nextPlan = planos[(currentIndex + 1 + planos.length) % planos.length];
    try {
      await adminWebUpdateAssinatura({
        assinaturaId: row.assinatura_id,
        planoId: nextPlan.id,
      });
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível trocar o plano.");
    }
  }

  const totalAtivas = rows.filter((row) => row.status === "ativa").length;
  const totalTrial = rows.filter((row) => row.status === "trial").length;
  const totalInad = rows.filter((row) => row.status === "inadimplente").length;
  const totalCancel = rows.filter((row) => row.status === "cancelada").length;
  const withGateway = rows.filter((row) => row.gateway_subscription_id || row.gateway_customer_id).length;
  const trialRate = rows.length ? Math.round((totalTrial / rows.length) * 100) : 0;
  const gatewayRate = rows.length ? Math.round((withGateway / rows.length) * 100) : 0;
  const assinaturaBars = [
    { id: "ativas", label: "Ativas", value: totalAtivas, color: "#4ade80" },
    { id: "teste", label: "Em teste", value: totalTrial, color: "#facc15" },
    { id: "inad", label: "Inadimplentes", value: totalInad, color: "#fb7185" },
    { id: "cancel", label: "Canceladas", value: totalCancel, color: "#94a3b8" },
  ];
  const maxAssinaturaBar = Math.max(...assinaturaBars.map((item) => item.value), 1);

  return (
    <ScrollView>
      <AdminPage title="Assinaturas" subtitle="Gestão operacional da carteira de assinaturas, com plano, período de teste, status comercial e dados de cobrança.">
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Carteira de assinaturas</Text>
          <Text style={styles.heroTitle}>Gerencie o ciclo de vida das assinaturas com leitura operacional imediata.</Text>
          <Text style={styles.heroDescription}>
            Mude status, ajuste período de teste, revise identificadores do gateway e avance empresas pelo ciclo comercial sem sair do painel.
          </Text>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBand}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Ativas</Text>
              <Text style={styles.summaryValue}>{totalAtivas}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Em teste</Text>
              <Text style={styles.summaryValue}>{totalTrial}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Inadimplentes</Text>
              <Text style={styles.summaryValue}>{totalInad}</Text>
            </View>
            <View style={styles.summaryPanel}>
              <View style={styles.summaryPanelHeader}>
                <Text style={styles.summaryPanelTitle}>Radar de cobrança</Text>
                <Text style={styles.summaryPanelMeta}>{gatewayRate}% com gateway</Text>
              </View>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{totalCancel}</Text>
                  <Text style={styles.summaryMiniLabel}>Canceladas</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{trialRate}%</Text>
                  <Text style={styles.summaryMiniLabel}>Peso do trial</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{withGateway}</Text>
                  <Text style={styles.summaryMiniLabel}>Com gateway</Text>
                </View>
              </View>
              <View style={styles.roleBars}>
                {assinaturaBars.map((item) => (
                  <View key={item.id} style={styles.roleBarRow}>
                    <Text style={styles.roleBarLabel}>{item.label}</Text>
                    <View style={styles.roleBarTrack}>
                      <View
                        style={[
                          styles.roleBarFill,
                          {
                            width: `${Math.max((item.value / maxAssinaturaBar) * 100, item.value > 0 ? 8 : 0)}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.roleBarValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.summaryChart}>
            <AdminDonutChart
              eyebrow="Distribuição da carteira"
              title="Estado das assinaturas"
              totalLabel="Assinaturas"
              items={[
                { id: "ativas", label: "Ativas", value: rows.filter((row) => row.status === "ativa").length, color: "#4ade80" },
                { id: "teste", label: "Em teste", value: rows.filter((row) => row.status === "trial").length, color: "#facc15" },
                { id: "inad", label: "Inadimplentes", value: rows.filter((row) => row.status === "inadimplente").length, color: "#fb7185" },
                { id: "cancel", label: "Canceladas", value: rows.filter((row) => row.status === "cancelada").length, color: "#94a3b8" },
              ]}
            />
          </View>
        </View>

        <View style={styles.filters}>
          <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Buscar empresa ou plano" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, styles.statusInput]} value={status} onChangeText={setStatus} placeholder="Status" placeholderTextColor="#64748b" />
          <Pressable style={styles.primaryButton} onPress={() => void load()}>
            <Text style={styles.primaryButtonText}>Filtrar</Text>
          </Pressable>
        </View>

        {loading && !rows.length ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#facc15" />
          </View>
        ) : null}

        {rows.length ? (
          <AdminTable columns={["Empresa", "Plano", "Status", "Trial", "Gateway", "Ações"]}>
            {rows.map((row) => (
              <AdminTableRow key={row.assinatura_id}>
                <AdminTableCell flex={1.4}>
                  <Text style={styles.primaryText}>{row.empresa_nome}</Text>
                  <Text style={styles.secondaryText}>{row.empresa_slug}</Text>
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.primaryText}>{row.plano_nome ? normalizeAdminPlanoNome(row.plano_nome, row.plano_slug) : "Sem plano"}</Text>
                  <Text style={styles.secondaryText}>{row.plano_slug || "-"}</Text>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge label={row.status} tone={row.status === "ativa" ? "success" : row.status === "inadimplente" ? "warning" : row.status === "cancelada" ? "danger" : "info"} />
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.primaryText}>{row.trial_ativo ? "Ativo" : "Não"}</Text>
                  <Text style={styles.secondaryText}>{row.trial_fim ? new Date(row.trial_fim).toLocaleDateString("pt-BR") : "-"}</Text>
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.secondaryText}>{row.gateway_customer_id || "-"}</Text>
                  <Text style={styles.secondaryText}>{row.gateway_subscription_id || "-"}</Text>
                </AdminTableCell>
                <AdminTableCell flex={1.3}>
                  <View style={styles.actionGrid}>
                    <Pressable style={styles.secondaryButton} onPress={() => void setStatusQuick(row, "ativa")}>
                      <Text style={styles.secondaryButtonText}>Ativar</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void setStatusQuick(row, "inadimplente")}>
                      <Text style={styles.secondaryButtonText}>Inadimplente</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void setStatusQuick(row, "pausada")}>
                      <Text style={styles.secondaryButtonText}>Pausar</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void setStatusQuick(row, "cancelada")}>
                      <Text style={styles.secondaryButtonText}>Cancelar</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void extendTrial(row)}>
                      <Text style={styles.secondaryButtonText}>+7 dias</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void cyclePlan(row)}>
                      <Text style={styles.secondaryButtonText}>Trocar plano</Text>
                    </Pressable>
                  </View>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        ) : !loading ? (
          <AdminEmptyState title="Sem assinaturas" description="As assinaturas aparecerão aqui conforme novas empresas forem entrando no SaaS." />
        ) : null}
      </AdminPage>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(94, 234, 212, 0.16)",
    padding: 24,
    shadowColor: "#020617",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  summarySection: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  summaryBand: {
    flex: 1.1,
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    padding: 20,
    gap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryChip: {
    minWidth: 150,
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(10, 17, 31, 0.86)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryLabel: {
    color: "#8fb0d6",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 8,
  },
  summaryChart: {
    flex: 1,
  },
  summaryPanel: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    backgroundColor: "rgba(10, 17, 31, 0.82)",
    padding: 16,
    gap: 14,
    minHeight: 188,
  },
  summaryPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  summaryPanelTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  summaryPanelMeta: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryMetricsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  summaryMiniMetric: {
    minWidth: 120,
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(8, 14, 28, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryMiniValue: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  summaryMiniLabel: {
    color: "#8fa7c4",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  roleBars: {
    gap: 10,
  },
  roleBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleBarLabel: {
    width: 112,
    color: "#dbe6f3",
    fontSize: 12,
    fontWeight: "700",
  },
  roleBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(148, 163, 184, 0.10)",
  },
  roleBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  roleBarValue: {
    minWidth: 28,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  heroEyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 12,
  },
  heroDescription: {
    color: "#94a8c6",
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 780,
  },
  filters: { flexDirection: "row", gap: 12, alignItems: "center", flexWrap: "wrap" },
  input: {
    flex: 1,
    backgroundColor: "rgba(10, 17, 31, 0.88)",
    borderColor: "rgba(148, 163, 184, 0.14)",
    borderWidth: 1,
    borderRadius: 18,
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusInput: { maxWidth: 220 },
  primaryButton: {
    backgroundColor: "#facc15",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#facc15",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonText: { color: "#08101c", fontWeight: "900" },
  center: { paddingVertical: 40, alignItems: "center" },
  primaryText: { color: "#f8fafc", fontWeight: "800" },
  secondaryText: { color: "#94a3b8", marginTop: 4 },
  actionGrid: { gap: 8 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(10, 17, 31, 0.82)",
  },
  secondaryButtonText: { color: "#f8fafc", fontWeight: "800", fontSize: 12 },
});
