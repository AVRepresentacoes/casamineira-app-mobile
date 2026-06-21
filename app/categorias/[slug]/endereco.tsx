import { buildTechnicalSummary } from "@/lib/serviceQuestionnaire";
import { Ionicons } from "@expo/vector-icons";
import { assertEmpresaCanPerform } from "@/lib/saas-commercial";
import { supabase } from "@/lib/supabase";
import { dispararPedidoRapido } from "@/lib/chamadosRapidos";
import { getCurrentTenantId } from "@/lib/tenant";
import TipoAtendimentoCard from "@/components/rapid/TipoAtendimentoCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EnderecoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { categoria, servico, descricao, questionario } = useLocalSearchParams();

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tipoAtendimento, setTipoAtendimento] = useState<"orcamento" | "rapido">("orcamento");

  async function buscarCep(valor: string) {
    const cepLimpo = valor.replace(/\D/g, "");
    setCep(valor);

    if (cepLimpo.length !== 8) return;

    try {
      setLoadingCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert("CEP não encontrado");
        return;
      }

      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.localidade);
      setEstado(data.uf);
    } catch {
      Alert.alert("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  async function enviarPedido() {
    if (enviando) return;
    if (!numero.trim()) {
      Alert.alert("Informe o número do endereço");
      return;
    }

    const categoriaStr = typeof categoria === "string" ? categoria : "";
    const servicoStr = typeof servico === "string" ? servico : "";
    const descricaoStr = typeof descricao === "string" ? descricao : "";

    if (!categoriaStr.trim() || !servicoStr.trim() || !descricaoStr.trim()) {
      Alert.alert("Dados incompletos", "Preencha categoria, serviço e descrição.");
      return;
    }

    let questoes: Record<string, string> = {};
    if (typeof questionario === "string" && questionario.trim()) {
      try {
        questoes = JSON.parse(questionario);
      } catch {
        questoes = {};
      }
    }

    const resumoTecnico = buildTechnicalSummary(questoes);

    const descricaoFinal = resumoTecnico
      ? `${descricaoStr.trim()}\n\nDetalhes técnicos do serviço:\n${resumoTecnico}`
      : descricaoStr.trim();

    try {
      setEnviando(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        Alert.alert("Erro", "Usuário não autenticado.");
        return;
      }
      const tenantId = await getCurrentTenantId();
      await assertEmpresaCanPerform("create_pedido");

      const { data: pedidoCriado, error } = await supabase.from("pedidos").insert({
        tenant_id: tenantId,
        cliente_id: session.user.id,
        categoria: categoriaStr.trim(),
        servico: servicoStr.trim(),
        descricao: descricaoFinal,
        status: "aguardando_proposta",
        tipo_atendimento: tipoAtendimento,
        status_disparo: tipoAtendimento === "rapido" ? "pendente" : null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
      }).select("id").single();

      if (error) {
        console.log("ERRO INSERT ENDERECO:", error);
        Alert.alert("Erro ao criar pedido", error.message);
        return;
      }

      let profissionaisDisparados = 0;
      if (tipoAtendimento === "rapido" && pedidoCriado?.id) {
        try {
          profissionaisDisparados = await dispararPedidoRapido(String(pedidoCriado.id), {
            raioKm: 15,
            limite: 5,
            janelaMinutos: 10,
          });
        } catch (dispatchError: any) {
          console.log("ERRO DISPARO RAPIDO ENDERECO:", dispatchError);
        }
      }

      router.replace({
        pathname: "/(cliente)/pedidos/criar/enviado",
        params: {
          modo: tipoAtendimento,
          disparados: String(profissionaisDisparados),
        },
      });
    } catch (err) {
      console.log("ERRO INESPERADO ENDERECO:", err);
      Alert.alert("Erro", "Não foi possível enviar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Endereço do Serviço</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>CEP</Text>
        <View style={styles.cepContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite seu CEP"
            keyboardType="numeric"
            value={cep}
            onChangeText={buscarCep}
          />
          {loadingCep && <ActivityIndicator size="small" color="#2563eb" />}
        </View>

        <Text style={styles.label}>Rua / Logradouro</Text>
        <TextInput style={styles.input} placeholder="Ex: Rua das Palmeiras" value={logradouro} onChangeText={setLogradouro} />

        <Text style={styles.label}>Número</Text>
        <TextInput style={styles.input} placeholder="Ex: 123" value={numero} onChangeText={setNumero} keyboardType="numeric" />

        <Text style={styles.label}>Ponto de referência / Complemento</Text>
        <TextInput style={styles.input} placeholder="Ex: Próximo ao mercado" value={complemento} onChangeText={setComplemento} />

        <Text style={styles.label}>Bairro</Text>
        <TextInput style={styles.input} placeholder="Ex: Centro" value={bairro} onChangeText={setBairro} />

        <Text style={styles.label}>Cidade</Text>
        <TextInput style={styles.input} placeholder="Ex: São Paulo" value={cidade} onChangeText={setCidade} />

        <Text style={styles.label}>Estado</Text>
        <TextInput style={styles.input} placeholder="Ex: SP" value={estado} onChangeText={setEstado} />

        <View style={styles.securityBox}>
          <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
          <Text style={styles.securityText}>Seus dados são protegidos e utilizados apenas para execução do serviço.</Text>
        </View>

        <View style={styles.modoBox}>
          <Text style={styles.modoTitle}>Receba propostas ou peça atendimento rápido</Text>
          <Text style={styles.modoSubtitle}>Escolha uma opção por vez para este pedido.</Text>

          <TipoAtendimentoCard
            title="Receber propostas"
            description="Profissionais analisam seu pedido e enviam propostas para você escolher a melhor opção."
            badge="Mais opções"
            selected={tipoAtendimento === "orcamento"}
            onPress={() => setTipoAtendimento("orcamento")}
            icon="document-text-outline"
          />

          <TipoAtendimentoCard
            title="Atendimento rápido"
            description="Seu pedido será enviado para profissionais próximos e disponíveis. O primeiro que aceitar assume o chamado."
            badge="Mais rápido"
            selected={tipoAtendimento === "rapido"}
            onPress={() => setTipoAtendimento("rapido")}
            icon="flash-outline"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.nextButton, enviando && { opacity: 0.7 }]} onPress={enviarPedido} disabled={enviando}>
          {enviando ? <ActivityIndicator color="#000" /> : <Text style={styles.nextText}>Enviar Pedido</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: {
    backgroundColor: "#0f172a",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 20, paddingBottom: 140 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  cepContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#334155" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 15,
    borderRadius: 14,
    marginTop: 10,
  },
  securityText: { marginLeft: 10, flex: 1, color: "#065f46", fontSize: 13 },
  modoBox: {
    marginTop: 14,
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  modoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  modoSubtitle: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 12,
    color: "#94a3b8",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  backButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 25,
    width: "45%",
    alignItems: "center",
  },
  backText: { color: "#fff", fontWeight: "bold" },
  nextButton: {
    backgroundColor: "#facc15",
    paddingVertical: 16,
    borderRadius: 25,
    width: "45%",
    alignItems: "center",
  },
  nextText: { color: "#000", fontWeight: "bold" },
});
