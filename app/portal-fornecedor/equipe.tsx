import PortalShell from "@/components/fornecedor-web/PortalShell";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type TeamRole = "owner" | "admin" | "manager" | "staff";

type TeamMember = {
  user_id: string;
  name: string | null;
  email: string | null;
  role: TeamRole;
  is_default: boolean;
  joined_at: string | null;
};

const ROLE_OPTIONS: TeamRole[] = ["admin", "manager", "staff"];

function roleLabel(role: TeamRole) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  return "Staff";
}

function nextRole(role: TeamRole): TeamRole {
  if (role === "admin") return "manager";
  if (role === "manager") return "staff";
  if (role === "staff") return "admin";
  return "owner";
}

export default function PortalFornecedorEquipe() {
  const [loading, setLoading] = useState(true);
  const [savingInvite, setSavingInvite] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [team, setTeam] = useState<TeamMember[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_tenant_team_members");
      if (error) throw error;
      setTeam(((data as TeamMember[]) || []).map((item) => ({ ...item, role: item.role || "staff" })));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao carregar equipe.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return team;
    return team.filter((m) => {
      const name = String(m.name || "").toLowerCase();
      const mail = String(m.email || "").toLowerCase();
      const roleTxt = String(m.role || "").toLowerCase();
      return name.includes(term) || mail.includes(term) || roleTxt.includes(term);
    });
  }, [team, q]);

  const stats = useMemo(() => {
    const total = team.length;
    const admins = team.filter((m) => m.role === "owner" || m.role === "admin").length;
    const managers = team.filter((m) => m.role === "manager").length;
    const staff = team.filter((m) => m.role === "staff").length;
    return { total, admins, managers, staff };
  }, [team]);

  async function convidar() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }

    try {
      setSavingInvite(true);
      const { error } = await supabase.rpc("tenant_team_add_member", {
        p_email: cleanEmail,
        p_role: role,
      });
      if (error) throw error;
      setEmail("");
      await carregar();
      Alert.alert("Sucesso", "Membro adicionado/atualizado na equipe.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível adicionar membro.");
    } finally {
      setSavingInvite(false);
    }
  }

  async function trocarRole(member: TeamMember) {
    if (member.role === "owner") {
      Alert.alert("Atenção", "O papel Owner não pode ser alterado.");
      return;
    }

    const newRole = nextRole(member.role);
    try {
      setBusyId(member.user_id);
      const { error } = await supabase.rpc("tenant_team_update_role", {
        p_user_id: member.user_id,
        p_role: newRole,
      });
      if (error) throw error;
      setTeam((prev) => prev.map((m) => (m.user_id === member.user_id ? { ...m, role: newRole } : m)));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar papel.");
    } finally {
      setBusyId(null);
    }
  }

  async function remover(member: TeamMember) {
    if (member.role === "owner") {
      Alert.alert("Atenção", "O Owner não pode ser removido.");
      return;
    }
    try {
      setBusyId(member.user_id);
      const { error } = await supabase.rpc("tenant_team_remove_member", { p_user_id: member.user_id });
      if (error) throw error;
      setTeam((prev) => prev.filter((m) => m.user_id !== member.user_id));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível remover membro.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PortalShell title="Equipe" subtitle="Controle de acessos e permissões do tenant">
      <View style={styles.kpiRow}>
        <Kpi label="Total de membros" value={String(stats.total)} color="#f8fafc" />
        <Kpi label="Admins" value={String(stats.admins)} color="#22c55e" />
        <Kpi label="Managers" value={String(stats.managers)} color="#38bdf8" />
        <Kpi label="Staff" value={String(stats.staff)} color="#facc15" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Adicionar membro por e-mail</Text>
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="email@usuario.com"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity
            style={styles.rolePicker}
            onPress={() => setRole((current) => ROLE_OPTIONS[(ROLE_OPTIONS.indexOf(current) + 1) % ROLE_OPTIONS.length])}
          >
            <Text style={styles.rolePickerText}>{roleLabel(role)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inviteBtn} onPress={() => void convidar()} disabled={savingInvite}>
            {savingInvite ? <ActivityIndicator color="#022c22" /> : <Text style={styles.inviteText}>Adicionar</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Membros da equipe</Text>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Buscar por nome, e-mail ou papel"
            placeholderTextColor="#64748b"
            value={q}
            onChangeText={setQ}
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Nenhum membro encontrado.</Text>
        ) : (
          filtered.map((member) => {
            const isBusy = busyId === member.user_id;
            return (
              <View key={member.user_id} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name || "Usuário"}</Text>
                  <Text style={styles.memberMeta}>{member.email || "Sem e-mail"} • Entrou em {new Date(member.joined_at || Date.now()).toLocaleDateString("pt-BR")}</Text>
                </View>

                <View style={styles.memberActions}>
                  <View
                    style={[
                      styles.roleBadge,
                      member.role === "owner"
                        ? styles.ownerBadge
                        : member.role === "admin"
                          ? styles.adminBadge
                          : member.role === "manager"
                            ? styles.managerBadge
                            : styles.staffBadge,
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>{roleLabel(member.role)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, member.role === "owner" ? styles.actionBtnDisabled : null]}
                    onPress={() => void trocarRole(member)}
                    disabled={isBusy || member.role === "owner"}
                  >
                    {isBusy ? <ActivityIndicator size="small" color="#cbd5e1" /> : <Ionicons name="swap-horizontal-outline" size={14} color="#cbd5e1" />}
                    <Text style={styles.actionText}>Alterar papel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnDanger, member.role === "owner" ? styles.actionBtnDisabled : null]}
                    onPress={() => void remover(member)}
                    disabled={isBusy || member.role === "owner"}
                  >
                    <Ionicons name="trash-outline" size={14} color="#fecaca" />
                    <Text style={styles.actionDangerText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </PortalShell>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: {
    minWidth: 180,
    flex: 1,
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { fontWeight: "900", fontSize: 18, marginTop: 6 },
  card: {
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  sectionTitle: { color: "#e2e8f0", fontSize: 15, fontWeight: "900", marginBottom: 10 },
  formRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    color: "#f8fafc",
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  rolePicker: {
    minWidth: 110,
    backgroundColor: "#172036",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  rolePickerText: { color: "#e2e8f0", fontWeight: "800", fontSize: 12 },
  inviteBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  searchInput: { minWidth: 280, flex: 1 },
  loading: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: "#94a3b8", fontWeight: "700", paddingVertical: 18 },
  memberRow: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  memberInfo: { flex: 1, minWidth: 240 },
  memberName: { color: "#f8fafc", fontWeight: "900", fontSize: 14 },
  memberMeta: { color: "#94a3b8", fontWeight: "700", fontSize: 11, marginTop: 3 },
  memberActions: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  roleBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  ownerBadge: { backgroundColor: "rgba(245,158,11,0.16)", borderColor: "rgba(245,158,11,0.34)" },
  adminBadge: { backgroundColor: "rgba(34,197,94,0.16)", borderColor: "rgba(34,197,94,0.34)" },
  managerBadge: { backgroundColor: "rgba(56,189,248,0.16)", borderColor: "rgba(56,189,248,0.34)" },
  staffBadge: { backgroundColor: "rgba(148,163,184,0.16)", borderColor: "rgba(148,163,184,0.34)" },
  roleBadgeText: { color: "#e2e8f0", fontWeight: "800", fontSize: 11 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: "#172036",
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: "#3f1d1d",
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  actionDangerText: { color: "#fecaca", fontWeight: "800", fontSize: 11 },
});
