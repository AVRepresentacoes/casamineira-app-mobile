import { logout, setActiveRole } from "@/lib/auth";
import { loadProfessionalSubscriptionContext } from "@/lib/pro-subscription";
import { supabase } from "@/lib/supabase";
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

type PerfilProfissionalData = {
  id?: string;
  name?: string | null;
  role?: string | null;
  phone?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  cidade?: string | null;
  cidade_nome?: string | null;
  media_avaliacao?: number | null;
  media_avaliacoes?: number | null;
  total_avaliacoes?: number | null;
  plano_ativo?: boolean | null;
  verificado?: boolean | null;
  badge?: string | null;
};

function isPagamentoAprovado(statusSingular?: string | null, statusPlural?: string | null) {
  const status = String(statusSingular || statusPlural || "").toLowerCase();
  return status === "aprovada" || status === "pago";
}

function formatarTelefoneBR(valor: string) {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "Não cadastrado";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export default function PerfilProfissional() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("Profissional");
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState("Plano Gratuito");
  const [verificado, setVerificado] = useState(false);
  const [badge, setBadge] = useState("🆕 Novo");
  const [telefone, setTelefone] = useState("Não cadastrado");
  const [whatsapp, setWhatsapp] = useState("Não cadastrado");
  const [cidade, setCidade] = useState("Não informada");
  const [avaliacaoMedia, setAvaliacaoMedia] = useState(0);
  const [avaliacoesTotal, setAvaliacoesTotal] = useState(0);
  const [perfilAtivo, setPerfilAtivo] = useState(true);
  const [disponivel, setDisponivel] = useState(true);
  const [raioAtuacao, setRaioAtuacao] = useState(10);
  const [fornecedorAtivo, setFornecedorAtivo] = useState(false);
  const [fornecedorRaio, setFornecedorRaio] = useState(15);

  const [propostasTotal, setPropostasTotal] = useState(0);
  const [propostasAceitas, setPropostasAceitas] = useState(0);
  const [propostasPendentes, setPropostasPendentes] = useState(0);
  const [servicosTotal, setServicosTotal] = useState(0);
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const [pedidosAtivos, setPedidosAtivos] = useState(0);
  const [pedidosFinalizados, setPedidosFinalizados] = useState(0);
  const [ganhosRecebidos, setGanhosRecebidos] = useState(0);

  const carregarPerfil = useCallback(async () => {
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
      setEmail(user.email ?? "");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.log("ERRO PERFIL PROFISSIONAL:", profileError);
        Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
      }

      const profile = (profileData as PerfilProfissionalData | null) ?? null;

      const nomePerfil = profile?.name?.trim();

      setNome(nomePerfil || (user.email ? user.email.split("@")[0] : "Profissional"));
      const subscription = await loadProfessionalSubscriptionContext(user.id).catch(() => null);
      setPlano(subscription ? `👑 ${subscription.plan.label}` : profile?.plano_ativo ? "👑 Profissional Premium" : "Plano Gratuito");
      setVerificado(Boolean(profile?.verificado ?? user.email_confirmed_at));
      setBadge(String(profile?.badge || "🆕 Novo"));
      setTelefone(formatarTelefoneBR(String(profile?.phone || profile?.telefone || "")));
      setWhatsapp(formatarTelefoneBR(String(profile?.whatsapp || "")));
      setCidade(String(profile?.cidade || profile?.cidade_nome || "Não informada"));
      setAvaliacaoMedia(Number(profile?.media_avaliacao ?? profile?.media_avaliacoes ?? 0));
      setAvaliacoesTotal(Number(profile?.total_avaliacoes ?? 0));

      const [
        profissionalRes,
        propostasRes,
        pedidosRes,
        servicosRes,
        portfolioRes,
        comissoesRes,
      ] = await Promise.all([
        supabase
          .from("profissionais")
          .select("ativo, disponivel, raio_km, fornecedor_ativo, fornecedor_raio_km")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("propostas")
          .select("id, status")
          .eq("profissional_id", user.id),
        supabase
          .from("pedidos")
          .select("id, status")
          .eq("profissional_id", user.id),
        supabase
          .from("servicos")
          .select("id")
          .eq("user_id", user.id),
        supabase
          .from("portfolio")
          .select("id")
          .eq("user_id", user.id),
        supabase
          .from("pagamentos")
          .select("valor_profissional, status_pagamento, status_pagamentos")
          .eq("profissional_id", user.id),
      ]);

      if (!profissionalRes.error && profissionalRes.data) {
        setPerfilAtivo(Boolean((profissionalRes.data as any).ativo ?? true));
        setDisponivel(Boolean((profissionalRes.data as any).disponivel ?? true));
        setRaioAtuacao(Number((profissionalRes.data as any).raio_km ?? 10));
        setFornecedorAtivo(Boolean((profissionalRes.data as any).fornecedor_ativo ?? false));
        setFornecedorRaio(Number((profissionalRes.data as any).fornecedor_raio_km ?? 15));
      }

      const propostas = (propostasRes.data || []) as { id: string; status?: string | null }[];
      setPropostasTotal(propostas.length);
      setPropostasAceitas(propostas.filter((item) => item.status === "aceita").length);
      setPropostasPendentes(
        propostas.filter((item) => !["aceita", "recusada"].includes(String(item.status || ""))).length
      );

      const pedidos = (pedidosRes.data || []) as { id: string; status?: string | null }[];
      setPedidosAtivos(
        pedidos.filter((item) =>
          ["aguardando_proposta", "proposta_recebida", "aceita", "em_execucao"].includes(
            String(item.status || "")
          )
        ).length
      );
      setPedidosFinalizados(
        pedidos.filter((item) => item.status === "finalizado").length
      );

      setServicosTotal((servicosRes.data || []).length);
      setPortfolioTotal((portfolioRes.data || []).length);

      const comissoes = (comissoesRes.data || []) as {
        valor_profissional?: number | null;
        status_pagamento?: string | null;
        status_pagamentos?: string | null;
      }[];
      const totalGanhos = comissoes
        .filter((item) => isPagamentoAprovado(item.status_pagamento, item.status_pagamentos))
        .reduce((acc, item) => acc + Number(item.valor_profissional || 0), 0);
      setGanhosRecebidos(totalGanhos);
    } catch (error) {
      console.log("ERRO CARREGAR PERFIL PROFISSIONAL:", error);
      Alert.alert("Erro", "Não foi possível carregar seu perfil profissional.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void carregarPerfil();
    }, [carregarPerfil])
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

  async function trocarParaCliente() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.replace("/(auth)/login");
      return;
    }
    await setActiveRole("cliente");
    router.replace("/(tabs)/perfil");
  }

  const moeda = (valor: number) => `R$ ${Number(valor || 0).toFixed(2)}`;
  const scorePerfil = Math.round(
    ((telefone !== "Não cadastrado" ? 1 : 0) +
      (whatsapp !== "Não cadastrado" ? 1 : 0) +
      (cidade !== "Não informada" ? 1 : 0) +
      (portfolioTotal > 0 ? 1 : 0) +
      (servicosTotal > 0 ? 1 : 0)) *
      20
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Perfil Profissional</Text>

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
            {verificado ? <Text style={styles.verificado}>✔ Conta Verificada</Text> : null}
          </View>
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.planoBadge}>
            <Text style={styles.planoText}>{plano}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {avaliacaoMedia.toFixed(1)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/assinatura",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.upgradeButtonTitle}>Upgrade de plano</Text>
          <Text style={styles.upgradeButtonSub}>Melhore comissão, prioridade e recursos premium</Text>
        </TouchableOpacity>

        <Text style={styles.infoLine}>Badge profissional: {badge}</Text>
        <Text style={styles.infoLine}>Score comercial do perfil: {scorePerfil}%</Text>
        <Text style={styles.infoLine}>Avaliações recebidas: {avaliacoesTotal}</Text>
        <Text style={styles.infoLine}>Telefone: {telefone}</Text>
        <Text style={styles.infoLine}>WhatsApp: {whatsapp}</Text>
        <Text style={styles.infoLine}>Cidade: {cidade}</Text>
        <Text style={styles.infoLine}>
          Status: {perfilAtivo ? "Ativo" : "Inativo"} • {disponivel ? "Disponível" : "Indisponível"}
        </Text>
        <Text style={styles.infoLine}>Raio de atendimento: {raioAtuacao} km</Text>
        <Text style={styles.infoLine}>
          Fornecedor: {fornecedorAtivo ? `Ativo (${fornecedorRaio} km)` : "Inativo"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Performance profissional</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{propostasTotal}</Text>
            <Text style={styles.statLabel}>Propostas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{propostasAceitas}</Text>
            <Text style={styles.statLabel}>Aceitas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{propostasPendentes}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pedidosAtivos}</Text>
            <Text style={styles.statLabel}>Pedidos ativos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pedidosFinalizados}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{servicosTotal}</Text>
            <Text style={styles.statLabel}>Serviços</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{portfolioTotal}</Text>
            <Text style={styles.statLabel}>Portfólio</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{moeda(ganhosRecebidos)}</Text>
            <Text style={styles.statLabel}>Ganhos pagos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{avaliacoesTotal}</Text>
            <Text style={styles.statLabel}>Reputação</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Ferramentas Premium</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/configuracoes",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Meus dados</Text>
          <Text style={styles.optionSub}>Atualize nome, telefone, WhatsApp e endereço</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/servicos",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Gerenciar serviços</Text>
          <Text style={styles.optionSub}>Cadastre e atualize seus serviços com preço e descrição</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/portfolio",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Portfólio profissional</Text>
          <Text style={styles.optionSub}>Mostre fotos e evidências dos seus melhores trabalhos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/avaliacoes",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Avaliações e reputação</Text>
          <Text style={styles.optionSub}>Acompanhe notas e feedback dos clientes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/configuracoes",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Configurações de atuação</Text>
          <Text style={styles.optionSub}>Ajuste disponibilidade, perfil ativo e raio de atendimento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/agenda",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Agenda inteligente</Text>
          <Text style={styles.optionSub}>Defina janelas de disponibilidade e evite conflito de horários</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/(profissional)/financeiro")}
        >
          <Text style={styles.optionTitle}>Financeiro profissional</Text>
          <Text style={styles.optionSub}>Receita, comissões e histórico de movimentações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/crescimento",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Crescimento e metas</Text>
          <Text style={styles.optionSub}>Acompanhe taxa de aceite, ticket médio e evolução de receita</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            router.push({
              pathname: "/(profissional)/(internas)/notificacoes",
              params: { from: "perfil" },
            })
          }
        >
          <Text style={styles.optionTitle}>Central de notificações</Text>
          <Text style={styles.optionSub}>Veja alertas de propostas e eventos operacionais</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchAccountOption}
          onPress={trocarParaCliente}
        >
          <Text style={styles.switchAccountTitle}>Trocar tipo de conta</Text>
          <Text style={styles.switchAccountSub}>Ir para o perfil cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={sair}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  content: {
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontWeight: "900",
    color: "#facc15",
    marginBottom: 16,
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
    marginBottom: 16,
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
  upgradeButton: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#facc15",
  },
  upgradeButtonTitle: {
    color: "#facc15",
    fontWeight: "900",
  },
  upgradeButtonSub: {
    color: "#cbd5e1",
    marginTop: 4,
    fontSize: 12,
  },
  infoLine: {
    color: "#cbd5e1",
    marginBottom: 6,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginVertical: 15,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    marginBottom: 12,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statBox: {
    width: "31%",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  statNumber: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
  option: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  optionTitle: {
    color: "#fff",
    fontWeight: "800",
  },
  optionSub: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 12,
  },
  switchAccountOption: {
    backgroundColor: "#facc15",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#facc15",
  },
  switchAccountTitle: {
    color: "#111827",
    fontWeight: "900",
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
    color: "#f87171",
    fontWeight: "900",
  },
});
