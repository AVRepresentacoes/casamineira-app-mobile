import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Pedido = {
  id: string;
  categoria?: string | null;
  servico?: string | null;
  tipo_servico?: string | null;
  tipo_atendimento?: string | null;
  status_disparo?: string | null;
  profissional_aceitou_id?: string | null;
  descricao?: string | null;
  status?: string | null;
  cliente_id: string;
  bairro?: string | null;
  cidade?: string | null;
  created_at?: string | null;
};

export default function PedidoDetalheProfissional() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [contatoLiberado, setContatoLiberado] = useState(false);
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [mostrarContato, setMostrarContato] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const carregarPedido = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setAuthUserId(session?.user?.id ?? null);

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setPedido(null);
      setLoading(false);
      return;
    }

    setPedido(data);

    if (session?.user?.id) {
      const { data: propostaAceita } = await supabase
        .from("propostas")
        .select("contato_liberado")
        .eq("pedido_id", id)
        .eq("profissional_id", session.user.id)
        .eq("status", "aceita")
        .maybeSingle();

      const pedidoRapidoAceito =
        (data as any)?.tipo_atendimento === "rapido" &&
        (data as any)?.status_disparo === "aceito" &&
        String((data as any)?.profissional_aceitou_id || "") === session.user.id;

      if (propostaAceita?.contato_liberado || pedidoRapidoAceito) {
        setContatoLiberado(true);

        const { data: perfilCliente } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.cliente_id)
          .maybeSingle();

        const contato =
          (perfilCliente as any)?.phone ||
          (perfilCliente as any)?.telefone ||
          (perfilCliente as any)?.whatsapp ||
          "Telefone não cadastrado";

        setTelefoneCliente(String(contato));
      } else {
        setContatoLiberado(false);
        setTelefoneCliente("");
      }
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void carregarPedido();
  }, [carregarPedido, id]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void carregarPedido();
    }, [carregarPedido, id])
  );

  const statusLabel = (status?: string | null) => {
    if (status === "aguardando_proposta") return "Aguardando proposta";
    if (status === "proposta_recebida") return "Em negociação";
    if (status === "aceita") return "Aceito";
    if (status === "em_execucao") return "Em execução";
    if (status === "finalizado") return "Finalizado";
    return "Status não definido";
  };

  const statusStyle = (status?: string | null) => {
    if (status === "aguardando_proposta") return styles.statusAguardando;
    if (status === "proposta_recebida") return styles.statusNegociacao;
    if (status === "aceita") return styles.statusAceito;
    if (status === "em_execucao") return styles.statusExecucao;
    if (status === "finalizado") return styles.statusFinalizado;
    return styles.statusDefault;
  };

  // ⛔ BLOQUEIA RENDER ENQUANTO CARREGA
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  // ⛔ BLOQUEIA SE NÃO EXISTIR
  if (!pedido) {
    return (
      <View style={styles.center}>
        <Text style={styles.itemText}>Pedido não encontrado</Text>
      </View>
    );
  }

  const ehRapido = pedido.tipo_atendimento === "rapido";
  const fuiSelecionadoNoRapido =
    authUserId && String((pedido as any).profissional_aceitou_id || "") === authUserId;
  const possoEnviarProposta =
    !ehRapido &&
    (pedido.status === "aguardando_proposta" || pedido.status === "proposta_recebida");
  const possoAbrirChat =
    pedido.status === "aceita" || pedido.status === "em_execucao" || pedido.status === "finalizado";
  const localizacao =
    [pedido.bairro, pedido.cidade].filter(Boolean).join(", ") || "Localização não informada";
  const publicadoEm = pedido.created_at
    ? new Date(pedido.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "Data não informada";
  const modoLabel = ehRapido ? "Atendimento rápido" : "Pedido por proposta";
  const resumoServico = pedido.tipo_servico || pedido.servico || "Não informado";
  const descricaoPedido = pedido.descricao || "Sem descrição disponível.";

  // ✅ DAQUI PRA BAIXO: pedido NUNCA é null
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="document-text-outline" size={20} color="#0B0F1A" />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Painel do profissional</Text>
              <Text style={styles.title}>Detalhes do pedido</Text>
            </View>
          </View>
          <Text style={[styles.statusTag, statusStyle(pedido.status)]}>
            {statusLabel(pedido.status)}
          </Text>
        </View>

        <Text style={styles.heroService}>{resumoServico}</Text>
        <Text style={styles.heroDescription}>
          Leia o contexto do pedido, valide a liberação do contato e avance para proposta ou chat sem perder o fluxo atual.
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="location-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{localizacao}</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="flash-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{modoLabel}</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="calendar-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>Publicado em {publicadoEm}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoTile}>
          <Ionicons name="construct-outline" size={18} color="#facc15" />
          <Text style={styles.infoTileLabel}>Categoria</Text>
          <Text style={styles.infoTileValue}>{pedido.categoria || "Não informada"}</Text>
        </View>
        <View style={styles.infoTile}>
          <Ionicons name="briefcase-outline" size={18} color="#facc15" />
          <Text style={styles.infoTileLabel}>Tipo de serviço</Text>
          <Text style={styles.infoTileValue}>{resumoServico}</Text>
        </View>
        <View style={styles.infoTile}>
          <Ionicons name="navigate-outline" size={18} color="#facc15" />
          <Text style={styles.infoTileLabel}>Cidade</Text>
          <Text style={styles.infoTileValue}>{pedido.cidade || "Não informada"}</Text>
        </View>
        <View style={styles.infoTile}>
          <Ionicons name="time-outline" size={18} color="#facc15" />
          <Text style={styles.infoTileLabel}>Modelo</Text>
          <Text style={styles.infoTileValue}>{modoLabel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="layers-outline" size={18} color="#facc15" />
            <Text style={styles.sectionTitle}>Resumo operacional</Text>
          </View>
          <Text style={styles.sectionHint}>Visão rápida</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.itemLabel}>Categoria</Text>
            <Text style={styles.itemText}>{pedido.categoria || "Não informada"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.itemLabel}>Tipo de serviço</Text>
            <Text style={styles.itemText}>{resumoServico}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.itemLabel}>Bairro</Text>
            <Text style={styles.itemText}>{pedido.bairro || "Não informado"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.itemLabel}>Cidade</Text>
            <Text style={styles.itemText}>{pedido.cidade || "Não informada"}</Text>
          </View>
        </View>

        <View style={styles.contextStrip}>
          <Ionicons name="sparkles-outline" size={16} color="#facc15" />
          <Text style={styles.contextStripText}>
            {ehRapido
              ? "Este pedido está em modo rápido. A prioridade é responder com agilidade."
              : "Este pedido segue o fluxo de proposta tradicional, com espaço para negociação."}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="reader-outline" size={18} color="#facc15" />
            <Text style={styles.sectionTitle}>Escopo do pedido</Text>
          </View>
          <Text style={styles.sectionHint}>Leitura do briefing</Text>
        </View>
        <Text style={styles.descriptionText}>{descricaoPedido}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="call-outline" size={18} color="#facc15" />
            <Text style={styles.sectionTitle}>Contato do cliente</Text>
          </View>
          <Text style={styles.sectionHint}>
            {contatoLiberado ? "Contato disponível" : "Aguardando liberação"}
          </Text>
        </View>
        {contatoLiberado ? (
          <>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => setMostrarContato((prev) => !prev)}
            >
              <Text style={styles.contactButtonText}>
                {mostrarContato ? "Ocultar contato" : "Ver contato"}
              </Text>
            </TouchableOpacity>
            {mostrarContato ? <Text style={styles.itemText}>{telefoneCliente}</Text> : null}
          </>
        ) : (
          <View style={styles.lockedPanel}>
            <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
            <Text style={styles.lockedButtonText}>Aceite para liberar contato</Text>
          </View>
        )}
      </View>

      <View style={styles.actionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="rocket-outline" size={18} color="#facc15" />
            <Text style={styles.sectionTitle}>Próximo passo</Text>
          </View>
          <Text style={styles.sectionHint}>Ação operacional</Text>
        </View>

        {possoEnviarProposta && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push(`/(profissional)/pedidos/${pedido.id}/proposta`)}
          >
            <Ionicons name="create-outline" size={18} color="#0B0F1A" />
            <Text style={styles.primaryButtonText}>Enviar proposta</Text>
          </TouchableOpacity>
        )}

        {ehRapido && !fuiSelecionadoNoRapido ? (
          <View style={styles.lockedPanel}>
            <Ionicons name="timer-outline" size={18} color="#94A3B8" />
            <Text style={styles.lockedButtonText}>Chamado já aceito por outro profissional</Text>
          </View>
        ) : null}

        {possoAbrirChat && (!ehRapido || Boolean(fuiSelecionadoNoRapido)) && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push(`/(profissional)/pedidos/${pedido.id}/chat`)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#facc15" />
            <Text style={styles.secondaryButtonText}>Abrir chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  content: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 22,
  },
  center: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
    alignItems: "center",
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
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
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
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  heroService: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroDescription: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#304767",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetaText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  statusTag: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  statusAguardando: {
    backgroundColor: "#1f2937",
    color: "#facc15",
  },
  statusNegociacao: {
    backgroundColor: "#082f49",
    color: "#38bdf8",
  },
  statusAceito: {
    backgroundColor: "#052e1f",
    color: "#22c55e",
  },
  statusExecucao: {
    backgroundColor: "#0e2a47",
    color: "#60a5fa",
  },
  statusFinalizado: {
    backgroundColor: "#0f2d20",
    color: "#34d399",
  },
  statusDefault: {
    backgroundColor: "#1f2937",
    color: "#cbd5e1",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  infoTile: {
    width: "47%",
    minWidth: 150,
    backgroundColor: "#0d1a30",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#244267",
  },
  infoTileLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  infoTileValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#081121",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  sectionHint: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
  },
  itemLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "700",
  },
  itemText: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 2,
    lineHeight: 21,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    backgroundColor: "#0c172d",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#304767",
    padding: 12,
  },
  descriptionText: {
    color: "#cbd5e1",
    lineHeight: 21,
    fontSize: 14,
  },
  contextStrip: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#0c172d",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#304767",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  contextStripText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  actionCard: {
    backgroundColor: "#081121",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: "#FACC15",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 0,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: "#0B0F1A",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: "#facc15",
    fontWeight: "800",
    fontSize: 15,
  },
  lockedPanel: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0c172d",
  },
  lockedButtonText: {
    color: "#9CA3AF",
    fontWeight: "700",
    textAlign: "center",
  },
  contactButton: {
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#052e1f",
    marginBottom: 12,
  },
  contactButtonText: {
    color: "#22c55e",
    fontWeight: "800",
  },
});
