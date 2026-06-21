import { supabase } from "@/lib/supabase";
import { useBranding } from "@/hooks/useBranding";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { AuthMarketingShell } from "@/components/shared/AuthMarketingShell";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhoneBr(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (base: string, weights: number[]) => {
    let total = 0;
    for (let i = 0; i < weights.length; i += 1) {
      total += Number(base[i]) * weights[i];
    }
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const dv1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv1 === Number(cnpj[12]) && dv2 === Number(cnpj[13]);
}

export default function CadastroFornecedor() {
  const router = useRouter();
  const { branding } = useBranding();
  const logoSource = branding.logoUrl ? { uri: branding.logoUrl } : require("../../assets/images/icons/icon.png");

  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");

  const cnpjValido = useMemo(() => isValidCnpj(cnpj), [cnpj]);

  useEffect(() => {
    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setSessionUserId(session.user.id);
        setSessionEmail(session.user.email ?? "");
      }
    }
    void carregarSessao();
  }, []);

  async function handleRegister() {
    const effectiveEmail = email.trim() || sessionEmail.trim();

    if (
      !nomeResponsavel.trim() ||
      !razaoSocial.trim() ||
      !nomeFantasia.trim() ||
      !cnpj.trim() ||
      !categoria.trim() ||
      !telefone.trim() ||
      !whatsapp.trim() ||
      !cidade.trim() ||
      !estado.trim() ||
      !effectiveEmail ||
      (!sessionUserId && !senha.trim())
    ) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!cnpjValido) {
      Alert.alert("CNPJ inválido", "Informe um CNPJ válido para concluir o cadastro.");
      return;
    }

    try {
      setLoading(true);
      let tenantId: string | null = null;
      const cnpjDigits = onlyDigits(cnpj);

      if (sessionUserId) {
        try {
          tenantId = await ensureCurrentUserTenantContext();
        } catch {
          try {
            tenantId = await getCurrentTenantId();
          } catch {
            tenantId = null;
          }
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: sessionUserId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            name: nomeResponsavel.trim(),
            role: "profissional",
            phone: onlyDigits(telefone),
            telefone: onlyDigits(telefone),
            whatsapp: onlyDigits(whatsapp),
            cidade: cidade.trim(),
            estado: estado.trim().toUpperCase(),
          });

        if (profileError) {
          Alert.alert("Erro", profileError.message);
          return;
        }

        const { error: profissionalError } = await supabase
          .from("profissionais")
          .upsert({
            user_id: sessionUserId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            ativo: true,
            disponivel: true,
            fornecedor_ativo: true,
            fornecedor_raio_km: 20,
            fornecedor_cnpj: cnpjDigits,
            fornecedor_razao_social: razaoSocial.trim(),
            fornecedor_nome_fantasia: nomeFantasia.trim(),
            fornecedor_categoria: categoria.trim(),
            fornecedor_descricao: descricao.trim() || null,
            updated_at: new Date().toISOString(),
          });

        if (profissionalError) {
          Alert.alert("Erro", profissionalError.message);
          return;
        }

        Alert.alert("Sucesso", "Fornecedor ativado com sucesso.");
        router.replace("/(fornecedor)");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: effectiveEmail,
        password: senha.trim(),
        options: {
          data: {
            name: nomeResponsavel.trim(),
            role: "profissional",
          },
        },
      });

      if (error) {
        if (String(error.message || "").toLowerCase().includes("already registered")) {
          Alert.alert(
            "Conta já existe",
            "Este email já está cadastrado. Faça login e ative o cadastro de fornecedor."
          );
          router.replace("/(auth)/login");
          return;
        }
        Alert.alert("Erro", error.message);
        return;
      }

      if (!data.user) {
        Alert.alert("Erro", "Usuário não criado.");
        return;
      }

      const userId = data.user.id;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          name: nomeResponsavel.trim(),
          role: "profissional",
          phone: onlyDigits(telefone),
          telefone: onlyDigits(telefone),
          whatsapp: onlyDigits(whatsapp),
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(),
        });

      if (profileError) {
        console.log("PROFILE UPSERT WARNING FORNECEDOR:", profileError);
      }

      const { error: profissionalError } = await supabase
        .from("profissionais")
        .upsert({
          user_id: userId,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          ativo: true,
          disponivel: true,
          fornecedor_ativo: true,
          fornecedor_raio_km: 20,
          fornecedor_cnpj: cnpjDigits,
          fornecedor_razao_social: razaoSocial.trim(),
          fornecedor_nome_fantasia: nomeFantasia.trim(),
          fornecedor_categoria: categoria.trim(),
          fornecedor_descricao: descricao.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (profissionalError) {
        Alert.alert("Erro", profissionalError.message);
        return;
      }

      Alert.alert("Sucesso", "Cadastro de fornecedor realizado com sucesso!");
      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Erro", "Erro inesperado ao cadastrar fornecedor.");
    } finally {
      setLoading(false);
    }
  }

  if (Platform.OS !== "web") {
    return (
      <ScrollView style={styles.mobileContainer} contentContainerStyle={styles.mobileContent}>
        <Image source={logoSource} style={styles.mobileLogo} resizeMode="contain" />
        <Text style={styles.mobileTitle}>Casa Mineira Serviços</Text>
        <Text style={styles.mobileSubtitle}>Cadastro Fornecedor</Text>

        <TextInput placeholder="Nome do responsável" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={nomeResponsavel} onChangeText={setNomeResponsavel} />
        <TextInput placeholder="Razão social" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={razaoSocial} onChangeText={setRazaoSocial} />
        <TextInput placeholder="Nome fantasia" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={nomeFantasia} onChangeText={setNomeFantasia} />
        <TextInput
          placeholder="CNPJ"
          placeholderTextColor="#9ca3af"
          style={[styles.mobileInput, cnpj.length > 0 && !cnpjValido ? styles.mobileInputError : null]}
          value={cnpj}
          onChangeText={(text) => setCnpj(formatCnpj(text))}
          keyboardType="numeric"
        />
        <Text style={[styles.mobileHelper, cnpj.length > 0 && !cnpjValido ? styles.mobileHelperError : null]}>
          {cnpj.length > 0 && !cnpjValido ? "CNPJ inválido." : "CNPJ obrigatório e validado."}
        </Text>
        <TextInput
          placeholder="Categoria de produtos"
          placeholderTextColor="#9ca3af"
          style={styles.mobileInput}
          value={categoria}
          onChangeText={setCategoria}
        />
        <Text style={styles.mobileHelper}>Ex.: material eletrico, tintas, acabamento.</Text>
        <TextInput
          placeholder="Descrição do fornecedor (opcional)"
          placeholderTextColor="#9ca3af"
          style={[styles.mobileInput, styles.mobileTextArea]}
          multiline
          textAlignVertical="top"
          value={descricao}
          onChangeText={setDescricao}
        />

        <Text style={styles.mobileSectionTitle}>Contato e localização</Text>
        <TextInput placeholder="Telefone" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={telefone} onChangeText={(text) => setTelefone(formatPhoneBr(text))} keyboardType="phone-pad" />
        <TextInput placeholder="WhatsApp" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={whatsapp} onChangeText={(text) => setWhatsapp(formatPhoneBr(text))} keyboardType="phone-pad" />
        <View style={styles.mobileRow}>
          <TextInput placeholder="Cidade" placeholderTextColor="#9ca3af" style={[styles.mobileInput, styles.mobileRowField]} value={cidade} onChangeText={setCidade} />
          <TextInput placeholder="UF" placeholderTextColor="#9ca3af" style={[styles.mobileInput, styles.mobileUfField]} value={estado} onChangeText={(text) => setEstado(text.toUpperCase().slice(0, 2))} autoCapitalize="characters" />
        </View>

        <Text style={styles.mobileSectionTitle}>Acesso</Text>
        <TextInput placeholder="Email" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={email} onChangeText={setEmail} autoCapitalize="none" />
        {!sessionUserId ? (
          <TextInput placeholder="Senha" placeholderTextColor="#9ca3af" style={styles.mobileInput} value={senha} onChangeText={setSenha} secureTextEntry />
        ) : null}

        <TouchableOpacity style={styles.mobileButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.mobileButtonText}>Cadastrar fornecedor</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.mobileLink}>Já tenho conta</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <AuthMarketingShell
      logoSource={logoSource}
      eyebrow="Fornecedor"
      title="Ative fornecedores com um fluxo próprio, empresarial e separado do restante do produto."
      description="Esse cadastro prepara a conta, o perfil operacional e os dados comerciais do fornecedor sem misturar os contextos de cliente, profissional ou SaaS."
      highlights={[
        "Dados empresariais e fiscais do fornecedor em um único fluxo",
        "Ativação de perfil operacional com contexto de fornecedor dedicado",
        "Entrada separada para o portal web do fornecedor",
      ]}
      footerActionLabel="Já tenho conta"
      onFooterAction={() => router.replace("/(auth)/login")}
    >
      <View style={styles.grid}>
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados da empresa</Text>

            <TextInput
              placeholder="Nome do responsável"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={nomeResponsavel}
              onChangeText={setNomeResponsavel}
            />

            <TextInput
              placeholder="Razão social"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={razaoSocial}
              onChangeText={setRazaoSocial}
            />

            <TextInput
              placeholder="Nome fantasia"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={nomeFantasia}
              onChangeText={setNomeFantasia}
            />

            <TextInput
              placeholder="CNPJ"
              placeholderTextColor="#64748b"
              style={[styles.input, cnpj.length > 0 && !cnpjValido ? styles.inputError : null]}
              value={cnpj}
              onChangeText={(text) => setCnpj(formatCnpj(text))}
              keyboardType="numeric"
            />
            <Text style={[styles.helper, cnpj.length > 0 && !cnpjValido ? styles.helperError : null]}>
              {cnpj.length > 0 && !cnpjValido ? "CNPJ inválido." : "CNPJ obrigatório e validado."}
            </Text>

            <TextInput
              placeholder="Categoria de produtos"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={categoria}
              onChangeText={setCategoria}
            />
            <Text style={styles.helper}>Ex.: material eletrico, tintas, acabamento.</Text>

            <TextInput
              placeholder="Descrição do fornecedor (opcional)"
              placeholderTextColor="#64748b"
              style={[styles.input, styles.textArea]}
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contato e localização</Text>

            <TextInput
              placeholder="Telefone"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={telefone}
              onChangeText={(text) => setTelefone(formatPhoneBr(text))}
              keyboardType="phone-pad"
            />

            <TextInput
              placeholder="WhatsApp"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={whatsapp}
              onChangeText={(text) => setWhatsapp(formatPhoneBr(text))}
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <TextInput
                placeholder="Cidade"
                placeholderTextColor="#64748b"
                style={[styles.input, styles.rowField]}
                value={cidade}
                onChangeText={setCidade}
              />
              <TextInput
                placeholder="UF"
                placeholderTextColor="#64748b"
                style={[styles.input, styles.ufField]}
                value={estado}
                onChangeText={(text) => setEstado(text.toUpperCase().slice(0, 2))}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acesso e ativação</Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              placeholder={sessionUserId ? "Senha já ativa na conta logada" : "Senha"}
              placeholderTextColor="#64748b"
              style={[styles.input, sessionUserId ? styles.inputDisabled : null]}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!sessionUserId}
            />

            <Text style={styles.helper}>
              {sessionUserId
                ? "Sessão atual detectada. O perfil de fornecedor será ativado nessa conta."
                : "Ao concluir, a conta e o perfil de fornecedor serão preparados automaticamente."}
            </Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: branding.primaryColor }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>{sessionUserId ? "Ativar fornecedor" : "Criar conta de fornecedor"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: "#020617",
  },
  mobileContent: {
    padding: 24,
    paddingBottom: 40,
  },
  mobileLogo: {
    width: 190,
    height: 190,
    alignSelf: "center",
    marginBottom: 2,
  },
  mobileTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  mobileSubtitle: {
    color: "#facc15",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  mobileInput: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  mobileInputError: {
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  mobileHelper: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 14,
  },
  mobileHelperError: {
    color: "#fca5a5",
  },
  mobileTextArea: {
    minHeight: 120,
    marginBottom: 22,
  },
  mobileSectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  mobileRow: {
    flexDirection: "row",
    gap: 10,
  },
  mobileRowField: {
    flex: 1,
  },
  mobileUfField: {
    width: 88,
  },
  mobileButton: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  mobileButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
  mobileLink: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
    minWidth: 320,
    gap: 18,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    padding: 24,
    gap: 12,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    color: "#e2e8f0",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  inputDisabled: {
    opacity: 0.55,
  },
  helper: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 20,
  },
  helperError: {
    color: "#fca5a5",
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowField: {
    flex: 1,
  },
  ufField: {
    width: 80,
  },
  button: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#020617",
    fontWeight: "900",
  },
});
