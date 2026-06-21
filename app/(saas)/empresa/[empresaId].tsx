import {
  assignSaasEmpresaAdmin,
  extendSaasEmpresaTrial,
  getSaasEmpresaDetail,
  getSaasPlanos,
  updateSaasEmpresa,
  type SaasEmpresaDetail,
  type SaasPlano,
} from "@/lib/saas-admin";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AssinaturaStatus = "trial" | "ativa" | "inadimplente" | "cancelada" | "pausada" | "expirada";

export default function SaasEmpresaDetailScreen() {
  const params = useLocalSearchParams<{ empresaId?: string }>();
  const empresaId = String(params.empresaId || "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bindingAdmin, setBindingAdmin] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);
  const [planos, setPlanos] = useState<SaasPlano[]>([]);
  const [detail, setDetail] = useState<SaasEmpresaDetail | null>(null);

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [dominio, setDominio] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("");
  const [corSecundaria, setCorSecundaria] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [modoMarketplace, setModoMarketplace] = useState(true);
  const [modoWhiteLabel, setModoWhiteLabel] = useState(false);
  const [planoId, setPlanoId] = useState("");
  const [assinaturaStatus, setAssinaturaStatus] = useState<AssinaturaStatus>("trial");
  const [gatewaySubscriptionId, setGatewaySubscriptionId] = useState("");
  const [adminUserId, setAdminUserId] = useState("");

  const hydrate = useCallback((row: SaasEmpresaDetail) => {
    setDetail(row);
    setNome(row.nome || "");
    setSlug(row.slug || "");
    setAtiva(Boolean(row.ativa));
    setDominio(row.dominio || "");
    setTelefone(row.telefone || "");
    setEmail(row.email || "");
    setLogoUrl(row.logo_url || "");
    setCorPrimaria(row.cor_primaria || "");
    setCorSecundaria(row.cor_secundaria || "");
    setNomeExibicao(row.nome_exibicao || "");
    setDescricao(row.descricao || "");
    setWhatsapp(row.whatsapp || "");
    setEndereco(row.endereco || "");
    setCidade(row.cidade || "");
    setEstado(row.estado || "");
    setModoMarketplace(Boolean(row.modo_marketplace));
    setModoWhiteLabel(Boolean(row.modo_white_label));
    setPlanoId(row.plano_id || "");
    setAssinaturaStatus((row.assinatura_status as AssinaturaStatus | null) || "trial");
    setGatewaySubscriptionId(row.gateway_subscription_id || "");
  }, []);

  const carregar = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [empresa, planosData] = await Promise.all([
        getSaasEmpresaDetail(empresaId),
        getSaasPlanos(),
      ]);
      setPlanos(planosData);
      hydrate(empresa);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar a empresa SaaS.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [empresaId, hydrate]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const planoSelecionado = useMemo(
    () => planos.find((item) => item.id === planoId) || null,
    [planos, planoId]
  );

  async function handleSalvar() {
    if (!empresaId) return;

    try {
      setSaving(true);
      await updateSaasEmpresa(empresaId, {
        nome,
        slug,
        ativa,
        dominio,
        telefone,
        email,
        logo_url: logoUrl,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        nome_exibicao: nomeExibicao,
        descricao,
        whatsapp,
        endereco,
        cidade,
        estado,
        modo_marketplace: modoMarketplace,
        modo_white_label: modoWhiteLabel,
        plano_id: planoId || null,
        assinatura_status: assinaturaStatus,
        gateway_subscription_id: gatewaySubscriptionId,
      });
      await carregar();
      Alert.alert("Sucesso", "Empresa SaaS atualizada.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVincularAdmin() {
    if (!empresaId || !adminUserId.trim()) {
      Alert.alert("Atenção", "Informe o user_id do admin da empresa.");
      return;
    }

    try {
      setBindingAdmin(true);
      await assignSaasEmpresaAdmin(empresaId, adminUserId.trim());
      setAdminUserId("");
      Alert.alert("Sucesso", "Admin da empresa vinculado.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível vincular o admin.");
    } finally {
      setBindingAdmin(false);
    }
  }

  async function handleExtendTrial() {
    if (!empresaId) return;

    try {
      setExtendingTrial(true);
      await extendSaasEmpresaTrial(empresaId, 7);
      await carregar();
      Alert.alert("Trial estendido", "O trial da empresa foi estendido por mais 7 dias.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível estender o trial.");
    } finally {
      setExtendingTrial(false);
    }
  }

  if (loading && !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
        setRefreshing(true);
        void carregar();
      }} tintColor="#facc15" />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Empresa SaaS</Text>
        <Text style={styles.title}>{nomeExibicao || nome || "Empresa"}</Text>
        <Text style={styles.subtitle}>
          Branding, domínio, modos de negócio, assinatura e governança do tenant.
        </Text>
        <Text style={styles.heroHelper}>
          Trial: {detail?.trial_fim ? new Date(detail.trial_fim).toLocaleDateString("pt-BR") : "não configurado"} • Status{" "}
          {detail?.assinatura_status || "indefinido"}
        </Text>
      </View>

      <View style={styles.kpiRow}>
        <StatCard label="Usuários" value={String(detail?.usuarios_qtd || 0)} />
        <StatCard label="Pedidos" value={String(detail?.pedidos_qtd || 0)} />
        <StatCard label="Plano" value={detail?.plano_nome || "Sem plano"} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Base da empresa</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome interno" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={slug} onChangeText={setSlug} placeholder="slug-da-empresa" autoCapitalize="none" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={dominio} onChangeText={setDominio} placeholder="dominio.com.br" autoCapitalize="none" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} placeholder="Telefone" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email institucional" autoCapitalize="none" placeholderTextColor="#64748b" />
        <SwitchRow label="Empresa ativa" value={ativa} onValueChange={setAtiva} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Branding e white-label</Text>
        <TextInput style={styles.input} value={nomeExibicao} onChangeText={setNomeExibicao} placeholder="Nome exibido" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Descrição institucional" placeholderTextColor="#64748b" multiline />
        <TextInput style={styles.input} value={logoUrl} onChangeText={setLogoUrl} placeholder="Logo URL" autoCapitalize="none" placeholderTextColor="#64748b" />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} value={corPrimaria} onChangeText={setCorPrimaria} placeholder="#facc15" autoCapitalize="none" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, styles.rowInput]} value={corSecundaria} onChangeText={setCorSecundaria} placeholder="#020617" autoCapitalize="none" placeholderTextColor="#64748b" />
        </View>
        <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Endereço" placeholderTextColor="#64748b" />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} value={cidade} onChangeText={setCidade} placeholder="Cidade" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, styles.rowInput]} value={estado} onChangeText={setEstado} placeholder="UF" placeholderTextColor="#64748b" />
        </View>
        <SwitchRow label="Modo marketplace" value={modoMarketplace} onValueChange={setModoMarketplace} />
        <SwitchRow label="Modo white-label" value={modoWhiteLabel} onValueChange={setModoWhiteLabel} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plano e assinatura</Text>
        <Text style={styles.helper}>Plano atual: {detail?.plano_nome || "Sem plano"}</Text>
        <Text style={styles.helper}>
          Trial ativo: {detail?.trial_ativo ? "sim" : "não"} • Início {detail?.trial_inicio ? new Date(detail.trial_inicio).toLocaleDateString("pt-BR") : "-"} • Fim{" "}
          {detail?.trial_fim ? new Date(detail.trial_fim).toLocaleDateString("pt-BR") : "-"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planRow}>
          {planos.map((plano) => {
            const active = plano.id === planoId;
            return (
              <TouchableOpacity
                key={plano.id}
                style={[styles.planChip, active ? styles.planChipActive : null]}
                onPress={() => setPlanoId(plano.id)}
              >
                <Text style={[styles.planChipTitle, active ? styles.planChipTitleActive : null]}>{plano.nome}</Text>
                <Text style={[styles.planChipMeta, active ? styles.planChipTitleActive : null]}>
                  R$ {Number(plano.valor || 0).toFixed(2)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {planoSelecionado ? (
          <Text style={styles.helper}>
            Limites: usuários {planoSelecionado.limite_usuarios ?? "ilimitado"} • profissionais {planoSelecionado.limite_profissionais ?? "ilimitado"} • pedidos {planoSelecionado.limite_pedidos ?? "ilimitado"}
          </Text>
        ) : null}
        <TextInput
          style={styles.input}
          value={gatewaySubscriptionId}
          onChangeText={setGatewaySubscriptionId}
          placeholder="gateway_subscription_id"
          autoCapitalize="none"
          placeholderTextColor="#64748b"
        />
        <View style={styles.statusRow}>
          {(["trial", "ativa", "inadimplente", "cancelada", "pausada", "expirada"] as AssinaturaStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusChip, assinaturaStatus === status ? styles.statusChipActive : null]}
              onPress={() => setAssinaturaStatus(status)}
            >
              <Text style={[styles.statusChipText, assinaturaStatus === status ? styles.statusChipTextActive : null]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleExtendTrial()} disabled={extendingTrial}>
          {extendingTrial ? <ActivityIndicator color="#facc15" /> : <Text style={styles.secondaryButtonText}>Estender trial por 7 dias</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Admin da empresa</Text>
        <Text style={styles.helper}>Vincule um usuário já cadastrado pelo `user_id` do Auth.</Text>
        <TextInput
          style={styles.input}
          value={adminUserId}
          onChangeText={setAdminUserId}
          placeholder="UUID do usuário"
          autoCapitalize="none"
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleVincularAdmin()} disabled={bindingAdmin}>
          {bindingAdmin ? <ActivityIndicator color="#facc15" /> : <Text style={styles.secondaryButtonText}>Vincular admin_empresa</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryButton, saving ? styles.disabled : null]} onPress={() => void handleSalvar()} disabled={saving}>
        {saving ? <ActivityIndicator color="#020617" /> : <Text style={styles.primaryButtonText}>Salvar empresa</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#facc15", false: "#334155" }} thumbColor={value ? "#020617" : "#cbd5e1"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    gap: 14,
  },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 8,
    lineHeight: 20,
  },
  heroHelper: {
    color: "#cbd5e1",
    marginTop: 10,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  helper: {
    color: "#94a3b8",
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },
  planRow: {
    gap: 10,
    paddingBottom: 4,
  },
  planChip: {
    minWidth: 160,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  planChipActive: {
    borderColor: "#facc15",
    backgroundColor: "#1f2937",
  },
  planChipTitle: {
    color: "#ffffff",
    fontWeight: "800",
  },
  planChipTitleActive: {
    color: "#facc15",
  },
  planChipMeta: {
    color: "#94a3b8",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statusChipActive: {
    borderColor: "#facc15",
    backgroundColor: "rgba(250,204,21,0.12)",
  },
  statusChipText: {
    color: "#cbd5e1",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusChipTextActive: {
    color: "#facc15",
  },
  secondaryButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#facc15",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#facc15",
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#020617",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.7,
  },
});
