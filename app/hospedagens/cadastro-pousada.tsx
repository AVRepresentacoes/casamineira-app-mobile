import { supabase } from "@/lib/supabase";
import { registrarAceiteHospedagens } from "@/lib/caminhosHospedagens";
import { ensureCurrentUserTenantContext, getCurrentTenantId, resolvePublicSignupTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export default function CadastroPousadaHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [responsavel, setResponsavel] = useState("");
  const [nomePousada, setNomePousada] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("MG");
  const [endereco, setEndereco] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [descricao, setDescricao] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resolveTenantForSignup() {
    try {
      return (await resolvePublicSignupTenantId()) || (await ensureCurrentUserTenantContext());
    } catch {
      try {
        return await getCurrentTenantId();
      } catch {
        return null;
      }
    }
  }

  async function handleCreateAccount() {
    if (
      !responsavel.trim() ||
      !nomePousada.trim() ||
      !cnpj.trim() ||
      !cidade.trim() ||
      !uf.trim() ||
      !endereco.trim() ||
      !whatsapp.trim() ||
      !email.trim() ||
      !senha.trim()
    ) {
      Alert.alert("Dados obrigatórios", "Preencha os dados da pousada, responsável, contato e acesso.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Aceite obrigatório", "Leia e aceite o contrato e as políticas da pousada para enviar o cadastro.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha.trim(),
        options: {
          data: {
            name: responsavel.trim(),
            role: "fornecedor",
            app: "hospedagens-caminhos-da-fe",
            nome_pousada: nomePousada.trim(),
          },
        },
      });

      if (error) {
        const message = String(error.message || "").toLowerCase();
        if (message.includes("already") || message.includes("registered")) {
          Alert.alert(
            "Email já cadastrado",
            "Esse email já tem uma conta no app. Entre com sua senha ou use outro email para cadastrar uma nova pousada.",
            [
              { text: "Usar outro email", style: "cancel" },
              { text: "Ir para login", onPress: () => router.replace("/(auth)/login") },
            ],
          );
          return;
        }

        Alert.alert("Erro no cadastro", error.message);
        return;
      }

      if (!data.user) {
        Alert.alert("Erro", "Não foi possível criar a conta da pousada.");
        return;
      }

      const tenantId = await resolveTenantForSignup();
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        name: responsavel.trim(),
        role: "profissional",
        phone: onlyDigits(whatsapp),
        telefone: onlyDigits(whatsapp),
        whatsapp: onlyDigits(whatsapp),
        cidade: cidade.trim(),
        estado: uf.trim().toUpperCase(),
      });

      if (profileError) {
        console.log("HOSPEDAGENS POUSADA PROFILE WARNING:", profileError.message);
      }

      const { error: fornecedorError } = await supabase.from("profissionais").upsert({
        user_id: data.user.id,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        ativo: true,
        disponivel: true,
        fornecedor_ativo: true,
        fornecedor_raio_km: 5,
        fornecedor_cnpj: onlyDigits(cnpj),
        fornecedor_razao_social: nomePousada.trim(),
        fornecedor_nome_fantasia: nomePousada.trim(),
        fornecedor_categoria: "Hospedagem Caminho da Fé",
        fornecedor_descricao: descricao.trim() || `Pousada em ${cidade.trim()} - ${uf.trim().toUpperCase()}. ${endereco.trim()}`,
        updated_at: new Date().toISOString(),
      });

      if (fornecedorError) {
        Alert.alert("Atenção", fornecedorError.message);
        return;
      }

      await registrarAceiteHospedagens({
        papel: "pousada",
        documentos: ["contrato_pousada", "politicas_pousada", "politica_privacidade"],
      });
      Alert.alert("Cadastro enviado", "Sua pousada foi cadastrada para validação no Hospedagens Caminhos da Fé.", [
        { text: "Entrar", onPress: () => router.replace("/(auth)/login") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Parceiro de hospedagem</Text>
          <Text style={styles.title}>Cadastrar hotel ou pousada</Text>
        </View>
      </View>

      <View style={styles.brandCard}>
        <Image source={require("../../assets/images/hospedagens-caminhos-da-fe/icon.png")} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Receba peregrinos com reserva segura</Text>
          <Text style={styles.brandText}>Sinal de 50%, política clara e estrutura pronta para split payment.</Text>
        </View>
      </View>

      <FormSection title="Responsável e acesso">
        <Field label="Nome do responsável" value={responsavel} onChangeText={setResponsavel} placeholder="Nome completo" />
        <Field label="Email de acesso" value={email} onChangeText={setEmail} placeholder="pousada@exemplo.com" autoCapitalize="none" keyboardType="email-address" />
        <Field label="Senha" value={senha} onChangeText={setSenha} placeholder="Crie uma senha segura" secureTextEntry />
      </FormSection>

      <FormSection title="Dados da pousada">
        <Field label="Nome do hotel/pousada" value={nomePousada} onChangeText={setNomePousada} placeholder="Ex.: Pousada Caminho da Serra" />
        <Field label="CNPJ" value={cnpj} onChangeText={setCnpj} placeholder="00.000.000/0000-00" keyboardType="number-pad" />
        <Field label="WhatsApp comercial" value={whatsapp} onChangeText={setWhatsapp} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <View style={styles.rowFields}>
          <View style={{ flex: 1 }}>
            <Field label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Cidade" />
          </View>
          <View style={{ width: 84 }}>
            <Field label="UF" value={uf} onChangeText={(value) => setUf(value.toUpperCase().slice(0, 2))} placeholder="MG" autoCapitalize="characters" />
          </View>
        </View>
        <Field label="Endereço" value={endereco} onChangeText={setEndereco} placeholder="Rua, número, bairro" />
        <Field label="Descrição para avaliação" value={descricao} onChangeText={setDescricao} placeholder="Café, quartos, bike, jantar, lavanderia..." multiline />
      </FormSection>

      <View style={styles.policyBox}>
        <Text style={styles.policyTitle}>Condições do parceiro</Text>
        <Text style={styles.policyText}>As condições comerciais, regras de repasse, cancelamentos e responsabilidades ficam reunidas em uma tela própria para leitura antes do envio.</Text>
        <Pressable style={styles.policyButton} onPress={() => router.push("/hospedagens/politicas-pousada")}>
          <Text style={styles.policyButtonText}>Ver políticas para pousadas</Text>
          <Ionicons name="chevron-forward" size={17} color="#12372A" />
        </Pressable>
      </View>

      <Pressable style={styles.acceptBox} onPress={() => setAcceptedTerms((current) => !current)}>
        <Ionicons name={acceptedTerms ? "checkbox" : "square-outline"} size={22} color="#F7D58B" />
        <View style={{ flex: 1 }}>
          <Text style={styles.acceptText}>Li e aceito o Contrato da Pousada, políticas comerciais, regras de comissão, repasse, cancelamento e multa operacional.</Text>
          <Pressable onPress={() => router.push("/hospedagens/politicas-pousada")}>
            <Text style={styles.acceptLink}>Ver contrato e políticas</Text>
          </Pressable>
        </View>
      </Pressable>

      <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={handleCreateAccount} disabled={loading}>
        {loading ? <ActivityIndicator color="#12372A" /> : <Text style={styles.primaryButtonText}>Enviar cadastro da pousada</Text>}
      </Pressable>
    </ScrollView>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} multiline={multiline} placeholderTextColor="#8A7B61" style={[styles.input, multiline && styles.textArea]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  brandCard: { flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: "#12372A", borderRadius: 8, padding: 16 },
  logo: { width: 72, height: 72, borderRadius: 8 },
  brandTitle: { color: "#FFF9EA", fontSize: 18, fontWeight: "900" },
  brandText: { color: "#F7D58B", marginTop: 4, lineHeight: 20 },
  formSection: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  sectionTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  field: { gap: 6 },
  fieldLabel: { color: "#315342", fontSize: 13, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A", fontSize: 15 },
  textArea: { minHeight: 98, paddingTop: 12, textAlignVertical: "top" },
  rowFields: { flexDirection: "row", gap: 10 },
  policyBox: { backgroundColor: "#12372A", borderRadius: 8, padding: 16, gap: 8 },
  policyTitle: { color: "#F7D58B", fontSize: 18, fontWeight: "900" },
  policyText: { color: "#FFF9EA", lineHeight: 21 },
  policyButton: { minHeight: 42, borderRadius: 8, backgroundColor: "#F7D58B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  policyButtonText: { color: "#12372A", fontWeight: "900" },
  acceptBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#12372A", borderRadius: 8, padding: 14 },
  acceptText: { color: "#FFF9EA", lineHeight: 20, fontWeight: "800" },
  acceptLink: { color: "#F7D58B", marginTop: 5, fontWeight: "900" },
  primaryButton: { minHeight: 54, borderRadius: 8, backgroundColor: "#D8A84F", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
