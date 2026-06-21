import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type PerfilCliente = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  rua?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  cidade_nome?: string | null;
  estado?: string | null;
  uf?: string | null;
  role?: string | null;
  verificado?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatarTelefoneBR(valor: string) {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 11);

  if (!digitos) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export default function MeusDadosScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [membroDesde, setMembroDesde] = useState("-");
  const [ultimoLogin, setUltimoLogin] = useState("-");
  const [atualizadoEm, setAtualizadoEm] = useState("-");
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [pedidosEmAndamento, setPedidosEmAndamento] = useState(0);
  const [pedidosFinalizados, setPedidosFinalizados] = useState(0);
  const [propostasNaoLidas, setPropostasNaoLidas] = useState(0);
  const [pagamentosAprovados, setPagamentosAprovados] = useState(0);
  const [valorTotalPago, setValorTotalPago] = useState(0);
  const [percentualPerfil, setPercentualPerfil] = useState(0);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        router.replace("/(auth)/login");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      setVerificado(Boolean(session.user.email_confirmed_at));
      setMembroDesde(
        session.user.created_at
          ? new Date(session.user.created_at).toLocaleDateString("pt-BR")
          : "-"
      );
      setUltimoLogin(
        session.user.last_sign_in_at
          ? new Date(session.user.last_sign_in_at).toLocaleString("pt-BR")
          : "-"
      );
      const tenantId = await resolveCurrentTenantId();

      let profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id);
      if (tenantId) {
        profileQuery = profileQuery.eq("tenant_id", tenantId);
      }
      const { data, error } = await profileQuery.maybeSingle();

      if (error) {
        console.log("ERRO AO CARREGAR MEUS DADOS:", error);
        Alert.alert("Erro", "Não foi possível carregar seus dados.");
        return;
      }

      const perfil = (data as PerfilCliente | null) ?? null;
      setNome(perfil?.name ?? "");
      setTelefone(formatarTelefoneBR(String(perfil?.phone || perfil?.telefone || "")));
      setWhatsapp(formatarTelefoneBR(String(perfil?.whatsapp || "")));
      setRua(String(perfil?.rua || perfil?.logradouro || ""));
      setNumero(String(perfil?.numero || ""));
      setBairro(String(perfil?.bairro || ""));
      setCidade(String(perfil?.cidade || perfil?.cidade_nome || ""));
      setEstado(String(perfil?.estado || perfil?.uf || ""));
      setVerificado(Boolean(perfil?.verificado ?? session.user.email_confirmed_at));
      setAtualizadoEm(
        perfil?.updated_at
          ? new Date(perfil.updated_at).toLocaleString("pt-BR")
          : "Ainda não atualizado"
      );

      let pedidosQuery = supabase
        .from("pedidos")
        .select("id, status")
        .eq("cliente_id", session.user.id);
      if (tenantId) {
        pedidosQuery = pedidosQuery.eq("tenant_id", tenantId);
      }
      const { data: pedidosData } = await pedidosQuery;

      const listaPedidos = ((pedidosData as { id: string; status?: string | null }[] | null) ?? []);
      setTotalPedidos(listaPedidos.length);
      setPedidosFinalizados(listaPedidos.filter((item) => item.status === "finalizado").length);
      setPedidosEmAndamento(
        listaPedidos.filter((item) =>
          ["aguardando_proposta", "proposta_recebida", "aceita", "em_execucao"].includes(
            String(item.status || "")
          )
        ).length
      );

      let propostasQuery = supabase
        .from("propostas")
        .select("id, pedidos!inner(cliente_id)", {
          count: "exact",
          head: true,
        })
        .eq("pedidos.cliente_id", session.user.id)
        .eq("lida_cliente", false);
      if (tenantId) {
        propostasQuery = propostasQuery.eq("tenant_id", tenantId);
      }
      const { count: propostasNaoLidasCount } = await propostasQuery;

      setPropostasNaoLidas(Number(propostasNaoLidasCount || 0));

      let pagamentosQuery = supabase
        .from("pagamentos")
        .select("status_pagamento, valor_total")
        .limit(100);
      if (tenantId) {
        pagamentosQuery = pagamentosQuery.eq("tenant_id", tenantId);
      }
      const { data: pagamentosData } = await pagamentosQuery;

      const listaPagamentos = ((pagamentosData as {
        status_pagamento?: string | null;
        valor_total?: number | null;
      }[] | null) ?? []);

      setPagamentosAprovados(
        listaPagamentos.filter((item) => item.status_pagamento === "aprovada").length
      );
      setValorTotalPago(
        listaPagamentos
          .filter((item) => item.status_pagamento === "aprovada")
          .reduce((acc, item) => acc + Number(item.valor_total || 0), 0)
      );

      const camposPreenchidos = [
        Boolean((perfil?.name || "").trim()),
        Boolean((perfil?.phone || perfil?.telefone || "").trim()),
        Boolean((perfil?.rua || perfil?.logradouro || "").trim()),
        Boolean((perfil?.numero || "").trim()),
        Boolean((perfil?.bairro || "").trim()),
        Boolean((perfil?.cidade || perfil?.cidade_nome || "").trim()),
        Boolean((perfil?.estado || perfil?.uf || "").trim()),
        Boolean((perfil?.whatsapp || "").trim()),
        Boolean(session.user.email),
        Boolean(perfil?.verificado ?? session.user.email_confirmed_at),
      ].filter(Boolean).length;
      const totalCampos = 11;
      setPercentualPerfil(Math.round((camposPreenchidos / totalCampos) * 100));
    } catch (error) {
      console.log("ERRO INESPERADO MEUS DADOS:", error);
      Alert.alert("Erro", "Ocorreu um erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void carregarDados();
    }, [carregarDados])
  );

  async function salvarDados() {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado.");
      return;
    }

    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe seu nome.");
      return;
    }

    try {
      setSalvando(true);
      const tentativasPayload: Record<string, string | null>[] = [
        {
          name: nome.trim(),
          phone: telefone.trim() || null,
          telefone: telefone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          rua: rua.trim() || null,
          logradouro: rua.trim() || null,
          numero: numero.trim() || null,
          bairro: bairro.trim() || null,
          cidade: cidade.trim() || null,
          cidade_nome: cidade.trim() || null,
          estado: estado.trim() || null,
          uf: estado.trim() || null,
        },
        {
          name: nome.trim(),
          phone: telefone.trim() || null,
          telefone: telefone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          cidade: cidade.trim() || null,
          cidade_nome: cidade.trim() || null,
          estado: estado.trim() || null,
          uf: estado.trim() || null,
        },
        {
          name: nome.trim(),
          phone: telefone.trim() || null,
          telefone: telefone.trim() || null,
          cidade: cidade.trim() || null,
        },
        {
          name: nome.trim(),
        },
      ];

      let error: { code?: string; message?: string } | null = null;
      for (const payload of tentativasPayload) {
        const tentativa = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", userId);

        error = tentativa.error as { code?: string; message?: string } | null;
        if (!error) break;

        const erroDeColuna =
          error.code === "42703" ||
          /column|coluna .* does not exist|nao existe/i.test(String(error.message || ""));

        if (!erroDeColuna) {
          break;
        }
      }

      if (error) {
        console.log("ERRO AO SALVAR DADOS:", error);
        Alert.alert("Erro", "Não foi possível salvar seus dados.");
        return;
      }

      Alert.alert("Sucesso", "Dados atualizados com sucesso.");
      setEditando(false);
      await carregarDados();
    } catch (error) {
      console.log("ERRO INESPERADO AO SALVAR:", error);
      Alert.alert("Erro", "Ocorreu um erro ao salvar os dados.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  const moeda = (valor: number) => `R$ ${Number(valor || 0).toFixed(2)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/(tabs)/perfil");
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#facc15" />
        </TouchableOpacity>
        <Text style={styles.title}>Meus dados</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Perfil premium</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{verificado ? "Verificada" : "Pendente"}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{percentualPerfil}%</Text>
            <Text style={styles.metricLabel}>Perfil completo</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalPedidos}</Text>
            <Text style={styles.metricLabel}>Pedidos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{propostasNaoLidas}</Text>
            <Text style={styles.metricLabel}>Propostas não lidas</Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${percentualPerfil}%` }]} />
        </View>
        <Text style={styles.progressLabel}>Complete seus dados para melhorar atendimento e segurança.</Text>

        <View style={styles.divider} />
        <Text style={styles.blockTitle}>Identidade e contato</Text>

        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="Seu nome"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          editable={false}
          style={[styles.input, styles.inputDisabled]}
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          value={telefone}
          onChangeText={(texto) => setTelefone(formatarTelefoneBR(texto))}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="(00) 00000-0000"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          value={whatsapp}
          onChangeText={(texto) => setWhatsapp(formatarTelefoneBR(texto))}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="(00) 00000-0000"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Cidade</Text>
        <TextInput
          value={cidade}
          onChangeText={setCidade}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="Sua cidade"
          placeholderTextColor="#6b7280"
        />

        <View style={styles.divider} />
        <Text style={styles.blockTitle}>Endereço completo</Text>

        <Text style={styles.label}>Rua / Logradouro</Text>
        <TextInput
          value={rua}
          onChangeText={setRua}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="Ex: Rua das Palmeiras"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Número</Text>
        <TextInput
          value={numero}
          onChangeText={setNumero}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="Ex: 123"
          placeholderTextColor="#6b7280"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Bairro</Text>
        <TextInput
          value={bairro}
          onChangeText={setBairro}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="Ex: Centro"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Estado</Text>
        <TextInput
          value={estado}
          onChangeText={setEstado}
          editable={editando}
          style={[styles.input, !editando && styles.inputDisabled]}
          placeholder="Ex: PA"
          placeholderTextColor="#6b7280"
          autoCapitalize="characters"
          maxLength={2}
        />

        <View style={styles.divider} />
        <Text style={styles.blockTitle}>Conta e segurança</Text>
        <Text style={styles.metaText}>Tipo de conta: cliente</Text>
        <Text style={styles.metaText}>Conta verificada: {verificado ? "Sim" : "Não"}</Text>
        <Text style={styles.metaText}>Membro desde: {membroDesde}</Text>
        <Text style={styles.metaText}>Último login: {ultimoLogin}</Text>
        <Text style={styles.metaText}>Última atualização: {atualizadoEm}</Text>

        <View style={styles.divider} />
        <Text style={styles.blockTitle}>Resumo de uso</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pedidosEmAndamento}</Text>
            <Text style={styles.summaryLabel}>Pedidos em andamento</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pedidosFinalizados}</Text>
            <Text style={styles.summaryLabel}>Pedidos finalizados</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pagamentosAprovados}</Text>
            <Text style={styles.summaryLabel}>Pagamentos aprovados</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{moeda(valorTotalPago)}</Text>
            <Text style={styles.summaryLabel}>Total já pago</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.blockTitle}>Atalhos da conta</Text>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/(tabs)/pedidos")}
        >
          <Text style={styles.quickActionTitle}>Meus pedidos</Text>
          <Text style={styles.quickActionSub}>Acompanhar serviços e andamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/(cliente)/pedidos/propostas")}
        >
          <Text style={styles.quickActionTitle}>Propostas recebidas</Text>
          <Text style={styles.quickActionSub}>Ver respostas de profissionais</Text>
        </TouchableOpacity>

        {!editando ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setEditando(true)}
          >
            <Text style={styles.primaryButtonText}>Alterar meus dados</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.flexButton]}
              onPress={() => {
                setEditando(false);
                carregarDados();
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.flexButton]}
              onPress={salvarDados}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteLink}
        onPress={() => router.push("/(tabs)/cancelamento-conta")}
      >
        <Text style={styles.deleteLinkText}>Excluir minha conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    backgroundColor: "#03040a",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    marginRight: 10,
  },
  title: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#111827",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  blockTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    marginBottom: 6,
    fontSize: 15,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metricValue: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#111827",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },
  progressLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginVertical: 14,
  },
  badge: {
    backgroundColor: "#111827",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  badgeText: {
    color: "#d1d5db",
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1f2937",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputDisabled: {
    opacity: 0.8,
  },
  metaText: {
    color: "#9ca3af",
    marginTop: 12,
    fontSize: 13,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryItem: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 10,
  },
  summaryValue: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 14,
  },
  summaryLabel: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 11,
  },
  quickAction: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  quickActionTitle: {
    color: "#fff",
    fontWeight: "800",
  },
  quickActionSub: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 3,
  },
  primaryButton: {
    backgroundColor: "#facc15",
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#000",
    fontWeight: "800",
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
    marginTop: 0,
  },
  secondaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  deleteLink: {
    marginTop: 24,
    alignItems: "center",
  },
  deleteLinkText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
});
