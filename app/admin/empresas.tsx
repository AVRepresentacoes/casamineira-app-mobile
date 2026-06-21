import { AdminBadge } from "@/components/admin-web/AdminBadge";
import { AdminDonutChart } from "@/components/admin-web/AdminChartsLazy";
import { AdminEmptyState } from "@/components/admin-web/AdminEmptyState";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin-web/AdminTable";
import { normalizeAdminPlanoNome } from "@/lib/admin-display";
import { adminWebListEmpresas, type AdminWebEmpresaRow } from "@/lib/admin-web";
import { createSaasEmpresa, setSaasEmpresaStatus } from "@/lib/saas-admin";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function statusTone(status?: string | null) {
  if (status === "ativa") return "success";
  if (status === "trial") return "info";
  if (status === "inadimplente") return "warning";
  if (status === "cancelada" || status === "expirada") return "danger";
  return "default";
}

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminEmpresasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<AdminWebEmpresaRow[]>([]);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await adminWebListEmpresas(search, status));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar as empresas.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function toggleEmpresa(row: AdminWebEmpresaRow) {
    try {
      await setSaasEmpresaStatus(row.empresa_id, !row.ativa);
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar a empresa.");
    }
  }

  async function handleCreateEmpresa() {
    const finalNome = nome.trim();
    const finalSlug = slugify(slug || nome);

    if (!finalNome || !finalSlug) {
      Alert.alert("Dados incompletos", "Preencha o nome da empresa e um slug válido.");
      return;
    }

    try {
      setCreating(true);
      const empresaId = await createSaasEmpresa(finalNome, finalSlug);
      setNome("");
      setSlug("");
      await load();
      router.push(`/admin/empresa/${empresaId}` as never);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível criar a empresa.");
    } finally {
      setCreating(false);
    }
  }

  const totalAtivas = rows.filter((row) => row.ativa).length;
  const totalTrial = rows.filter((row) => row.assinatura_status === "trial").length;
  const totalInad = rows.filter((row) => row.assinatura_status === "inadimplente").length;
  const totalPedidos = rows.reduce((acc, row) => acc + Number(row.pedidos_qtd || 0), 0);
  const totalUsuarios = rows.reduce((acc, row) => acc + Number(row.usuarios_qtd || 0), 0);
  const totalProfissionais = rows.reduce((acc, row) => acc + Number(row.profissionais_qtd || 0), 0);
  const totalClientes = rows.reduce((acc, row) => acc + Number(row.clientes_qtd || 0), 0);
  const avgPedidos = rows.length ? Math.round(totalPedidos / rows.length) : 0;
  const activationRate = rows.length ? Math.round((totalAtivas / rows.length) * 100) : 0;
  const trialRate = rows.length ? Math.round((totalTrial / rows.length) * 100) : 0;
  const inadRate = rows.length ? Math.round((totalInad / rows.length) * 100) : 0;
  const companyBars = [
    { id: "usuarios", label: "Usuários", value: totalUsuarios, color: "#38bdf8" },
    { id: "profissionais", label: "Profissionais", value: totalProfissionais, color: "#4ade80" },
    { id: "clientes", label: "Clientes", value: totalClientes, color: "#facc15" },
    { id: "pedidos", label: "Pedidos", value: totalPedidos, color: "#fb7185" },
  ];
  const maxCompanyBar = Math.max(...companyBars.map((item) => item.value), 1);

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#facc15" />}>
      <AdminPage title="Empresas" subtitle="Gestão operacional da carteira de empresas, com status, planos, uso e acesso ao detalhe de cada conta.">
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Carteira de empresas</Text>
            <Text style={styles.heroTitle}>Gestão central da base de empresas.</Text>
            <Text style={styles.heroDescription}>
              Crie tenants, acompanhe uso, revise status operacional e entre no detalhe de cada conta sem sair do painel executivo.
            </Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Empresas</Text>
              <Text style={styles.heroStatValue}>{rows.length}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Ativas</Text>
              <Text style={styles.heroStatValue}>{rows.filter((row) => row.ativa).length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBand}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Em teste</Text>
              <Text style={styles.summaryValue}>{totalTrial}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Inadimplentes</Text>
              <Text style={styles.summaryValue}>{totalInad}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Pedidos</Text>
              <Text style={styles.summaryValue}>{totalPedidos}</Text>
            </View>
            <View style={styles.summaryPanel}>
              <View style={styles.summaryPanelHeader}>
                <Text style={styles.summaryPanelTitle}>Radar da carteira</Text>
                <Text style={styles.summaryPanelMeta}>{activationRate}% ativas</Text>
              </View>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{totalAtivas}</Text>
                  <Text style={styles.summaryMiniLabel}>Ativas</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{avgPedidos}</Text>
                  <Text style={styles.summaryMiniLabel}>Pedidos / empresa</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{rows.length ? Math.round(totalUsuarios / rows.length) : 0}</Text>
                  <Text style={styles.summaryMiniLabel}>Usuários / empresa</Text>
                </View>
              </View>
              <View style={styles.roleBars}>
                {companyBars.map((item) => (
                  <View key={item.id} style={styles.roleBarRow}>
                    <Text style={styles.roleBarLabel}>{item.label}</Text>
                    <View style={styles.roleBarTrack}>
                      <View
                        style={[
                          styles.roleBarFill,
                          {
                            width: `${Math.max((item.value / maxCompanyBar) * 100, item.value > 0 ? 8 : 0)}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.roleBarValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.bottomMetricsGrid}>
                <View style={styles.bottomMetricCard}>
                  <Text style={styles.bottomMetricValue}>{trialRate}%</Text>
                  <Text style={styles.bottomMetricLabel}>Peso do teste</Text>
                </View>
                <View style={styles.bottomMetricCard}>
                  <Text style={styles.bottomMetricValue}>{inadRate}%</Text>
                  <Text style={styles.bottomMetricLabel}>Risco financeiro</Text>
                </View>
                <View style={styles.bottomMetricCard}>
                  <Text style={styles.bottomMetricValue}>{rows.length ? Math.round(totalProfissionais / rows.length) : 0}</Text>
                  <Text style={styles.bottomMetricLabel}>Profissionais / empresa</Text>
                </View>
                <View style={styles.bottomMetricCard}>
                  <Text style={styles.bottomMetricValue}>{rows.length ? Math.round(totalClientes / rows.length) : 0}</Text>
                  <Text style={styles.bottomMetricLabel}>Clientes / empresa</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.summaryChart}>
            <AdminDonutChart
              eyebrow="Situação da carteira"
              title="Distribuição das empresas"
              totalLabel="Empresas"
              items={[
                { id: "ativas", label: "Ativas", value: rows.filter((row) => row.ativa).length, color: "#4ade80" },
                { id: "teste", label: "Em teste", value: rows.filter((row) => row.assinatura_status === "trial").length, color: "#facc15" },
                { id: "inad", label: "Inadimplentes", value: rows.filter((row) => row.assinatura_status === "inadimplente").length, color: "#fb7185" },
              ]}
            />
          </View>
        </View>

        <View style={styles.createCard}>
          <View style={styles.createHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Nova empresa</Text>
              <Text style={styles.cardDescription}>Crie uma empresa direto do console e siga para o detalhe operacional.</Text>
            </View>
          </View>
          <View style={styles.filters}>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={(value) => {
                setNome(value);
                if (!slug.trim()) {
                  setSlug(slugify(value));
                }
              }}
              placeholder="Nome da empresa"
              placeholderTextColor="#64748b"
            />
            <TextInput
              style={[styles.input, styles.statusInput]}
              value={slug}
              onChangeText={(value) => setSlug(slugify(value))}
              autoCapitalize="none"
              placeholder="slug-da-empresa"
              placeholderTextColor="#64748b"
            />
            <Pressable style={[styles.primaryButton, creating && styles.buttonDisabled]} onPress={() => void handleCreateEmpresa()} disabled={creating}>
              <Text style={styles.primaryButtonText}>{creating ? "Criando..." : "Criar empresa"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.filters}>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome, slug ou plano"
            placeholderTextColor="#64748b"
          />
          <TextInput
            style={[styles.input, styles.statusInput]}
            value={status}
            onChangeText={setStatus}
            placeholder="Status: teste, ativa..."
            placeholderTextColor="#64748b"
          />
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
          <AdminTable
            columns={["Empresa", "Status", "Plano", "Trial", "Uso", "Ações"]}
          >
            {rows.map((row) => (
              <AdminTableRow key={row.empresa_id}>
                <AdminTableCell flex={1.6}>
                  <View>
                    <Text style={styles.primaryText}>{row.nome}</Text>
                    <Text style={styles.secondaryText}>{row.slug}</Text>
                  </View>
                </AdminTableCell>
                <AdminTableCell>
                  <View style={{ gap: 8 }}>
                    <AdminBadge label={row.ativa ? "empresa ativa" : "suspensa"} tone={row.ativa ? "success" : "danger"} />
                    <AdminBadge label={row.assinatura_status || "sem assinatura"} tone={statusTone(row.assinatura_status)} />
                  </View>
                </AdminTableCell>
                <AdminTableCell>
                  <View>
                    <Text style={styles.primaryText}>{row.plano_nome ? normalizeAdminPlanoNome(row.plano_nome, row.plano_slug) : "Sem plano"}</Text>
                    <Text style={styles.secondaryText}>{row.plano_slug || "-"}</Text>
                  </View>
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.primaryText}>{row.trial_ativo ? "Ativo" : "Não"}</Text>
                  <Text style={styles.secondaryText}>{row.trial_fim ? new Date(row.trial_fim).toLocaleDateString("pt-BR") : "-"}</Text>
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.secondaryText}>Usuários {row.usuarios_qtd}</Text>
                  <Text style={styles.secondaryText}>Profissionais {row.profissionais_qtd}</Text>
                  <Text style={styles.secondaryText}>Pedidos {row.pedidos_qtd}</Text>
                </AdminTableCell>
                <AdminTableCell flex={1.2}>
                  <View style={styles.actions}>
                    <Pressable style={styles.secondaryButton} onPress={() => router.push(`/admin/empresa/${row.empresa_id}` as never)}>
                      <Text style={styles.secondaryButtonText}>Detalhes</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void toggleEmpresa(row)}>
                      <Text style={styles.secondaryButtonText}>{row.ativa ? "Suspender" : "Reativar"}</Text>
                    </Pressable>
                  </View>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        ) : !loading ? (
          <AdminEmptyState title="Nenhuma empresa encontrada" description="Ajuste os filtros ou aguarde novas empresas entrarem no funil." />
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
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    shadowColor: "#020617",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  heroCopy: {
    flex: 1,
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
    maxWidth: 760,
  },
  heroStats: {
    flexDirection: "row",
    gap: 12,
  },
  heroStat: {
    minWidth: 120,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(10, 17, 31, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  heroStatLabel: {
    color: "#8fb0d6",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  heroStatValue: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  createCard: {
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    padding: 20,
    gap: 14,
  },
  summarySection: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
  },
  summaryBand: {
    flex: 1.15,
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
    minWidth: 160,
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
  bottomMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 2,
  },
  bottomMetricCard: {
    minWidth: 120,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    backgroundColor: "rgba(8, 14, 28, 0.88)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bottomMetricValue: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  bottomMetricLabel: {
    color: "#8fa7c4",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  cardDescription: {
    color: "#94a3b8",
    marginTop: 6,
  },
  filters: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(10, 17, 31, 0.88)",
    borderColor: "rgba(148, 163, 184, 0.12)",
    borderWidth: 1,
    borderRadius: 18,
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusInput: {
    maxWidth: 220,
  },
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
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
  },
  primaryText: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  secondaryText: {
    color: "#94a3b8",
    marginTop: 4,
  },
  actions: {
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(10, 17, 31, 0.82)",
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 12,
  },
});
