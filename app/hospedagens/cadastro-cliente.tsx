import { setActiveRole } from "@/lib/auth";
import { registrarAceiteHospedagens } from "@/lib/caminhosHospedagens";
import { supabase } from "@/lib/supabase";
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

export default function CadastroClienteHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
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
    if (!nome.trim() || !email.trim() || !telefone.trim() || !cidade.trim() || !senha.trim()) {
      Alert.alert("Dados obrigatórios", "Preencha nome, email, telefone, cidade e senha.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Aceite obrigatório", "Leia e aceite os termos do cliente e a política de privacidade para criar sua conta.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha.trim(),
        options: {
          data: {
            name: nome.trim(),
            role: "cliente",
            app: "hospedagens-caminhos-da-fe",
          },
        },
      });

      if (error) {
        const message = String(error.message || "").toLowerCase();
        if (message.includes("already") || message.includes("registered")) {
          Alert.alert(
            "Email já cadastrado",
            "Esse email já tem uma conta no app. Entre com sua senha ou use outro email para criar um novo cadastro.",
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
        Alert.alert("Erro", "Não foi possível criar sua conta.");
        return;
      }

      const tenantId = await resolveTenantForSignup();
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        name: nome.trim(),
        role: "cliente",
        phone: telefone.trim(),
        telefone: telefone.trim(),
        cidade: cidade.trim(),
      });

      if (profileError) {
        console.log("HOSPEDAGENS CLIENTE PROFILE WARNING:", profileError.message);
      }

      await registrarAceiteHospedagens({
        papel: "cliente",
        documentos: ["termos_cliente", "politica_privacidade"],
      });
      await setActiveRole("cliente");
      Alert.alert("Conta criada", "Seu cadastro de peregrino foi criado com sucesso.", [
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
          <Text style={styles.eyebrow}>Hospedagens Caminhos da Fé</Text>
          <Text style={styles.title}>Criar conta de cliente</Text>
        </View>
      </View>

      <Pressable style={styles.acceptBox} onPress={() => setAcceptedTerms((current) => !current)}>
        <Ionicons name={acceptedTerms ? "checkbox" : "square-outline"} size={22} color="#12372A" />
        <View style={{ flex: 1 }}>
          <Text style={styles.acceptText}>Li e aceito os Termos do Cliente e a Política de Privacidade.</Text>
          <Pressable onPress={() => router.push("/hospedagens/politicas-cliente")}>
            <Text style={styles.acceptLink}>Ver termos e políticas</Text>
          </Pressable>
        </View>
      </Pressable>

      <View style={styles.brandCard}>
        <Image source={require("../../assets/images/hospedagens-caminhos-da-fe/icon.png")} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Sua jornada mais organizada</Text>
          <Text style={styles.brandText}>Reserve pousadas, acompanhe seus gastos e registre sua caminhada até Aparecida.</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Field label="Nome completo" value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" autoCapitalize="none" keyboardType="email-address" />
        <Field label="Telefone/WhatsApp" value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <Field label="Cidade de origem" value={cidade} onChangeText={setCidade} placeholder="Ex.: Ouro Fino - MG" />
        <Field label="Senha" value={senha} onChangeText={setSenha} placeholder="Crie uma senha segura" secureTextEntry />
      </View>

      <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={handleCreateAccount} disabled={loading}>
        {loading ? <ActivityIndicator color="#12372A" /> : <Text style={styles.primaryButtonText}>Criar minha conta</Text>}
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} placeholderTextColor="#8A7B61" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 26, fontWeight: "900" },
  brandCard: { flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: "#12372A", borderRadius: 8, padding: 16 },
  logo: { width: 72, height: 72, borderRadius: 8 },
  brandTitle: { color: "#FFF9EA", fontSize: 18, fontWeight: "900" },
  brandText: { color: "#F7D58B", marginTop: 4, lineHeight: 20 },
  form: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { color: "#315342", fontSize: 13, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A", fontSize: 15 },
  acceptBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 12 },
  acceptText: { color: "#12372A", lineHeight: 20, fontWeight: "800" },
  acceptLink: { color: "#4E7C59", marginTop: 4, fontWeight: "900" },
  primaryButton: { minHeight: 54, borderRadius: 8, backgroundColor: "#D8A84F", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  secondaryButton: { alignItems: "center", paddingVertical: 8 },
  secondaryButtonText: { color: "#12372A", fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
