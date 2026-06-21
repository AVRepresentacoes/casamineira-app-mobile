import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  Switch,
  Text,
  View,
} from "react-native";
import PressableScale from "@/components/PressableScale";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";

export default function ConfiguracoesProfissional() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ativo, setAtivo] = useState(true);
  const [disponivel, setDisponivel] = useState(true);
  const [raio, setRaio] = useState(10);
  const [fornecedorAtivo, setFornecedorAtivo] = useState(false);
  const [fornecedorRaio, setFornecedorRaio] = useState(15);
  const [notificacoes, setNotificacoes] = useState(true);
  const [mpConnected, setMpConnected] = useState(false);
  const [mpProviderUserId, setMpProviderUserId] = useState("");
  const [mpUpdatedAt, setMpUpdatedAt] = useState<string | null>(null);
  const [mpAccessTokenInput, setMpAccessTokenInput] = useState("");
  const [mpProviderUserIdInput, setMpProviderUserIdInput] = useState("");
  const [savingMp, setSavingMp] = useState(false);
  const [verifyingMp, setVerifyingMp] = useState(false);

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      return;
    }

    let tenantId: string | null = null;
    try {
      tenantId = await ensureCurrentUserTenantContext();
    } catch {
      try {
        tenantId = await getCurrentTenantId();
      } catch {
        tenantId = null;
      }
    }

    if (!tenantId) {
      Alert.alert("Erro", "Tenant não encontrado para sua conta. Faça login novamente.");
      setLoading(false);
      return;
    }

    let query = supabase
      .from("profissionais")
      .select("ativo, disponivel, raio_km, fornecedor_ativo, fornecedor_raio_km")
      .eq("user_id", auth.user.id);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.log("ERRO CARREGAR CONFIG PROFISSIONAL:", error);
    }

    if (data) {
      setAtivo(data.ativo ?? true);
      setDisponivel(data.disponivel ?? true);
      setRaio(data.raio_km ?? 10);
      setFornecedorAtivo(Boolean((data as any).fornecedor_ativo ?? false));
      setFornecedorRaio(Number((data as any).fornecedor_raio_km ?? 15));
    }

    const { data: mpStatusData, error: mpStatusError } = await supabase.rpc(
      "get_profissional_mercadopago_account_status"
    );

    if (mpStatusError) {
      console.log("ERRO STATUS MP:", mpStatusError);
    } else {
      const row = Array.isArray(mpStatusData) ? mpStatusData[0] : mpStatusData;
      const connected = Boolean(row?.connected);
      const providerUserId = String(row?.provider_user_id || "");
      setMpConnected(connected);
      setMpProviderUserId(providerUserId);
      setMpProviderUserIdInput(providerUserId);
      setMpUpdatedAt(row?.updated_at ? new Date(row.updated_at).toLocaleString("pt-BR") : null);
    }

    setLoading(false);
  };

  const conectarMercadoPago = async () => {
    if (!mpAccessTokenInput.trim()) {
      Alert.alert("Atenção", "Informe o Access Token do Mercado Pago.");
      return;
    }

    setSavingMp(true);
    try {
      const { error } = await supabase.rpc("upsert_profissional_mercadopago_account", {
        p_access_token: mpAccessTokenInput.trim(),
        p_provider_user_id: mpProviderUserIdInput.trim() || null,
      });

      if (error) throw error;

      setMpAccessTokenInput("");
      Alert.alert("Conectado", "Conta Mercado Pago vinculada com sucesso.");
      await carregarConfig();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível conectar a conta Mercado Pago.");
    } finally {
      setSavingMp(false);
    }
  };

  const verificarTokenMercadoPago = async () => {
    if (!mpAccessTokenInput.trim()) {
      Alert.alert("Atenção", "Informe o Access Token para validar.");
      return;
    }

    setVerifyingMp(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-mercadopago-account", {
        body: {
          accessToken: mpAccessTokenInput.trim(),
        },
      });

      if (error) throw error;
      if (data?.error || data?.valid === false) {
        throw new Error(String(data?.error || "Token inválido."));
      }

      const providerUserId = String(data?.provider_user_id || "");
      if (providerUserId) {
        setMpProviderUserIdInput(providerUserId);
      }

      Alert.alert(
        "Token válido",
        `Conta validada no Mercado Pago.\nUser ID: ${providerUserId || "não retornado"}`
      );
    } catch (error: any) {
      Alert.alert("Falha na validação", error?.message || "Não foi possível validar o token no Mercado Pago.");
    } finally {
      setVerifyingMp(false);
    }
  };

  const salvarConfig = async () => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setSaving(false);
      return;
    }

    let tenantId: string | null = null;
    try {
      tenantId = await ensureCurrentUserTenantContext();
    } catch {
      try {
        tenantId = await getCurrentTenantId();
      } catch {
        tenantId = null;
      }
    }

    if (!tenantId) {
      setSaving(false);
      Alert.alert("Erro", "Tenant não encontrado para sua conta. Faça login novamente.");
      return;
    }

    const payload = {
      user_id: auth.user.id,
      tenant_id: tenantId,
      ativo,
      disponivel,
      raio_km: raio,
      fornecedor_ativo: fornecedorAtivo,
      fornecedor_raio_km: fornecedorRaio,
      updated_at: new Date().toISOString(),
    };

    let query = supabase
      .from("profissionais")
      .update(payload)
      .eq("user_id", auth.user.id);
    query = query.eq("tenant_id", tenantId);

    const { data: updatedRows, error: updateError } = await query
      .select("user_id")
      .limit(1);

    let error = updateError;

    if (!error && (!updatedRows || updatedRows.length === 0)) {
      const { error: insertError } = await supabase
        .from("profissionais")
        .insert(payload);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert("Sucesso", "Configurações salvas.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="settings-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Controle operacional</Text>
            <Text style={styles.title}>Configurações</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Ajuste disponibilidade, cobertura, operação como fornecedor e integração de split sem alterar o fluxo principal da conta.
        </Text>
      </View>
      <Text style={styles.subtitle}>Controle operacional da conta profissional</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Perfil e disponibilidade</Text>
          <Text style={styles.cardHint}>Atuação</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Perfil ativo</Text>
          <Switch
            value={ativo}
            onValueChange={setAtivo}
            thumbColor={ativo ? "#facc15" : "#374151"}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Disponível para pedidos</Text>
          <Switch
            value={disponivel}
            onValueChange={setDisponivel}
            thumbColor={disponivel ? "#22c55e" : "#374151"}
          />
        </View>

        <View style={[styles.row, styles.rowNoBorder]}>
          <Text style={styles.label}>Notificações estratégicas</Text>
          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
            thumbColor={notificacoes ? "#38bdf8" : "#374151"}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Cobertura de atendimento</Text>
          <Text style={styles.cardHint}>Raio</Text>
        </View>
        <Text style={styles.label}>Raio de atendimento: {raio} km</Text>

        <Slider
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={raio}
          onValueChange={setRaio}
          minimumTrackTintColor="#facc15"
          maximumTrackTintColor="#374151"
          thumbTintColor="#facc15"
        />

        <View style={styles.quickRow}>
          <PressableScale style={styles.quickBtn} onPress={() => setRaio(5)}>
            <Text style={styles.quickText}>5 km</Text>
          </PressableScale>
          <PressableScale style={styles.quickBtn} onPress={() => setRaio(15)}>
            <Text style={styles.quickText}>15 km</Text>
          </PressableScale>
          <PressableScale style={styles.quickBtn} onPress={() => setRaio(30)}>
            <Text style={styles.quickText}>30 km</Text>
          </PressableScale>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Operação como fornecedor</Text>
          <Text style={styles.cardHint}>Produtos</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fornecedor de produtos</Text>
          <Switch
            value={fornecedorAtivo}
            onValueChange={setFornecedorAtivo}
            thumbColor={fornecedorAtivo ? "#22c55e" : "#374151"}
          />
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>
          Raio de entrega dos produtos: {fornecedorRaio} km
        </Text>

        <Slider
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={fornecedorRaio}
          onValueChange={setFornecedorRaio}
          minimumTrackTintColor="#22c55e"
          maximumTrackTintColor="#374151"
          thumbTintColor="#22c55e"
        />

        <View style={styles.quickRow}>
          <PressableScale style={styles.quickBtn} onPress={() => setFornecedorRaio(5)}>
            <Text style={styles.quickText}>5 km</Text>
          </PressableScale>
          <PressableScale style={styles.quickBtn} onPress={() => setFornecedorRaio(15)}>
            <Text style={styles.quickText}>15 km</Text>
          </PressableScale>
          <PressableScale style={styles.quickBtn} onPress={() => setFornecedorRaio(30)}>
            <Text style={styles.quickText}>30 km</Text>
          </PressableScale>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Resumo atual</Text>
          <Text style={styles.cardHint}>Snapshot</Text>
        </View>
        <Text style={styles.summary}>Perfil: {ativo ? "Ativo" : "Inativo"}</Text>
        <Text style={styles.summary}>
          Disponibilidade: {disponivel ? "Aberto para novos pedidos" : "Pausado"}
        </Text>
        <Text style={styles.summary}>Cobertura: {raio} km</Text>
        <Text style={styles.summary}>
          Fornecedor: {fornecedorAtivo ? `Ativo (${fornecedorRaio} km)` : "Inativo"}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Conta Mercado Pago (Split)</Text>
          <Text style={styles.cardHint}>Repasse</Text>
        </View>
        <Text style={styles.summary}>
          Status: {mpConnected ? "Conectado" : "Não conectado"}
        </Text>
        <Text style={styles.summary}>
          User ID MP: {mpProviderUserId || "Não informado"}
        </Text>
        <Text style={styles.summary}>
          Última atualização: {mpUpdatedAt || "Nunca"}
        </Text>

        <Text style={[styles.label, { marginTop: 12 }]}>Access Token</Text>
        <TextInput
          value={mpAccessTokenInput}
          onChangeText={setMpAccessTokenInput}
          placeholder="APP_USR-..."
          placeholderTextColor="#6b7280"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <PressableScale
          style={[styles.mpBtnSecondary, verifyingMp && { opacity: 0.6 }]}
          onPress={verificarTokenMercadoPago}
          disabled={verifyingMp}
        >
          <Text style={styles.mpBtnSecondaryText}>
            {verifyingMp ? "Validando..." : "Verificar token"}
          </Text>
        </PressableScale>

        <Text style={[styles.label, { marginTop: 10 }]}>Provider User ID (opcional)</Text>
        <TextInput
          value={mpProviderUserIdInput}
          onChangeText={setMpProviderUserIdInput}
          placeholder="collector_id / user_id do MP"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <PressableScale
          style={[styles.mpBtn, savingMp && { opacity: 0.6 }]}
          onPress={conectarMercadoPago}
          disabled={savingMp}
        >
          <Text style={styles.mpBtnText}>
            {savingMp ? "Conectando..." : mpConnected ? "Atualizar conexão" : "Conectar Mercado Pago"}
          </Text>
        </PressableScale>
      </View>

      <PressableScale
        style={[styles.btn, saving && { opacity: 0.6 }]}
        onPress={salvarConfig}
        disabled={saving}
      >
        <Text style={styles.btnText}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Text>
      </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#03040a",
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  heroText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#081121",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  cardHint: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#223854",
  },
  rowNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  label: {
    color: "#9ca3af",
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#304767",
    backgroundColor: "#0c172d",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  quickText: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 12,
  },
  summary: {
    color: "#94a3b8",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#e6e7e9",
    marginTop: 8,
  },
  mpBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#facc15",
  },
  mpBtnText: {
    color: "#0B0F1A",
    fontWeight: "900",
  },
  mpBtnSecondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#0c172d",
  },
  mpBtnSecondaryText: {
    color: "#cbd5e1",
    fontWeight: "800",
  },
  btn: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
});
