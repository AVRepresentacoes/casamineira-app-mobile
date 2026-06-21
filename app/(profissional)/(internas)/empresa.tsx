import { useEmpresa } from "@/contexts/EmpresaContext";
import { useEmpresaCommercial } from "@/hooks/useEmpresaCommercial";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function canManageEmpresa(role: string | null | undefined) {
  return ["owner", "admin", "admin_empresa"].includes(String(role || ""));
}

export default function EmpresaInternaScreen() {
  const router = useRouter();
  const { empresa, assinaturaSaas, refreshEmpresa, loadingEmpresa } = useEmpresa();
  const { commercial, refreshCommercial } = useEmpresaCommercial();
  const [saving, setSaving] = useState(false);
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("");
  const [corSecundaria, setCorSecundaria] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [modoMarketplace, setModoMarketplace] = useState(true);
  const [modoWhiteLabel, setModoWhiteLabel] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    setNomeExibicao(empresa.nome_exibicao || empresa.nome || "");
    setDescricao(empresa.descricao || "");
    setLogoUrl(empresa.logo_url || "");
    setCorPrimaria(empresa.cor_primaria || "");
    setCorSecundaria(empresa.cor_secundaria || "");
    setWhatsapp(empresa.whatsapp || "");
    setEndereco("");
    setCidade("");
    setEstado("");
    setModoMarketplace(Boolean(empresa.modo_marketplace));
    setModoWhiteLabel(Boolean(empresa.modo_white_label));
  }, [empresa]);

  async function salvar() {
    try {
      if (modoWhiteLabel && !commercial?.white_label) {
        Alert.alert(
          "White-label bloqueado",
          "Sua empresa ainda não possui white-label liberado neste plano. Faça upgrade para ativar sua marca própria."
        );
        return;
      }

      setSaving(true);
      const { error } = await supabase.rpc("empresa_admin_upsert_current_empresa_branding", {
        p_nome_exibicao: nomeExibicao || null,
        p_descricao: descricao || null,
        p_logo_url: logoUrl || null,
        p_cor_primaria: corPrimaria || null,
        p_cor_secundaria: corSecundaria || null,
        p_whatsapp: whatsapp || null,
        p_endereco: endereco || null,
        p_cidade: cidade || null,
        p_estado: estado || null,
        p_modo_marketplace: modoMarketplace,
        p_modo_white_label: modoWhiteLabel,
      });

      if (error) {
        throw error;
      }

      await refreshEmpresa();
      await refreshCommercial();
      Alert.alert("Sucesso", "Configuração da empresa atualizada.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível atualizar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingEmpresa) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (!empresa || !canManageEmpresa(empresa.role)) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Acesso restrito</Text>
        <Text style={styles.emptyText}>Somente o admin da empresa pode editar branding e modos operacionais.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Empresa atual</Text>
        <Text style={styles.title}>{empresa.nome_exibicao || empresa.nome}</Text>
        <Text style={styles.subtitle}>
          Plano SaaS: {assinaturaSaas?.plano_nome || "Sem plano"} • Status: {assinaturaSaas?.assinatura_status || "sem status"}
        </Text>
        <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/(profissional)/(internas)/assinatura-empresa")}>
          <Text style={styles.heroButtonText}>Gerenciar assinatura da empresa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Branding</Text>
        <TextInput style={styles.input} value={nomeExibicao} onChangeText={setNomeExibicao} placeholder="Nome exibido" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Descrição" placeholderTextColor="#64748b" multiline />
        <TextInput style={styles.input} value={logoUrl} onChangeText={setLogoUrl} placeholder="Logo URL" autoCapitalize="none" placeholderTextColor="#64748b" />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} value={corPrimaria} onChangeText={setCorPrimaria} placeholder="#facc15" autoCapitalize="none" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, styles.rowInput]} value={corSecundaria} onChangeText={setCorSecundaria} placeholder="#020617" autoCapitalize="none" placeholderTextColor="#64748b" />
        </View>
        <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp" placeholderTextColor="#64748b" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Modo de negócio</Text>
        <SwitchRow label="Marketplace" value={modoMarketplace} onValueChange={setModoMarketplace} />
        <SwitchRow label="White-label operacional" value={modoWhiteLabel} onValueChange={setModoWhiteLabel} />
        {!commercial?.white_label ? (
          <Text style={styles.helperText}>White-label avançado é liberado apenas em planos com marca própria.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta da empresa</Text>
        <Text style={styles.accountText}>
          Para remover o acesso da conta administradora e solicitar exclusão dos dados vinculados, acesse o fluxo de exclusão de conta.
        </Text>
        <TouchableOpacity
          style={styles.dangerOutlineButton}
          onPress={() => router.push("/(tabs)/cancelamento-conta")}
        >
          <Text style={styles.dangerOutlineButtonText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, saving ? styles.disabled : null]} onPress={() => void salvar()} disabled={saving}>
        {saving ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>Salvar empresa</Text>}
      </TouchableOpacity>
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
    padding: 24,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 8,
    textAlign: "center",
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
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 8,
  },
  heroButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: "#facc15",
    fontWeight: "800",
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
    fontSize: 16,
    fontWeight: "800",
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  switchLabel: {
    color: "#ffffff",
    fontWeight: "700",
  },
  helperText: {
    color: "#f59e0b",
    lineHeight: 20,
    marginTop: 8,
  },
  accountText: {
    color: "#cbd5e1",
    lineHeight: 21,
    marginBottom: 12,
  },
  dangerOutlineButton: {
    borderWidth: 1,
    borderColor: "#f87171",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerOutlineButtonText: {
    color: "#fecaca",
    fontWeight: "900",
  },
  button: {
    backgroundColor: "#facc15",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#020617",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.7,
  },
});
