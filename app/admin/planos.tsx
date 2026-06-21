import { AdminBadge } from "@/components/admin-web/AdminBadge";
import { AdminDonutChart } from "@/components/admin-web/AdminChartsLazy";
import { AdminEmptyState } from "@/components/admin-web/AdminEmptyState";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin-web/AdminTable";
import { normalizeAdminPlanoNome } from "@/lib/admin-display";
import { adminWebListPlanos, adminWebSetPlanoActive, adminWebUpsertPlano, type AdminWebPlanoRow } from "@/lib/admin-web";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

function slugify(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPlanosScreen() {
  const [rows, setRows] = useState<AdminWebPlanoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [limiteUsuarios, setLimiteUsuarios] = useState("");
  const [limiteProfissionais, setLimiteProfissionais] = useState("");
  const [limitePedidosMes, setLimitePedidosMes] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [suportePrioritario, setSuportePrioritario] = useState(false);
  const [financeiroAvancado, setFinanceiroAvancado] = useState(false);
  const [relatorios, setRelatorios] = useState(false);
  const [ativo, setAtivo] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await adminWebListPlanos());
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function resetForm() {
    setEditingId(null);
    setNome("");
    setSlug("");
    setValor("");
    setDescricao("");
    setLimiteUsuarios("");
    setLimiteProfissionais("");
    setLimitePedidosMes("");
    setWhiteLabel(false);
    setSuportePrioritario(false);
    setFinanceiroAvancado(false);
    setRelatorios(false);
    setAtivo(true);
  }

  function fillForm(row: AdminWebPlanoRow) {
    setEditingId(row.id);
    setNome(normalizeAdminPlanoNome(row.nome, row.slug));
    setSlug(row.slug);
    setValor(String(row.valor ?? ""));
    setDescricao(row.descricao || "");
    setLimiteUsuarios(row.limite_usuarios == null ? "" : String(row.limite_usuarios));
    setLimiteProfissionais(row.limite_profissionais == null ? "" : String(row.limite_profissionais));
    setLimitePedidosMes(row.limite_pedidos_mes == null ? "" : String(row.limite_pedidos_mes));
    setWhiteLabel(Boolean(row.white_label));
    setSuportePrioritario(Boolean(row.suporte_prioritario));
    setFinanceiroAvancado(Boolean(row.acesso_financeiro_avancado));
    setRelatorios(Boolean(row.acesso_relatorios));
    setAtivo(Boolean(row.ativo));
  }

  async function handleSave() {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome do plano.");
      return;
    }

    const finalSlug = slugify(slug || nome);
    if (!finalSlug) {
      Alert.alert("Atenção", "Informe um slug válido.");
      return;
    }

    try {
      setSaving(true);
      await adminWebUpsertPlano({
        planoId: editingId,
        nome: nome.trim(),
        slug: finalSlug,
        valor: Number(valor || 0),
        descricao: descricao.trim() || null,
        limite_usuarios: limiteUsuarios.trim() ? Number(limiteUsuarios) : null,
        limite_profissionais: limiteProfissionais.trim() ? Number(limiteProfissionais) : null,
        limite_pedidos_mes: limitePedidosMes.trim() ? Number(limitePedidosMes) : null,
        white_label: whiteLabel,
        suporte_prioritario: suportePrioritario,
        acesso_financeiro_avancado: financeiroAvancado,
        acesso_relatorios: relatorios,
        ativo,
      });
      resetForm();
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível salvar o plano.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePlano(row: AdminWebPlanoRow) {
    try {
      await adminWebSetPlanoActive(row.id, !row.ativo);
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar o plano.");
    }
  }

  const totalAtivos = rows.filter((row) => row.ativo).length;
  const totalWhiteLabel = rows.filter((row) => row.white_label).length;
  const totalRelatorios = rows.filter((row) => row.acesso_relatorios).length;
  const totalEmpresas = rows.reduce((acc, row) => acc + Number(row.empresas_qtd || 0), 0);
  const avgEmpresasPorPlano = rows.length ? Math.round(totalEmpresas / rows.length) : 0;
  const planosBars = [
    { id: "ativos", label: "Planos ativos", value: totalAtivos, color: "#4ade80" },
    { id: "white", label: "Marca própria", value: totalWhiteLabel, color: "#38bdf8" },
    { id: "relatorios", label: "Relatórios", value: totalRelatorios, color: "#facc15" },
    { id: "empresas", label: "Empresas na carteira", value: totalEmpresas, color: "#fb7185" },
  ];
  const maxPlanoBar = Math.max(...planosBars.map((item) => item.value), 1);

  return (
    <ScrollView>
      <AdminPage title="Planos comerciais" subtitle="Criação, edição e ativação dos planos comerciais da plataforma.">
        <View style={styles.heroRow}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Planos comerciais</Text>
            <Text style={styles.heroTitle}>Estruture a oferta comercial da plataforma com clareza executiva.</Text>
            <Text style={styles.heroDescription}>Controle limites, preço, diferenciação de produto e recursos premium a partir de um único painel.</Text>
          </View>
          <View style={styles.heroAside}>
            <Text style={styles.heroAsideLabel}>PLANOS</Text>
            <Text style={styles.heroAsideValue}>{rows.filter((row) => row.ativo).length}</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBand}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Ativos</Text>
              <Text style={styles.summaryValue}>{totalAtivos}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Marca própria</Text>
              <Text style={styles.summaryValue}>{totalWhiteLabel}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Empresas</Text>
              <Text style={styles.summaryValue}>{totalEmpresas}</Text>
            </View>
            <View style={styles.summaryPanel}>
              <View style={styles.summaryPanelHeader}>
                <Text style={styles.summaryPanelTitle}>Radar da oferta</Text>
                <Text style={styles.summaryPanelMeta}>{avgEmpresasPorPlano} por plano</Text>
              </View>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{rows.length}</Text>
                  <Text style={styles.summaryMiniLabel}>Total de planos</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{totalRelatorios}</Text>
                  <Text style={styles.summaryMiniLabel}>Com relatórios</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{rows.filter((row) => row.suporte_prioritario).length}</Text>
                  <Text style={styles.summaryMiniLabel}>Com atendimento premium</Text>
                </View>
              </View>
              <View style={styles.roleBars}>
                {planosBars.map((item) => (
                  <View key={item.id} style={styles.roleBarRow}>
                    <Text style={styles.roleBarLabel}>{item.label}</Text>
                    <View style={styles.roleBarTrack}>
                      <View
                        style={[
                          styles.roleBarFill,
                          {
                            width: `${Math.max((item.value / maxPlanoBar) * 100, item.value > 0 ? 8 : 0)}%`,
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
              eyebrow="Arquitetura comercial"
              title="Composição dos planos"
              totalLabel="Planos"
              items={[
                { id: "ativos", label: "Ativos", value: totalAtivos, color: "#4ade80" },
                { id: "white", label: "Marca própria", value: totalWhiteLabel, color: "#38bdf8" },
                { id: "relatorios", label: "Relatórios", value: totalRelatorios, color: "#facc15" },
              ]}
            />
          </View>
        </View>

        <View style={styles.layout}>
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>{editingId ? "Editar plano" : "Novo plano"}</Text>
            <TextInput style={styles.input} value={nome} onChangeText={(value) => {
              setNome(value);
              if (!slug.trim()) setSlug(slugify(value));
            }} placeholder="Nome do plano" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={slug} onChangeText={(value) => setSlug(slugify(value))} placeholder="Identificador do plano" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={valor} onChangeText={setValor} placeholder="Valor mensal" placeholderTextColor="#64748b" keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Descrição comercial" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={limiteUsuarios} onChangeText={setLimiteUsuarios} placeholder="Limite de usuários" placeholderTextColor="#64748b" keyboardType="number-pad" />
            <TextInput style={styles.input} value={limiteProfissionais} onChangeText={setLimiteProfissionais} placeholder="Limite de profissionais" placeholderTextColor="#64748b" keyboardType="number-pad" />
            <TextInput style={styles.input} value={limitePedidosMes} onChangeText={setLimitePedidosMes} placeholder="Limite de pedidos/mês" placeholderTextColor="#64748b" keyboardType="number-pad" />
            <SwitchRow label="Marca própria" value={whiteLabel} onValueChange={setWhiteLabel} />
            <SwitchRow label="Atendimento premium" value={suportePrioritario} onValueChange={setSuportePrioritario} />
            <SwitchRow label="Financeiro avançado" value={financeiroAvancado} onValueChange={setFinanceiroAvancado} />
            <SwitchRow label="Relatórios" value={relatorios} onValueChange={setRelatorios} />
            <SwitchRow label="Plano ativo" value={ativo} onValueChange={setAtivo} />

            <View style={styles.actions}>
              <Pressable style={[styles.primaryButton, saving ? styles.disabled : null]} onPress={() => void handleSave()} disabled={saving}>
                {saving ? <ActivityIndicator color="#08101c" /> : <Text style={styles.primaryButtonText}>{editingId ? "Atualizar plano" : "Criar plano"}</Text>}
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Limpar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.tableWrap}>
            {loading && !rows.length ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#facc15" />
              </View>
            ) : rows.length ? (
              <AdminTable columns={["Plano", "Recursos", "Uso", "Status", "Ações"]}>
                {rows.map((row) => (
                  <AdminTableRow key={row.id}>
                    <AdminTableCell flex={1.4}>
                      <Text style={styles.primaryText}>{normalizeAdminPlanoNome(row.nome, row.slug)}</Text>
                      <Text style={styles.secondaryText}>{row.slug}</Text>
                      <Text style={styles.secondaryText}>R$ {Number(row.valor || 0).toFixed(2)}</Text>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Text style={styles.secondaryText}>Usuários {row.limite_usuarios ?? "∞"}</Text>
                      <Text style={styles.secondaryText}>Profissionais {row.limite_profissionais ?? "∞"}</Text>
                      <Text style={styles.secondaryText}>Pedidos/mês {row.limite_pedidos_mes ?? "∞"}</Text>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Text style={styles.secondaryText}>Empresas {row.empresas_qtd}</Text>
                      <Text style={styles.secondaryText}>Marca própria {row.white_label ? "sim" : "não"}</Text>
                      <Text style={styles.secondaryText}>Relatórios {row.acesso_relatorios ? "sim" : "não"}</Text>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge label={row.ativo ? "ativo" : "inativo"} tone={row.ativo ? "success" : "danger"} />
                    </AdminTableCell>
                    <AdminTableCell flex={1.1}>
                      <View style={styles.rowButtons}>
                        <Pressable style={styles.secondaryButton} onPress={() => fillForm(row)}>
                          <Text style={styles.secondaryButtonText}>Editar</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={() => void togglePlano(row)}>
                          <Text style={styles.secondaryButtonText}>{row.ativo ? "Desativar" : "Ativar"}</Text>
                        </Pressable>
                      </View>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            ) : (
              <AdminEmptyState title="Sem planos" description="Crie o primeiro plano comercial do console." />
            )}
          </View>
        </View>
      </AdminPage>
    </ScrollView>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#facc15", false: "#334155" }} thumbColor={value ? "#08101c" : "#cbd5e1"} />
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "stretch",
  },
  heroCard: {
    flex: 1,
    backgroundColor: "rgba(9, 15, 31, 0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    padding: 22,
  },
  heroEyebrow: {
    color: "#67e8f9",
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
    color: "#8fa8c6",
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 760,
  },
  heroAside: {
    width: 220,
    backgroundColor: "rgba(9, 15, 31, 0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    padding: 22,
    justifyContent: "space-between",
  },
  heroAsideLabel: {
    color: "#8fb0d6",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroAsideValue: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
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
    width: 128,
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
  summaryChart: {
    flex: 1,
  },
  formCard: {
    width: 360,
    backgroundColor: "rgba(9, 15, 31, 0.88)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    padding: 20,
  },
  tableWrap: { flex: 1 },
  cardTitle: { color: "#f8fafc", fontWeight: "800", fontSize: 20, marginBottom: 14 },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderWidth: 1,
    borderRadius: 14,
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: { color: "#f8fafc", fontWeight: "700" },
  actions: { marginTop: 12, gap: 10 },
  primaryButton: {
    backgroundColor: "#facc15",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#08101c", fontWeight: "900" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  secondaryButtonText: { color: "#f8fafc", fontWeight: "800", fontSize: 12 },
  disabled: { opacity: 0.7 },
  center: { paddingVertical: 40, alignItems: "center" },
  primaryText: { color: "#f8fafc", fontWeight: "800" },
  secondaryText: { color: "#94a3b8", marginTop: 4 },
  rowButtons: { gap: 8 },
});
