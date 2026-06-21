import PortalShell from "@/components/fornecedor-web/PortalShell";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { uploadImageAsync } from "@/lib/uploadImage";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

type PerfilFornecedor = {
  fornecedor_nome_fantasia?: string | null;
  fornecedor_categoria?: string | null;
  fornecedor_raio_km?: number | null;
  fornecedor_ativo?: boolean | null;
  fornecedor_cnpj?: string | null;
  fornecedor_razao_social?: string | null;
  fornecedor_descricao?: string | null;
  fornecedor_capa_url?: string | null;
  fornecedor_logo_url?: string | null;
  fornecedor_whatsapp?: string | null;
  fornecedor_email_publico?: string | null;
  fornecedor_instagram?: string | null;
  fornecedor_site_url?: string | null;
  fornecedor_endereco?: string | null;
  fornecedor_bairro?: string | null;
  fornecedor_cep?: string | null;
  fornecedor_horario_funcionamento?: string | null;
  fornecedor_prazo_entrega?: string | null;
  fornecedor_pedido_minimo?: number | null;
  fornecedor_taxa_entrega?: number | null;
  fornecedor_sobre?: string | null;
  fornecedor_politica_troca?: string | null;
  fornecedor_aberto_agora?: boolean | null;
  updated_at?: string | null;
};

const fallbackCapa =
  "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1600&q=70";

function parseMoneyInputToNumber(value: string) {
  const normalized = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function normalizeUrl(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

function isMissingColumnError(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("column") && message.includes("does not exist");
}

export default function PortalFornecedorConfiguracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [currentUid, setCurrentUid] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [categoria, setCategoria] = useState("");
  const [raio, setRaio] = useState("15");
  const [ativo, setAtivo] = useState(true);
  const [abertoAgora, setAbertoAgora] = useState(true);
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [descricao, setDescricao] = useState("");
  const [capaUrl, setCapaUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sobre, setSobre] = useState("");
  const [politicaTroca, setPoliticaTroca] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailPublico, setEmailPublico] = useState("");
  const [instagram, setInstagram] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [horario, setHorario] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [pedidoMinimo, setPedidoMinimo] = useState("0");
  const [taxaEntrega, setTaxaEntrega] = useState("0");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const resolveTenantId = useCallback(async () => {
    try {
      return await ensureCurrentUserTenantContext();
    } catch {
      try {
        return await getCurrentTenantId();
      } catch {
        return null;
      }
    }
  }, []);

  const hydrateFromRow = useCallback((row: PerfilFornecedor | null) => {
    const safe = row || {};
    setNomeFantasia(String(safe.fornecedor_nome_fantasia || ""));
    setCategoria(String(safe.fornecedor_categoria || ""));
    setRaio(String(Number(safe.fornecedor_raio_km || 15)));
    setAtivo(Boolean(safe.fornecedor_ativo ?? true));
    setAbertoAgora(Boolean(safe.fornecedor_aberto_agora ?? true));
    setCnpj(String(safe.fornecedor_cnpj || ""));
    setRazaoSocial(String(safe.fornecedor_razao_social || ""));
    setDescricao(String(safe.fornecedor_descricao || ""));
    setCapaUrl(String(safe.fornecedor_capa_url || ""));
    setLogoUrl(String(safe.fornecedor_logo_url || ""));
    setSobre(String(safe.fornecedor_sobre || ""));
    setPoliticaTroca(String(safe.fornecedor_politica_troca || ""));
    setWhatsapp(String(safe.fornecedor_whatsapp || ""));
    setEmailPublico(String(safe.fornecedor_email_publico || ""));
    setInstagram(String(safe.fornecedor_instagram || ""));
    setSiteUrl(String(safe.fornecedor_site_url || ""));
    setEndereco(String(safe.fornecedor_endereco || ""));
    setBairro(String(safe.fornecedor_bairro || ""));
    setCep(String(safe.fornecedor_cep || ""));
    setHorario(String(safe.fornecedor_horario_funcionamento || ""));
    setPrazoEntrega(String(safe.fornecedor_prazo_entrega || ""));
    setPedidoMinimo(String(Number(safe.fornecedor_pedido_minimo || 0).toFixed(2).replace(".", ",")));
    setTaxaEntrega(String(Number(safe.fornecedor_taxa_entrega || 0).toFixed(2).replace(".", ",")));
    setLastSavedAt(safe.updated_at ? new Date(String(safe.updated_at)).toLocaleString("pt-BR") : null);
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const tenantId = await resolveTenantId();
      if (!tenantId) {
        Alert.alert("Erro", "Tenant não encontrado. Faça login novamente.");
        return;
      }
      setCurrentUid(uid);

      const baseSelect =
        "fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_raio_km, fornecedor_ativo, fornecedor_cnpj, fornecedor_razao_social, fornecedor_descricao, fornecedor_capa_url, fornecedor_logo_url, fornecedor_whatsapp, fornecedor_email_publico, fornecedor_instagram, fornecedor_site_url, fornecedor_endereco, fornecedor_bairro, fornecedor_cep, fornecedor_horario_funcionamento, fornecedor_prazo_entrega, fornecedor_pedido_minimo, fornecedor_taxa_entrega, fornecedor_sobre, fornecedor_politica_troca, fornecedor_aberto_agora, updated_at, tenant_id";

      const { data: scopedData } = await supabase
        .from("profissionais")
        .select(baseSelect)
        .eq("user_id", uid)
        .eq("tenant_id", tenantId)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      let row = (scopedData as (PerfilFornecedor & { tenant_id?: string | null }) | null) || null;

      // Fallback para registros legados sem tenant_id preenchido corretamente.
      if (!row) {
        const { data: legacyData } = await supabase
          .from("profissionais")
          .select(baseSelect)
          .eq("user_id", uid)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        row = (legacyData as (PerfilFornecedor & { tenant_id?: string | null }) | null) || null;
      }

      hydrateFromRow(row || {});
    } finally {
      setLoading(false);
    }
  }, [hydrateFromRow, resolveTenantId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  useEffect(() => {
    if (!currentUid) return;

    const channel = supabase
      .channel(`fornecedor-config-live-${currentUid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profissionais",
          filter: `user_id=eq.${currentUid}`,
        },
        (payload) => {
          if (saving || uploadingCapa || uploadingLogo) return;
          hydrateFromRow((payload.new || {}) as PerfilFornecedor);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profissionais",
          filter: `user_id=eq.${currentUid}`,
        },
        (payload) => {
          if (saving || uploadingCapa || uploadingLogo) return;
          hydrateFromRow((payload.new || {}) as PerfilFornecedor);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUid, hydrateFromRow, saving, uploadingCapa, uploadingLogo]);

  async function salvar() {
    if (uploadingCapa || uploadingLogo) {
      return Alert.alert("Atenção", "Aguarde o upload da imagem terminar para salvar.");
    }
    if (!nomeFantasia.trim()) {
      return Alert.alert("Atenção", "Informe o nome fantasia da loja.");
    }
    const raioNum = Number(raio);
    if (!Number.isFinite(raioNum) || raioNum < 1 || raioNum > 100) {
      return Alert.alert("Atenção", "Raio deve estar entre 1 e 100 km.");
    }
    const pedidoMinimoNum = parseMoneyInputToNumber(pedidoMinimo);
    const taxaEntregaNum = parseMoneyInputToNumber(taxaEntrega);

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");
      const tenantId = await resolveTenantId();
      if (!tenantId) throw new Error("Tenant não encontrado.");

      const corePayload = {
        user_id: uid,
        tenant_id: tenantId,
        fornecedor_nome_fantasia: nomeFantasia.trim() || null,
        fornecedor_categoria: categoria.trim() || null,
        fornecedor_raio_km: raioNum,
        fornecedor_ativo: ativo,
        fornecedor_cnpj: cnpj.replace(/\D/g, "") || null,
        fornecedor_razao_social: razaoSocial.trim() || null,
        fornecedor_descricao: descricao.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const payload = {
        ...corePayload,
        fornecedor_aberto_agora: abertoAgora,
        fornecedor_capa_url: normalizeUrl(capaUrl),
        fornecedor_logo_url: normalizeUrl(logoUrl),
        fornecedor_whatsapp: whatsapp.replace(/\D/g, "") || null,
        fornecedor_email_publico: emailPublico.trim().toLowerCase() || null,
        fornecedor_instagram: instagram.trim() || null,
        fornecedor_site_url: normalizeUrl(siteUrl),
        fornecedor_endereco: endereco.trim() || null,
        fornecedor_bairro: bairro.trim() || null,
        fornecedor_cep: cep.replace(/\D/g, "") || null,
        fornecedor_horario_funcionamento: horario.trim() || null,
        fornecedor_prazo_entrega: prazoEntrega.trim() || null,
        fornecedor_pedido_minimo: pedidoMinimoNum,
        fornecedor_taxa_entrega: taxaEntregaNum,
        fornecedor_sobre: sobre.trim() || null,
        fornecedor_politica_troca: politicaTroca.trim() || null,
      };

      const persist = async (writePayload: Record<string, unknown>) => {
        const { data: updatedRow, error: updateError } = await supabase
          .from("profissionais")
          .update(writePayload)
          .eq("user_id", uid)
          .select("user_id")
          .maybeSingle();

        if (updateError) return { error: updateError };
        if (updatedRow?.user_id) return { error: null };

        const { error: insertError } = await supabase
          .from("profissionais")
          .insert(writePayload);
        return { error: insertError };
      };

      let { error } = await persist(payload);
      let fallbackUsed = false;
      if (error && isMissingColumnError(error)) {
        fallbackUsed = true;
        const fallback = await persist(corePayload);
        error = fallback.error;
      }

      if (error) throw error;

      const { data: readback, error: readbackError } = await supabase
        .from("profissionais")
        .select("fornecedor_nome_fantasia, updated_at")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (readbackError) throw readbackError;

      const nomePersistido = String(readback?.fornecedor_nome_fantasia || "").trim();
      if (nomePersistido) {
        setNomeFantasia(nomePersistido);
      }

      if (readback?.updated_at) {
        setLastSavedAt(new Date(String(readback.updated_at)).toLocaleString("pt-BR"));
      } else {
        setLastSavedAt(new Date(corePayload.updated_at).toLocaleString("pt-BR"));
      }

      if (fallbackUsed) {
        Alert.alert(
          "Configuração salva com ressalva",
          "Os campos principais foram salvos, mas alguns campos novos ainda não existem no banco. Rode as migrações pendentes."
        );
      } else {
        Alert.alert("Sucesso", "Configurações salvas.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function escolherImagemLoja(tipo: "capa" | "logo") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Autorize acesso à galeria para enviar imagens.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: tipo === "capa" ? [16, 7] : [1, 1],
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      if (tipo === "capa") setUploadingCapa(true);
      if (tipo === "logo") setUploadingLogo(true);
      const publicUrl = await uploadImageAsync(result.assets[0].uri);
      if (tipo === "capa") setCapaUrl(publicUrl);
      if (tipo === "logo") setLogoUrl(publicUrl);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha no upload da imagem.");
    } finally {
      if (tipo === "capa") setUploadingCapa(false);
      if (tipo === "logo") setUploadingLogo(false);
    }
  }

  return (
    <PortalShell title="Configurações" subtitle="Personalize sua operação e visibilidade">
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <View style={styles.layout}>
          <ImageBackground
            source={{ uri: capaUrl.trim() || fallbackCapa }}
            style={styles.hero}
            imageStyle={styles.heroImage}
            fadeDuration={0}
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{nomeFantasia.trim() || "Sua Loja"}</Text>
              <Text style={styles.heroSub}>{categoria.trim() || "Categoria não definida"}</Text>
            </View>
          </ImageBackground>
          <TouchableOpacity style={[styles.mediaBtn, (uploadingCapa || saving) ? styles.disabledBtn : null]} onPress={() => void escolherImagemLoja("capa")} disabled={uploadingCapa || saving}>
            {uploadingCapa ? <ActivityIndicator color="#022c22" /> : <Text style={styles.mediaBtnText}>Enviar capa da loja</Text>}
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Identidade da Loja</Text>
            <Text style={styles.label}>Nome fantasia</Text>
            <TextInput style={styles.input} value={nomeFantasia} onChangeText={setNomeFantasia} placeholder="Nome da loja" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Categoria principal</Text>
            <TextInput style={styles.input} value={categoria} onChangeText={setCategoria} placeholder="Ex.: Material elétrico" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Capa da loja (URL)</Text>
            <TextInput style={styles.input} value={capaUrl} onChangeText={setCapaUrl} placeholder="https://..." placeholderTextColor="#64748b" autoCapitalize="none" />

            <Text style={styles.label}>Logo da loja (URL)</Text>
            <TextInput style={styles.input} value={logoUrl} onChangeText={setLogoUrl} placeholder="https://..." placeholderTextColor="#64748b" autoCapitalize="none" />
            <View style={styles.logoPreviewWrap}>
              {logoUrl.trim() ? <Image source={{ uri: logoUrl.trim() }} style={styles.logoPreview} /> : null}
              <TouchableOpacity style={[styles.mediaBtnSecondary, (uploadingLogo || saving) ? styles.disabledBtn : null]} onPress={() => void escolherImagemLoja("logo")} disabled={uploadingLogo || saving}>
                {uploadingLogo ? <ActivityIndicator color="#e2e8f0" /> : <Text style={styles.mediaBtnSecondaryText}>Enviar logo</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Descrição curta</Text>
            <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Resumo da sua proposta de valor" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Sobre a loja</Text>
            <TextInput
              style={[styles.input, styles.inputLg]}
              value={sobre}
              onChangeText={setSobre}
              placeholder="Conte sua história, diferenciais e atendimento."
              placeholderTextColor="#64748b"
              multiline
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contato Público</Text>
            <Text style={styles.label}>WhatsApp</Text>
            <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="(DDD) número" placeholderTextColor="#64748b" keyboardType="phone-pad" />

            <Text style={styles.label}>E-mail comercial</Text>
            <TextInput style={styles.input} value={emailPublico} onChangeText={setEmailPublico} placeholder="contato@lojafornecedor.com" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Instagram</Text>
            <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} placeholder="@sualoja" placeholderTextColor="#64748b" autoCapitalize="none" />

            <Text style={styles.label}>Site</Text>
            <TextInput style={styles.input} value={siteUrl} onChangeText={setSiteUrl} placeholder="https://sualoja.com" placeholderTextColor="#64748b" autoCapitalize="none" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Operação e Comercial</Text>
            <Text style={styles.label}>Raio de entrega (km)</Text>
            <TextInput style={styles.input} value={raio} onChangeText={(t) => setRaio(t.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="15" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Prazo de entrega</Text>
            <TextInput style={styles.input} value={prazoEntrega} onChangeText={setPrazoEntrega} placeholder="Ex.: 24h úteis" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Horário de funcionamento</Text>
            <TextInput style={styles.input} value={horario} onChangeText={setHorario} placeholder="Ex.: Seg-Sex 08h às 18h" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Pedido mínimo (R$)</Text>
            <TextInput style={styles.input} value={pedidoMinimo} onChangeText={setPedidoMinimo} placeholder="0,00" placeholderTextColor="#64748b" keyboardType="decimal-pad" />

            <Text style={styles.label}>Taxa de entrega (R$)</Text>
            <TextInput style={styles.input} value={taxaEntrega} onChangeText={setTaxaEntrega} placeholder="0,00" placeholderTextColor="#64748b" keyboardType="decimal-pad" />

            <Text style={styles.label}>Política de troca/devolução</Text>
            <TextInput
              style={[styles.input, styles.inputLg]}
              value={politicaTroca}
              onChangeText={setPoliticaTroca}
              placeholder="Regras de troca, devolução e atendimento pós-venda."
              placeholderTextColor="#64748b"
              multiline
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Documentação e Endereço</Text>
            <Text style={styles.label}>CNPJ</Text>
            <TextInput style={styles.input} value={cnpj} onChangeText={setCnpj} placeholder="Somente números" placeholderTextColor="#64748b" keyboardType="number-pad" />

            <Text style={styles.label}>Razão social</Text>
            <TextInput style={styles.input} value={razaoSocial} onChangeText={setRazaoSocial} placeholder="Razão social da empresa" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Endereço</Text>
            <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Rua, número, complemento" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Bairro</Text>
            <TextInput style={styles.input} value={bairro} onChangeText={setBairro} placeholder="Bairro" placeholderTextColor="#64748b" />

            <Text style={styles.label}>CEP</Text>
            <TextInput style={styles.input} value={cep} onChangeText={setCep} placeholder="Somente números" placeholderTextColor="#64748b" keyboardType="number-pad" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status da Loja</Text>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Loja ativa para novos pedidos</Text>
              <Switch value={ativo} onValueChange={setAtivo} thumbColor={ativo ? "#22c55e" : "#374151"} disabled={saving} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Mostrar loja como aberta agora</Text>
              <Switch value={abertoAgora} onValueChange={setAbertoAgora} thumbColor={abertoAgora ? "#22c55e" : "#374151"} disabled={saving} />
            </View>

            <TouchableOpacity style={[styles.saveBtn, (saving || uploadingCapa || uploadingLogo) ? styles.disabledBtn : null]} onPress={() => void salvar()} disabled={saving || uploadingCapa || uploadingLogo}>
              {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.saveBtnText}>Salvar configurações avançadas</Text>}
            </TouchableOpacity>
            {lastSavedAt ? <Text style={styles.savedAtText}>Última atualização: {lastSavedAt}</Text> : null}
          </View>
        </View>
      )}
    </PortalShell>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  layout: { gap: 12 },
  hero: { height: 170, borderRadius: 14, overflow: "hidden", justifyContent: "flex-end", borderWidth: 1, borderColor: "#1f2937" },
  heroImage: { borderRadius: 14 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.52)" },
  heroContent: { padding: 14 },
  heroTitle: { color: "#fff", fontWeight: "900", fontSize: 24 },
  heroSub: { color: "#e2e8f0", marginTop: 4, fontWeight: "700" },
  mediaBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: -2,
  },
  mediaBtnText: { color: "#022c22", fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 14 },
  sectionTitle: { color: "#facc15", fontWeight: "900", marginBottom: 10, fontSize: 16 },
  label: { color: "#cbd5e1", fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    color: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },
  inputLg: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  logoPreviewWrap: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  logoPreview: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  mediaBtnSecondary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#03040a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBtnSecondaryText: { color: "#e2e8f0", fontWeight: "800" },
  disabledBtn: { opacity: 0.6 },
  switchRow: { marginTop: 2, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  saveBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#022c22", fontWeight: "900" },
  savedAtText: { color: "#94a3b8", marginTop: 8, fontSize: 12, textAlign: "right" },
});
