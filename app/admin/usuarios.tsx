import { AdminBadge } from "@/components/admin-web/AdminBadge";
import { AdminDonutChart } from "@/components/admin-web/AdminChartsLazy";
import { AdminEmptyState } from "@/components/admin-web/AdminEmptyState";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin-web/AdminTable";
import { adminWebListEmpresas, adminWebListUsuarios, adminWebSetTenantUserActive, type AdminWebEmpresaRow, type AdminWebUsuarioRow } from "@/lib/admin-web";
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

export default function AdminUsuariosScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminWebUsuarioRow[]>([]);
  const [empresas, setEmpresas] = useState<AdminWebEmpresaRow[]>([]);
  const [search, setSearch] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [role, setRole] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [users, empresasData] = await Promise.all([
        adminWebListUsuarios(search, empresaId || undefined, role || undefined),
        adminWebListEmpresas(),
      ]);
      setRows(users);
      setEmpresas(empresasData);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, [search, empresaId, role]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function toggleUser(row: AdminWebUsuarioRow) {
    try {
      await adminWebSetTenantUserActive(row.tenant_user_id, !row.ativo);
      await load();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar o usuário.");
    }
  }

  const totalAtivos = rows.filter((row) => row.ativo).length;
  const totalAdmins = rows.filter((row) => ["super_admin", "admin_empresa", "admin", "owner"].includes(row.role)).length;
  const totalProfissionais = rows.filter((row) => row.role === "profissional").length;
  const totalClientes = rows.filter((row) => row.role === "cliente").length;
  const totalInativos = rows.filter((row) => !row.ativo).length;
  const activationRate = rows.length ? Math.round((totalAtivos / rows.length) * 100) : 0;
  const avgUsersPerCompany = empresas.length ? Math.round(rows.length / empresas.length) : 0;
  const roleBars = [
    { id: "admins", label: "Administradores", value: totalAdmins, color: "#facc15" },
    { id: "profissionais", label: "Profissionais", value: totalProfissionais, color: "#38bdf8" },
    { id: "clientes", label: "Clientes", value: totalClientes, color: "#4ade80" },
    { id: "inativos", label: "Inativos", value: totalInativos, color: "#fb7185" },
  ];
  const maxRoleBar = Math.max(...roleBars.map((item) => item.value), 1);

  return (
    <ScrollView>
      <AdminPage title="Usuários" subtitle="Gestão da base de usuários por empresa, com perfil, última atividade e controle básico de ativação.">
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Base de usuários</Text>
            <Text style={styles.heroTitle}>Governança de acessos com leitura executiva.</Text>
            <Text style={styles.heroDescription}>
              Filtre a base por empresa e perfil, acompanhe a atividade recente e ative ou desative vínculos sem sair do painel.
            </Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Registros</Text>
              <Text style={styles.heroStatValue}>{rows.length}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Empresas</Text>
              <Text style={styles.heroStatValue}>{empresas.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBand}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Ativos</Text>
              <Text style={styles.summaryValue}>{totalAtivos}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Admins</Text>
              <Text style={styles.summaryValue}>{totalAdmins}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryLabel}>Profissionais</Text>
              <Text style={styles.summaryValue}>{totalProfissionais}</Text>
            </View>
            <View style={styles.summaryPanel}>
              <View style={styles.summaryPanelHeader}>
                <Text style={styles.summaryPanelTitle}>Leitura rápida da base</Text>
                <Text style={styles.summaryPanelMeta}>{activationRate}% ativos</Text>
              </View>
              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{totalClientes}</Text>
                  <Text style={styles.summaryMiniLabel}>Clientes</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{totalInativos}</Text>
                  <Text style={styles.summaryMiniLabel}>Inativos</Text>
                </View>
                <View style={styles.summaryMiniMetric}>
                  <Text style={styles.summaryMiniValue}>{avgUsersPerCompany}</Text>
                  <Text style={styles.summaryMiniLabel}>Média por empresa</Text>
                </View>
              </View>
              <View style={styles.roleBars}>
                {roleBars.map((item) => (
                  <View key={item.id} style={styles.roleBarRow}>
                    <Text style={styles.roleBarLabel}>{item.label}</Text>
                    <View style={styles.roleBarTrack}>
                      <View
                        style={[
                          styles.roleBarFill,
                          {
                            width: `${Math.max((item.value / maxRoleBar) * 100, item.value > 0 ? 8 : 0)}%`,
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
              eyebrow="Distribuição de perfis"
              title="Composição dos acessos"
              totalLabel="Usuários"
              items={[
                { id: "admins", label: "Admins", value: rows.filter((row) => ["super_admin", "admin_empresa", "admin", "owner"].includes(row.role)).length, color: "#facc15" },
                { id: "profissionais", label: "Profissionais", value: rows.filter((row) => row.role === "profissional").length, color: "#38bdf8" },
                { id: "clientes", label: "Clientes", value: rows.filter((row) => row.role === "cliente").length, color: "#4ade80" },
              ]}
            />
          </View>
        </View>

        <View style={styles.filters}>
          <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Buscar nome ou email" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, styles.shortInput]} value={role} onChangeText={setRole} placeholder="Role" placeholderTextColor="#64748b" />
          <Pressable style={styles.primaryButton} onPress={() => void load()}>
            <Text style={styles.primaryButtonText}>Filtrar</Text>
          </Pressable>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Empresa</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Pressable style={[styles.chip, !empresaId && styles.chipActive]} onPress={() => setEmpresaId("")}>
              <Text style={[styles.chipText, !empresaId && styles.chipTextActive]}>Todas</Text>
            </Pressable>
            {empresas.map((empresa) => {
              const active = empresaId === empresa.empresa_id;
              return (
                <Pressable key={empresa.empresa_id} style={[styles.chip, active && styles.chipActive]} onPress={() => setEmpresaId(empresa.empresa_id)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{empresa.nome}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Papel</Text>
          <View style={styles.chipsWrap}>
            {["", "super_admin", "admin_empresa", "admin", "owner", "profissional", "cliente"].map((item) => {
              const active = role === item;
              return (
                <Pressable key={item || "all-roles"} style={[styles.chip, active && styles.chipActive]} onPress={() => setRole(item)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item || "Todos"}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {loading && !rows.length ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#facc15" />
          </View>
        ) : null}

        {rows.length ? (
          <AdminTable columns={["Usuário", "Empresa", "Role", "Status", "Último login", "Ações"]}>
            {rows.map((row) => (
              <AdminTableRow key={row.tenant_user_id}>
                <AdminTableCell flex={1.4}>
                  <Text style={styles.primaryText}>{row.nome}</Text>
                  <Text style={styles.secondaryText}>{row.email || row.user_id}</Text>
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.primaryText}>{row.empresa_nome}</Text>
                  <Text style={styles.secondaryText}>{row.empresa_id}</Text>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge label={row.role} tone={row.role === "super_admin" ? "warning" : "info"} />
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge label={row.ativo ? "ativo" : "inativo"} tone={row.ativo ? "success" : "danger"} />
                </AdminTableCell>
                <AdminTableCell>
                  <Text style={styles.secondaryText}>
                    {row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString("pt-BR") : "Sem login"}
                  </Text>
                </AdminTableCell>
                <AdminTableCell flex={1.1}>
                  <Pressable style={styles.secondaryButton} onPress={() => void toggleUser(row)}>
                    <Text style={styles.secondaryButtonText}>{row.ativo ? "Desativar" : "Ativar"}</Text>
                  </Pressable>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        ) : !loading ? (
          <AdminEmptyState title="Sem usuários" description="Nenhum usuário corresponde aos filtros aplicados." />
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
  shortInput: { maxWidth: 240 },
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
  filterGroup: {
    gap: 10,
    backgroundColor: "rgba(8, 14, 28, 0.95)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 18,
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
    alignItems: "center",
    justifyContent: "space-between",
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
    width: 24,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  filterLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chipsRow: {
    gap: 10,
    paddingRight: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(10, 17, 31, 0.82)",
  },
  chipActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  chipText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#08101c",
  },
  center: { paddingVertical: 40, alignItems: "center" },
  primaryText: { color: "#f8fafc", fontWeight: "800" },
  secondaryText: { color: "#94a3b8", marginTop: 4 },
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
