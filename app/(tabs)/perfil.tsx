import { logout, setActiveRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PerfilCliente = {
  id?: string;
  name?: string | null;
  role?: string | null;
  phone?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  cidade_nome?: string | null;
  media_avaliacao?: number | null;
  media_avaliacoes?: number | null;
  total_avaliacoes?: number | null;
  plano_ativo?: boolean | null;
  verificado?: boolean | null;
};

type PedidoResumo = {
  id: string;
  status: string | null;
  created_at?: string | null;
};

function formatarTelefoneBR(valor: string) {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "Não cadastrado";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export default function Perfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("Cliente");
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState("Plano Gratuito");
  const [avaliacao, setAvaliacao] = useState(0);
  const [pedidos, setPedidos] = useState(0);
  const [finalizados, setFinalizados] = useState(0);
  const [emAndamento, setEmAndamento] = useState(0);
  const [cancelados, setCancelados] = useState(0);
  const [verificado, setVerificado] = useState(false);
  const [telefone, setTelefone] = useState("Não cadastrado");
  const [cidade, setCidade] = useState("Não informada");
  const [propostasRecebidas, setPropostasRecebidas] = useState(0);
  const [propostasNaoLidas, setPropostasNaoLidas] = useState(0);
  const [pagamentosAprovados, setPagamentosAprovados] = useState(0);
  const [pagamentosPendentes, setPagamentosPendentes] = useState(0);
  const [totalInvestido, setTotalInvestido] = useState(0);
  const [ultimoPedidoEm, setUltimoPedidoEm] = useState("Sem pedidos ainda");
  const [ultimaAtividadeEm, setUltimaAtividadeEm] = useState("-");

  const carregarPerfilCliente = useCallback(async () => {
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

      const user = session.user;
      const tenantId = await resolveCurrentTenantId();
      setEmail(user.email ?? "");

      let profileQuery = supabase.from("profiles").select("*").eq("id", user.id);
      if (tenantId) {
        profileQuery = profileQuery.eq("tenant_id", tenantId);
      }
      const { data: profileData, error: profileError } = await profileQuery.maybeSingle();

      if (profileError) {
        console.log("ERRO AO BUSCAR PERFIL DO CLIENTE:", profileError);
      }

      const profile = (profileData as PerfilCliente | null) ?? null;

      const nomePerfil = profile?.name?.trim();

      setNome(nomePerfil || (user.email ? user.email.split("@")[0] : "Cliente"));
      setPlano(profile?.plano_ativo ? "👑 Plano Premium" : "Plano Gratuito");
      setAvaliacao(
        Number(profile?.media_avaliacao ?? profile?.media_avaliacoes ?? 0)
      );
      setVerificado(Boolean(profile?.verificado ?? user.email_confirmed_at));
      setTelefone(formatarTelefoneBR(String(profile?.phone || profile?.telefone || "")));
      setCidade(
        String(profile?.cidade || profile?.cidade_nome || "Não informada")
      );

      let pedidosQuery = supabase
        .from("pedidos")
        .select("id, status, created_at")
        .eq("cliente_id", user.id);
      if (tenantId) {
        pedidosQuery = pedidosQuery.eq("tenant_id", tenantId);
      }
      const { data: pedidosData, error: pedidosError } = await pedidosQuery;

      if (pedidosError) {
        console.log("ERRO AO BUSCAR PEDIDOS DO CLIENTE:", pedidosError);
      }

      const listaPedidos = ((pedidosData as PedidoResumo[] | null) ?? []).filter(
        Boolean
      );

      const totalPedidos = listaPedidos.length;
      const totalFinalizados = listaPedidos.filter(
        (item) => item.status === "finalizado"
      ).length;
      const totalEmAndamento = listaPedidos.filter((item) =>
        ["aguardando_proposta", "proposta_recebida", "aceita", "em_execucao"].includes(
          item.status || ""
        )
      ).length;
      const totalCancelados = listaPedidos.filter(
        (item) => item.status === "cancelado"
      ).length;

      const pedidosOrdenados = [...listaPedidos].sort(
        (a, b) =>
          new Date(String(b.created_at || 0)).getTime() -
          new Date(String(a.created_at || 0)).getTime()
      );

      if (pedidosOrdenados.length > 0) {
        setUltimoPedidoEm(
          new Date(String(pedidosOrdenados[0].created_at)).toLocaleDateString("pt-BR")
        );
      } else {
        setUltimoPedidoEm("Sem pedidos ainda");
      }

      let propostasQuery = supabase
        .from("propostas")
        .select("id, lida_cliente, created_at, pedidos!inner(cliente_id)")
        .eq("pedidos.cliente_id", user.id);
      if (tenantId) {
        propostasQuery = propostasQuery.eq("tenant_id", tenantId);
      }
      const { data: propostasData, error: propostasError } = await propostasQuery;

      if (propostasError) {
        console.log("ERRO AO BUSCAR PROPOSTAS DO CLIENTE:", propostasError);
      }

      const listaPropostas = (propostasData as {
        id: string;
        lida_cliente?: boolean | null;
        created_at?: string | null;
      }[] | null) ?? [];

      const totalPropostas = listaPropostas.length;
      const naoLidas = listaPropostas.filter((item) => item.lida_cliente === false).length;

      let pagamentosQuery = supabase
        .from("pagamentos")
        .select("id, status_pagamento, valor_total, created_at, pedidos!inner(cliente_id)")
        .eq("pedidos.cliente_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (tenantId) {
        pagamentosQuery = pagamentosQuery.eq("tenant_id", tenantId);
      }
      const { data: pagamentosData, error: pagamentosError } = await pagamentosQuery;

      if (pagamentosError) {
        console.log("ERRO AO BUSCAR PAGAMENTOS DO CLIENTE:", pagamentosError);
      }

      const listaPagamentos = (pagamentosData as {
        id: string;
        status_pagamento?: string | null;
        valor_total?: number | null;
        created_at?: string | null;
      }[] | null) ?? [];

      const totalPagAprovados = listaPagamentos.filter(
        (item) => item.status_pagamento === "aprovada"
      ).length;
      const totalPagPendentes = listaPagamentos.filter(
        (item) => item.status_pagamento === "pendente"
      ).length;
      const somaInvestida = listaPagamentos
        .filter((item) => item.status_pagamento === "aprovada")
        .reduce((acc, item) => acc + Number(item.valor_total || 0), 0);

      const datasAtividade = [
        pedidosOrdenados[0]?.created_at,
        listaPropostas.sort(
          (a, b) =>
            new Date(String(b.created_at || 0)).getTime() -
            new Date(String(a.created_at || 0)).getTime()
        )[0]?.created_at,
        listaPagamentos[0]?.created_at,
      ]
        .filter(Boolean)
        .map((item) => new Date(String(item)).getTime());

      if (datasAtividade.length > 0) {
        const dataMax = Math.max(...datasAtividade);
        setUltimaAtividadeEm(new Date(dataMax).toLocaleString("pt-BR"));
      } else {
        setUltimaAtividadeEm("-");
      }

      setPedidos(totalPedidos);
      setFinalizados(totalFinalizados);
      setEmAndamento(totalEmAndamento);
      setCancelados(totalCancelados);
      setPropostasRecebidas(totalPropostas);
      setPropostasNaoLidas(naoLidas);
      setPagamentosAprovados(totalPagAprovados);
      setPagamentosPendentes(totalPagPendentes);
      setTotalInvestido(somaInvestida);
    } catch (error) {
      console.log("ERRO INESPERADO PERFIL CLIENTE:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void carregarPerfilCliente();
    }, [carregarPerfilCliente])
  );

  async function sair() {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.log("ERRO NO LOGOUT:", error);
      Alert.alert("Erro", "Não foi possível sair da conta.");
    }
  }

  async function trocarParaProfissional() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.replace("/(auth)/login");
      return;
    }

    const tenantId = await resolveCurrentTenantId();
    let profissionalQuery = supabase
      .from("profissionais")
      .select("user_id")
      .eq("user_id", session.user.id);
    if (tenantId) {
      profissionalQuery = profissionalQuery.eq("tenant_id", tenantId);
    }
    const { data: profissionalData, error: profissionalError } = await profissionalQuery.maybeSingle();

    if (profissionalError) {
      console.log("ERRO AO VALIDAR PERFIL PROFISSIONAL:", profissionalError);
      Alert.alert("Erro", "Não foi possível validar seu cadastro profissional agora.");
      return;
    }

    if (!profissionalData) {
      Alert.alert(
        "Cadastro profissional pendente",
        "Seu perfil ainda não está habilitado como profissional. Complete o cadastro para acessar essa área."
      );
      router.push("/register");
      return;
    }

    await setActiveRole("profissional");
    router.replace("/(profissional)/menu");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  const moeda = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Perfil cliente</Text>
      <Text style={styles.updatedAt}>Última atividade: {ultimaAtividadeEm}</Text>

      <View style={styles.card}>
        <View style={styles.userRow}>
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                nome
              )}&background=FACC15&color=000`,
            }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{nome}</Text>
            <Text style={styles.email}>{email || "Email não informado"}</Text>

            {verificado && (
              <Text style={styles.verificado}>✔ Conta Verificada</Text>
            )}
          </View>
        </View>

        {/* STATUS PREMIUM */}
        <View style={styles.badgesRow}>
          <View style={styles.planoBadge}>
            <Text style={styles.planoText}>{plano}</Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
              ⭐ {avaliacao.toFixed(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.infoLine}>Telefone: {telefone}</Text>
        <Text style={styles.infoLine}>Cidade: {cidade}</Text>
        <Text style={styles.infoLine}>Último pedido: {ultimoPedidoEm}</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Painel de atividade</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pedidos}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{finalizados}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{emAndamento}</Text>
            <Text style={styles.statLabel}>Em andamento</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{cancelados}</Text>
            <Text style={styles.statLabel}>Cancelados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{propostasRecebidas}</Text>
            <Text style={styles.statLabel}>Propostas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{propostasNaoLidas}</Text>
            <Text style={styles.statLabel}>Não lidas</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Financeiro do cliente</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pagamentosAprovados}</Text>
            <Text style={styles.statLabel}>Pag. aprovados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pagamentosPendentes}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{moeda(totalInvestido)}</Text>
            <Text style={styles.statLabel}>Total investido</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Ferramentas premium</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/meus-dados")}
        >
          <Text style={styles.optionTitle}>Meus dados</Text>
          <Text style={styles.optionSub}>
            Informações pessoais da conta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/pedidos")}
        >
          <Text style={styles.optionTitle}>Meus pedidos</Text>
          <Text style={styles.optionSub}>
            Acompanhe andamento, pagamento e finalização
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(cliente)/pedidos/propostas")}
        >
          <Text style={styles.optionTitle}>Minhas propostas recebidas</Text>
          <Text style={styles.optionSub}>
            Compare profissionais e tome decisões mais rápidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/central-ajuda")}
        >
          <Text style={styles.optionTitle}>Central de Ajuda</Text>
          <Text style={styles.optionSub}>
            Em que podemos ajudar você?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(tabs)/politica-privacidade")}
        >
          <Text style={styles.optionTitle}>Política de Privacidade</Text>
          <Text style={styles.optionSub}>Transparência e segurança dos seus dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchAccountOption}
          onPress={trocarParaProfissional}
        >
          <Text style={styles.switchAccountTitle}>Trocar tipo de conta</Text>
          <Text style={styles.switchAccountSub}>Ir para o perfil profissional</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={sair}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Versão 1.1.31.4</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#03040a",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#03040a",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 80,
  },

  header: {
    fontSize: 28,
    fontWeight: "900",
    color: "#facc15",
    marginBottom: 8,
  },
  updatedAt: {
    color: "#6b7280",
    marginBottom: 12,
    fontSize: 12,
  },

  card: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    padding: 20,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  avatar: {
    width: 75,
    height: 75,
    borderRadius: 40,
    marginRight: 15,
  },

  nome: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },

  email: {
    color: "#9ca3af",
    marginTop: 4,
  },

  verificado: {
    marginTop: 6,
    color: "#22c55e",
    fontWeight: "700",
  },

  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  planoBadge: {
    backgroundColor: "#facc15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  planoText: {
    fontWeight: "900",
    color: "#000",
  },

  ratingBadge: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  ratingText: {
    color: "#fff",
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  statBox: {
    width: "31%",
    minHeight: 68,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    color: "#facc15",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  statLabel: {
    color: "#9ca3af",
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginVertical: 15,
  },
  infoLine: {
    color: "#cbd5e1",
    marginBottom: 6,
    fontSize: 13,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 10,
    fontSize: 16,
  },

  option: {
    marginBottom: 10,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  optionTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  optionSub: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 12,
  },
  switchAccountOption: {
    marginBottom: 10,
    backgroundColor: "#facc15",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  switchAccountTitle: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 16,
  },
  switchAccountSub: {
    color: "#374151",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  logout: {
    marginTop: 12,
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },

  logoutText: {
    color: "#ef4444",
    fontWeight: "900",
  },

  version: {
    textAlign: "center",
    marginTop: 20,
    color: "#6b7280",
  },
});
