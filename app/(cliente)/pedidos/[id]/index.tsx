import { supabase } from "@/lib/supabase";
import { expirarChamadosRapidos } from "@/lib/chamadosRapidos";
import { resolveCurrentTenantId } from "@/lib/tenant";
import PressableScale from "@/components/PressableScale";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

const LOGISTICA_STEPS = [
  { key: "novo", title: "Pedido recebido", subtitle: "Pagamento confirmado e pedido criado." },
  { key: "preparando", title: "Preparando envio", subtitle: "Fornecedor separando os itens." },
  { key: "enviado", title: "Em rota de entrega", subtitle: "Pedido saiu para entrega." },
  { key: "entregue", title: "Entregue", subtitle: "Entrega concluida com sucesso." },
] as const;

export default function PedidoDetalhe() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [timelineY, setTimelineY] = useState<number>(0);
  const [pedido, setPedido] = useState<any>(null);
  const [profissionalNome, setProfissionalNome] = useState<string | null>(null);
  const [hasPropostas, setHasPropostas] = useState(false);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setPedido(null);
        setProfissionalNome(null);
        setHasPropostas(false);
        return;
      }
      const tenantId = await resolveCurrentTenantId();

      try {
        await expirarChamadosRapidos(String(id));
      } catch (expireError) {
        console.log("ERRO EXPIRAR CHAMADOS RAPIDOS (CLIENTE):", expireError);
      }

      let pedidoQuery = supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .eq("cliente_id", session.user.id);
      if (tenantId) {
        pedidoQuery = pedidoQuery.eq("tenant_id", tenantId);
      }
      const { data, error } = await pedidoQuery.maybeSingle();

      if (!error && data) {
        setPedido(data);
        setProfissionalNome(null);

        if (
          data.tipo_atendimento === "rapido" &&
          data.status_disparo === "aceito" &&
          data.profissional_aceitou_id
        ) {
          let profissionalQuery = supabase
            .from("profiles")
            .select("*")
            .eq("id", data.profissional_aceitou_id);
          if (tenantId) {
            profissionalQuery = profissionalQuery.eq("tenant_id", tenantId);
          }
          const { data: profissionalPerfil } = await profissionalQuery.maybeSingle();

          const nome =
            String((profissionalPerfil as any)?.name || "").trim() ||
            String((profissionalPerfil as any)?.nome || "").trim() ||
            null;

          setProfissionalNome(nome);
        }

        let propostasQuery = supabase
          .from("propostas")
          .select("id", { count: "exact", head: true })
          .eq("pedido_id", String(id));
        if (tenantId) {
          propostasQuery = propostasQuery.eq("tenant_id", tenantId);
        }
        const { count } = await propostasQuery;
        setHasPropostas(Number(count || 0) > 0);

        let pagamentoQuery = supabase
          .from("pagamentos")
          .select("status_pagamento, status_pagamentos")
          .eq("pedido_id", String(id));
        if (tenantId) {
          pagamentoQuery = pagamentoQuery.eq("tenant_id", tenantId);
        }
        const { data: pagamentoAtual } = await pagamentoQuery.maybeSingle();

        const statusPagamento = String(
          pagamentoAtual?.status_pagamento || pagamentoAtual?.status_pagamentos || "",
        ).toLowerCase();
        setPagamentoAprovado(statusPagamento === "aprovada");
      } else {
        setPedido(null);
        setHasPropostas(false);
        setPagamentoAprovado(false);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  useEffect(() => {
    if (focus !== "timeline" || !timelineY) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(timelineY - 24, 0), animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [focus, timelineY]);

  function finalizarPedido() {
    router.push(`/(cliente)/pedidos/${id}/finalizar`);
  }

  function corStatus(status: string) {
    switch (status) {
      case "aguardando_pagamento":
        return "#facc15";
      case "aguardando_proposta":
        return "#facc15";
      case "proposta_recebida":
        return "#3b82f6";
      case "aceita":
        return "#6366f1";
      case "em_andamento":
        return "#0ea5e9";
      case "em_execucao":
        return "#0ea5e9";
      case "finalizado":
        return "#9ca3af";
      case "cancelado":
        return "#ef4444";
      default:
        return "#22c55e";
    }
  }

  function labelStatus(status: string) {
    if (status === "aguardando_pagamento") return "Aguardando pagamento";
    if (status === "aguardando_proposta") return "Aguardando proposta";
    if (status === "proposta_recebida") return "Proposta recebida";
    if (status === "aceita") return "Proposta aceita";
    if (status === "em_andamento" || status === "em_execucao") return "Em execução";
    if (status === "finalizado") return "Finalizado";
    if (status === "cancelado") return "Cancelado";
    return "Ativo";
  }

  function labelStatusDisparo(statusDisparo?: string | null) {
    if (statusDisparo === "pendente") return "Preparando disparo";
    if (statusDisparo === "disparado") return "Aguardando aceite rápido";
    if (statusDisparo === "aceito") return "Profissional confirmado";
    if (statusDisparo === "expirado") return "Tempo do rápido expirou";
    if (statusDisparo === "cancelado") return "Disparo cancelado";
    return "Sem disparo";
  }

  function indiceStatusLogistica(statusLogistica: string) {
    const idx = LOGISTICA_STEPS.findIndex((step) => step.key === statusLogistica);
    return idx >= 0 ? idx : 0;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center" }}>Pedido não encontrado.</Text>
      </View>
    );
  }

  const statusColor = corStatus(String(pedido.status || ""));
  const isMarketplace = String(pedido.categoria || "").toLowerCase() === "marketplace";
  const statusLogistica = String(pedido.status_logistica || "novo").toLowerCase();
  const logisticaCancelada = statusLogistica === "cancelado";
  const indiceLogistica = indiceStatusLogistica(statusLogistica);

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PressableScale style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#facc15" />
        </PressableScale>
        <Text style={styles.title}>Detalhes do pedido</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.categoria}>{pedido.categoria || "Serviço"}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Ionicons name="ellipse" size={9} color={statusColor} />
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {labelStatus(String(pedido.status || ""))}
          </Text>
        </View>
        {pedido.tipo_atendimento === "rapido" ? (
          <View style={[styles.statusBadge, { borderColor: "#38bdf8", marginTop: 8 }]}>
            <Ionicons name="flash-outline" size={12} color="#38bdf8" />
            <Text style={[styles.statusBadgeText, { color: "#38bdf8" }]}>
              {labelStatusDisparo(pedido.status_disparo)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <Text style={styles.descricao}>
          {pedido.descricao || "Sem descrição informada."}
        </Text>
      </View>

      {isMarketplace && !pagamentoAprovado ? (
        <View style={styles.pendingPaymentCard}>
          <View style={styles.pendingPaymentTop}>
            <Ionicons name="card-outline" size={16} color="#facc15" />
            <Text style={styles.pendingPaymentTitle}>Pagamento pendente</Text>
          </View>
          <Text style={styles.pendingPaymentText}>
            Este pedido foi criado, mas a entrega só inicia após a confirmação do pagamento.
          </Text>
        </View>
      ) : null}

      {isMarketplace && pagamentoAprovado ? (
        <View style={styles.timelineCard} onLayout={(e) => setTimelineY(e.nativeEvent.layout.y)}>
          <View style={styles.timelineHeader}>
            <Ionicons name="cube-outline" size={16} color="#facc15" />
            <Text style={styles.timelineTitle}>Rastreio da entrega</Text>
          </View>
          <Text style={styles.timelineSubtitle}>
            Acompanhe o andamento do seu pedido em tempo real.
          </Text>

          {LOGISTICA_STEPS.map((step, idx) => {
            const concluida = !logisticaCancelada && idx < indiceLogistica;
            const atual = !logisticaCancelada && idx === indiceLogistica;
            const pontoCor = concluida || atual ? "#22c55e" : "#334155";
            const linhaCor = concluida ? "#22c55e" : "#334155";

            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { borderColor: pontoCor }]}>
                    <View style={[styles.timelineDotInner, { backgroundColor: pontoCor }]} />
                  </View>
                  {idx < LOGISTICA_STEPS.length - 1 ? (
                    <View style={[styles.timelineLine, { backgroundColor: linhaCor }]} />
                  ) : null}
                </View>

                <View style={styles.timelineInfo}>
                  <Text
                    style={[
                      styles.timelineStepTitle,
                      concluida || atual ? styles.timelineStepTitleDone : null,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.timelineStepSubtitle}>{step.subtitle}</Text>
                </View>
              </View>
            );
          })}

          {logisticaCancelada ? (
            <View style={styles.timelineCanceled}>
              <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
              <Text style={styles.timelineCanceledText}>Entrega cancelada pelo fornecedor.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {pedido.tipo_atendimento === "rapido" && pedido.status_disparo === "aceito" ? (
        <View style={styles.confirmadoCard}>
          <View style={styles.confirmadoTop}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#22c55e" />
            <Text style={styles.confirmadoTitle}>Profissional confirmado</Text>
          </View>
          <Text style={styles.confirmadoText}>
            {profissionalNome
              ? `${profissionalNome} aceitou seu chamado rápido.`
              : "Seu chamado rápido foi aceito com sucesso por um profissional."}
          </Text>
          <Text style={styles.confirmadoHint}>
            Acompanhe o andamento e use o chat para alinhar detalhes.
          </Text>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.actionsTitle}>Ações disponíveis</Text>
      </View>

      {(pedido.status === "proposta_recebida" || hasPropostas) && (
        <PressableScale
          style={[styles.actionButton, { backgroundColor: "#1d4ed8" }]}
          onPress={() => router.push(`/(cliente)/pedidos/${id}/proposta`)}
        >
          <Ionicons name="document-text-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Ver propostas</Text>
          <Ionicons name="chevron-forward" size={18} color="#bfdbfe" />
        </PressableScale>
      )}

      {pedido.status === "aceita" && !pagamentoAprovado && (
        <PressableScale
          style={[styles.actionButton, { backgroundColor: "#4338ca" }]}
          onPress={() => router.push(`/(cliente)/pedidos/${id}/pagar`)}
        >
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Ir para pagamento</Text>
          <Ionicons name="chevron-forward" size={18} color="#c7d2fe" />
        </PressableScale>
      )}

      {pedido.status === "aceita" && pagamentoAprovado && (
        <View style={styles.pagoCard}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={styles.pagoText}>Pagamento já aprovado. Pedido bloqueado para novo pagamento.</Text>
        </View>
      )}

      {((pedido.status === "aceita" && pagamentoAprovado) || pedido.status === "em_execucao") && (
        <PressableScale
          style={[styles.actionButton, { backgroundColor: "#0369a1" }]}
          onPress={() => router.push(`/(cliente)/pedidos/${id}/chat`)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Abrir chat</Text>
          <Ionicons name="chevron-forward" size={18} color="#bae6fd" />
        </PressableScale>
      )}

      {pedido.status === "em_execucao" && (
        <PressableScale
          style={[styles.actionButton, { backgroundColor: "#15803d" }]}
          onPress={finalizarPedido}
        >
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Finalizar serviço</Text>
          <Ionicons name="chevron-forward" size={18} color="#bbf7d0" />
        </PressableScale>
      )}

      {pedido.status === "finalizado" && (
        <PressableScale
          style={[styles.actionButton, { backgroundColor: "#ca8a04" }]}
          onPress={() => router.push(`/(cliente)/pedidos/${id}/avaliar`)}
        >
          <Ionicons name="star-outline" size={18} color="#111827" />
          <Text style={[styles.actionText, { color: "#111827" }]}>Avaliar serviço</Text>
          <Ionicons name="chevron-forward" size={18} color="#111827" />
        </PressableScale>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070f",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#253045",
    backgroundColor: "#0b1220",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#facc15",
  },
  heroCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1b2640",
    padding: 16,
    marginBottom: 12,
  },
  categoria: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
  },
  statusBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1b2640",
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  descricao: {
    color: "#e5e7eb",
    lineHeight: 20,
  },
  confirmadoCard: {
    backgroundColor: "#052e16",
    borderWidth: 1,
    borderColor: "#166534",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  confirmadoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  confirmadoTitle: {
    color: "#bbf7d0",
    fontWeight: "900",
    fontSize: 15,
  },
  confirmadoText: {
    color: "#dcfce7",
    marginBottom: 4,
    lineHeight: 18,
  },
  confirmadoHint: {
    color: "#86efac",
    fontSize: 12,
  },
  timelineCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1b2640",
    padding: 14,
    marginBottom: 14,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timelineTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 15,
  },
  timelineSubtitle: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 48,
  },
  timelineRail: {
    width: 24,
    alignItems: "center",
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 999,
  },
  timelineInfo: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineStepTitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  timelineStepTitleDone: {
    color: "#22c55e",
  },
  timelineStepSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  timelineCanceled: {
    marginTop: 8,
    backgroundColor: "#2b1013",
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timelineCanceledText: {
    color: "#fecaca",
    fontSize: 12,
    fontWeight: "700",
  },
  pendingPaymentCard: {
    backgroundColor: "#3a2f0b",
    borderWidth: 1,
    borderColor: "#facc15",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  pendingPaymentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pendingPaymentTitle: {
    color: "#fde68a",
    fontWeight: "900",
    fontSize: 14,
  },
  pendingPaymentText: {
    color: "#fef3c7",
    lineHeight: 18,
    fontSize: 12,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  actionsTitle: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 13,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  actionText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    flex: 1,
    marginLeft: 10,
  },
  pagoCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#166534",
    backgroundColor: "#052e16",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pagoText: {
    color: "#dcfce7",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
});
