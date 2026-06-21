import { AdminBadge } from "@/components/admin-web/AdminBadge";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { normalizeAdminPlanoNome } from "@/lib/admin-display";
import { assignSaasEmpresaAdmin, extendSaasEmpresaTrial, getSaasEmpresaDetail, getSaasPlanos, updateSaasEmpresa, type SaasEmpresaDetail, type SaasPlano } from "@/lib/saas-admin";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

export default function AdminEmpresaDetailScreen() {
  const params = useLocalSearchParams<{ empresaId?: string }>();
  const empresaId = String(params.empresaId || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [binding, setBinding] = useState(false);
  const [planos, setPlanos] = useState<SaasPlano[]>([]);
  const [detail, setDetail] = useState<SaasEmpresaDetail | null>(null);
  const [adminUserId, setAdminUserId] = useState("");

  const [nomeExibicao, setNomeExibicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("");
  const [corSecundaria, setCorSecundaria] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [status, setStatus] = useState("trial");
  const [ativo, setAtivo] = useState(true);

  const load = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const [empresa, planosData] = await Promise.all([getSaasEmpresaDetail(empresaId), getSaasPlanos()]);
      setDetail(empresa);
      setPlanos(planosData);
      setNomeExibicao(empresa.nome_exibicao || empresa.nome || "");
      setDescricao(empresa.descricao || "");
      setLogoUrl(empresa.logo_url || "");
      setCorPrimaria(empresa.cor_primaria || "");
      setCorSecundaria(empresa.cor_secundaria || "");
      setWhatsapp(empresa.whatsapp || "");
      setPlanoId(empresa.plano_id || "");
      setStatus(empresa.assinatura_status || "trial");
      setAtivo(Boolean(empresa.ativa));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar a empresa.");
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const planoAtual = useMemo(() => planos.find((item) => item.id === planoId) || null, [planos, planoId]);

  async function handleSave() {
    if (!empresaId) return;
    try {
      setSaving(true);
      await updateSaasEmpresa(empresaId, {
        ativa: ativo,
        nome_exibicao: nomeExibicao,
        descricao,
        logo_url: logoUrl,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        whatsapp,
        plano_id: planoId || null,
        assinatura_status: status,
      });
      await load();
      Alert.alert("Sucesso", "Empresa atualizada.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível salvar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBindAdmin() {
    if (!empresaId || !adminUserId.trim()) {
      Alert.alert("Atenção", "Informe o user_id do admin da empresa.");
      return;
    }

    try {
      setBinding(true);
      await assignSaasEmpresaAdmin(empresaId, adminUserId.trim());
      setAdminUserId("");
      Alert.alert("Sucesso", "Admin vinculado.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível vincular o admin.");
    } finally {
      setBinding(false);
    }
  }

  async function handleExtendTrial() {
    if (!empresaId) return;
    try {
      await extendSaasEmpresaTrial(empresaId, 7);
      await load();
      Alert.alert("Trial estendido", "Mais 7 dias adicionados.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível estender o trial.");
    }
  }

  return (
    <ScrollView>
      <AdminPage title={detail?.nome || "Empresa"} subtitle="Gestão detalhada de branding, assinatura, plano e governança operacional da empresa.">
        {loading && !detail ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#facc15" />
          </View>
        ) : null}

        {detail ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>Painel da empresa</Text>
                <Text style={styles.heroTitle}>{detail.nome}</Text>
                <Text style={styles.heroDescription}>
                  Branding, plano, assinatura e governança operacional do tenant concentrados em uma visão premium de administração.
                </Text>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Usuários</Text>
                  <Text style={styles.heroStatValue}>{detail.usuarios_qtd}</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Pedidos</Text>
                  <Text style={styles.heroStatValue}>{detail.pedidos_qtd}</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Plano</Text>
                  <Text style={styles.heroStatValueSmall}>{detail.plano_nome ? normalizeAdminPlanoNome(detail.plano_nome) : "Sem plano"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.topGrid}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumo</Text>
                <View style={styles.badgeRow}>
                  <AdminBadge label={detail.assinatura_status || "sem status"} tone="info" />
                  <AdminBadge label={detail.ativa ? "empresa ativa" : "suspensa"} tone={detail.ativa ? "success" : "danger"} />
                </View>
                <Text style={styles.helper}>Slug: {detail.slug}</Text>
                <Text style={styles.helper}>Usuários: {detail.usuarios_qtd} • Pedidos: {detail.pedidos_qtd}</Text>
                <Text style={styles.helper}>
                  Teste até {detail.trial_fim ? new Date(detail.trial_fim).toLocaleDateString("pt-BR") : "-"}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Branding</Text>
                <TextInput style={styles.input} value={nomeExibicao} onChangeText={setNomeExibicao} placeholder="Nome exibido" placeholderTextColor="#64748b" />
                <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Descrição" placeholderTextColor="#64748b" />
                <TextInput style={styles.input} value={logoUrl} onChangeText={setLogoUrl} placeholder="Logo URL" placeholderTextColor="#64748b" />
                <View style={styles.row}>
                  <TextInput style={[styles.input, styles.rowInput]} value={corPrimaria} onChangeText={setCorPrimaria} placeholder="#facc15" placeholderTextColor="#64748b" />
                  <TextInput style={[styles.input, styles.rowInput]} value={corSecundaria} onChangeText={setCorSecundaria} placeholder="#08101c" placeholderTextColor="#64748b" />
                </View>
                <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp" placeholderTextColor="#64748b" />
              </View>
            </View>

            <View style={styles.topGrid}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Plano e assinatura</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planRow}>
                  {planos.map((plan) => {
                    const selected = plan.id === planoId;
                    return (
                      <Pressable key={plan.id} style={[styles.planChip, selected ? styles.planChipActive : null]} onPress={() => setPlanoId(plan.id)}>
                        <Text style={[styles.planTitle, selected ? styles.planTitleActive : null]}>{plan.nome}</Text>
                        <Text style={[styles.planMeta, selected ? styles.planTitleActive : null]}>R$ {Number(plan.valor || 0).toFixed(2)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={styles.helper}>
                  Plano atual: {planoAtual?.nome ? normalizeAdminPlanoNome(planoAtual.nome) : "Sem plano"} • Relatórios {planoAtual?.acesso_relatorios ? "sim" : "não"} • Marca própria {planoAtual?.white_label ? "sim" : "não"}
                </Text>
                <View style={styles.statusRow}>
                  {["trial", "ativa", "inadimplente", "cancelada", "pausada", "expirada"].map((item) => (
                    <Pressable key={item} style={[styles.statusChip, status === item ? styles.statusChipActive : null]} onPress={() => setStatus(item)}>
                      <Text style={[styles.statusChipText, status === item ? styles.statusChipTextActive : null]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Empresa ativa</Text>
                  <Switch value={ativo} onValueChange={setAtivo} trackColor={{ true: "#facc15", false: "#334155" }} thumbColor={ativo ? "#08101c" : "#cbd5e1"} />
                </View>
                <Pressable style={styles.secondaryButton} onPress={() => void handleExtendTrial()}>
                  <Text style={styles.secondaryButtonText}>Estender teste por 7 dias</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Vincular admin da empresa</Text>
                <TextInput style={styles.input} value={adminUserId} onChangeText={setAdminUserId} placeholder="UUID do usuário" placeholderTextColor="#64748b" />
                <Pressable style={styles.secondaryButton} onPress={() => void handleBindAdmin()} disabled={binding}>
                  {binding ? <ActivityIndicator color="#f8fafc" /> : <Text style={styles.secondaryButtonText}>Vincular admin_empresa</Text>}
                </Pressable>
              </View>
            </View>

            <Pressable style={[styles.primaryButton, saving ? styles.disabled : null]} onPress={() => void handleSave()} disabled={saving}>
              {saving ? <ActivityIndicator color="#08101c" /> : <Text style={styles.primaryButtonText}>Salvar alterações</Text>}
            </Pressable>
          </>
        ) : null}
      </AdminPage>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 40, alignItems: "center" },
  heroCard: {
    backgroundColor: "rgba(9, 15, 31, 0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
  },
  heroCopy: {
    flex: 1,
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
    fontSize: 30,
    fontWeight: "900",
    marginTop: 12,
  },
  heroDescription: {
    color: "#8fa8c6",
    marginTop: 10,
    maxWidth: 780,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    maxWidth: 420,
    justifyContent: "flex-end",
  },
  heroStat: {
    minWidth: 120,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
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
  heroStatValueSmall: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  topGrid: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  card: {
    flex: 1,
    backgroundColor: "rgba(9, 15, 31, 0.88)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    padding: 20,
  },
  cardTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "800", marginBottom: 14 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  helper: { color: "#94a3b8", marginTop: 8, lineHeight: 20 },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    color: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1 },
  planRow: { gap: 10, paddingBottom: 8 },
  planChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 140,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  planChipActive: { backgroundColor: "#facc15", borderColor: "#facc15" },
  planTitle: { color: "#f8fafc", fontWeight: "800" },
  planTitleActive: { color: "#08101c" },
  planMeta: { color: "#94a3b8", marginTop: 4 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  statusChip: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  statusChipActive: { backgroundColor: "#facc15", borderColor: "#facc15" },
  statusChipText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  statusChipTextActive: { color: "#08101c" },
  switchRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { color: "#f8fafc", fontWeight: "800" },
  secondaryButton: {
    marginTop: 14,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  secondaryButtonText: { color: "#f8fafc", fontWeight: "800" },
  primaryButton: {
    marginTop: 14,
    backgroundColor: "#facc15",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: { color: "#08101c", fontWeight: "900" },
  disabled: { opacity: 0.7 },
});
