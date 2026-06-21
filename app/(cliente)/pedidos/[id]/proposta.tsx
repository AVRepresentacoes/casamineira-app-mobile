import { aceitarPropostaComComissao } from "@/lib/marketplace";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import PressableScale from "@/components/PressableScale";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Proposta {
  id: string;
  profissional_id: string;
  descricao?: string | null;
  mensagem?: string | null;
  valor: number | null;
  contato_liberado?: boolean;
  status: string;
  created_at?: string | null;
}

export default function PropostasPedidoCliente() {
  const { id: pedidoId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [nomesProfissionais, setNomesProfissionais] = useState<Record<string, string>>({});
  const [contatosProfissionais, setContatosProfissionais] = useState<
    Record<string, string>
  >({});
  const [contatoAberto, setContatoAberto] = useState<Record<string, boolean>>({});
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "enviada" | "aceita" | "recusada">("todas");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || !pedidoId) {
        setPropostas([]);
        setNomesProfissionais({});
        setContatosProfissionais({});
        return;
      }
      const tenantId = await resolveCurrentTenantId();

      let propostasQuery = supabase
        .from("propostas")
        .select(
          "id, profissional_id, descricao, mensagem, valor, status, contato_liberado, created_at"
        )
        .eq("pedido_id", pedidoId)
        .order("created_at", { ascending: false });
      if (tenantId) {
        propostasQuery = propostasQuery.eq("tenant_id", tenantId);
      }
      const { data, error } = await propostasQuery;

      if (error) {
        console.log("ERRO AO CARREGAR PROPOSTAS:", error);
        Alert.alert("Erro", "Não foi possível carregar as propostas.");
        return;
      }

      const propostasList = (data || []) as Proposta[];
      setPropostas(propostasList);

      let pagamentoQuery = supabase
        .from("pagamentos")
        .select("status_pagamento, status_pagamentos")
        .eq("pedido_id", pedidoId);
      if (tenantId) {
        pagamentoQuery = pagamentoQuery.eq("tenant_id", tenantId);
      }
      const { data: pagamentoData } = await pagamentoQuery.maybeSingle();

      const statusPagamento = String(
        (pagamentoData as any)?.status_pagamento ||
          (pagamentoData as any)?.status_pagamentos ||
          ""
      ).toLowerCase();
      setPagamentoAprovado(statusPagamento === "aprovada");

      if (propostasList.length > 0) {
        const { data: contatosRpc, error: contatosRpcError } = await supabase.rpc(
          "listar_contatos_profissionais_propostas",
          { p_pedido_id: pedidoId }
        );
        const nomes: Record<string, string> = {};
        const contatos: Record<string, string> = {};

        if (contatosRpcError) {
          console.log("ERRO RPC CONTATOS PROFISSIONAIS:", contatosRpcError);
        }

        for (const row of (contatosRpc || []) as any[]) {
          const id = String(row.profissional_id || "");
          if (!id) continue;

          const nome = String(row?.nome || "").trim() || "Profissional";
          const contato = String(row?.contato || "").trim() || "Telefone não cadastrado";

          nomes[id] = nome;
          contatos[id] = contato;
        }

        setNomesProfissionais(nomes);
        setContatosProfissionais(contatos);
      } else {
        setNomesProfissionais({});
        setContatosProfissionais({});
      }
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function aceitarProposta(proposta: Proposta) {
    Alert.alert(
      "Confirmar proposta",
      "Deseja aceitar esta proposta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceitar",
          style: "default",
          onPress: async () => {
            try {
              await aceitarPropostaComComissao({
                pedidoId,
                propostaId: proposta.id,
              });

              Alert.alert("Sucesso 🎉", "Proposta aceita com sucesso!", [
                {
                  text: "OK",
                  onPress: () => router.replace(`/(cliente)/pedidos/${pedidoId}`),
                },
              ]);
            } catch (error: any) {
              console.log("ERRO ACEITAR PROPOSTA:", error);
              Alert.alert(
                "Erro ao aceitar proposta",
                error?.message || "Tente novamente."
              );
            }
          },
        },
      ]
    );
  }

  function getStatusLabel(status: string) {
    if (status === "aceita") return "Aceita";
    if (status === "recusada") return "Recusada";
    return "Recebida";
  }

  function getStatusColor(status: string) {
    if (status === "aceita") return "#22c55e";
    if (status === "recusada") return "#ef4444";
    return "#facc15";
  }

  const indicadores = useMemo(() => {
    const total = propostas.length;
    const aceitas = propostas.filter((item) => item.status === "aceita").length;
    const emAnalise = propostas.filter((item) => item.status === "enviada").length;
    const menorValor = propostas
      .filter((item) => typeof item.valor === "number")
      .reduce<number | null>((acc, item) => {
        const v = Number(item.valor);
        if (!Number.isFinite(v)) return acc;
        if (acc === null) return v;
        return v < acc ? v : acc;
      }, null);

    return { total, aceitas, emAnalise, menorValor };
  }, [propostas]);

  const propostasFiltradas = useMemo(() => {
    if (filtro === "todas") return propostas;
    return propostas.filter((item) => item.status === filtro);
  }, [filtro, propostas]);

  function renderItem({ item }: { item: Proposta }) {
    const dataTexto = item.created_at
      ? new Date(item.created_at).toLocaleDateString("pt-BR")
      : "";

    return (
      <PressableScale style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={14} color="#facc15" />
            </View>
            <View>
              <Text style={styles.profTitle}>
                {nomesProfissionais[item.profissional_id] || "Profissional"}
              </Text>
              <Text style={styles.dateText}>{dataTexto}</Text>
            </View>
          </View>

          {item.status !== "aceita" ? (
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.msg}>{item.descricao || item.mensagem || ""}</Text>

        <Text style={styles.valor}>
          {item.valor !== null
            ? `R$ ${Number(item.valor).toFixed(2)}`
            : "Valor a combinar"}
        </Text>

        {item.status === "enviada" && (
          <PressableScale
            style={styles.btn}
            onPress={() => aceitarProposta(item)}
          >
            <Text style={styles.btnText}>Aceitar proposta</Text>
          </PressableScale>
        )}

        {item.status === "aceita" && (
          <>
            <View style={styles.acceptedRow}>
              <View style={[styles.statusChip, styles.statusChipAceita]}>
                <Ionicons name="checkmark-circle" size={13} color="#bbf7d0" />
                <Text style={styles.statusChipText}>Aceita</Text>
              </View>
              {pagamentoAprovado ? (
                <View style={[styles.statusChip, styles.statusChipPaga]}>
                  <Ionicons name="card" size={13} color="#dbeafe" />
                  <Text style={styles.statusChipText}>Paga</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.profInfoCard}>
              <Text style={styles.profInfoText}>
                Profissional: {nomesProfissionais[item.profissional_id] || "Profissional"}
              </Text>
              <Text style={styles.profInfoText}>
                Contato: {contatosProfissionais[item.profissional_id] || "Telefone não cadastrado"}
              </Text>
            </View>
          </>
        )}

        {item.contato_liberado ? (
          <>
            <PressableScale
              style={styles.viewContactBtn}
              onPress={() =>
                setContatoAberto((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
            >
              <Text style={styles.viewContactBtnText}>Ver Contato</Text>
            </PressableScale>
            {contatoAberto[item.id] ? (
              <Text style={styles.contactText}>
                Contato: {contatosProfissionais[item.profissional_id] || "Carregando..."}
              </Text>
            ) : null}
          </>
        ) : (
          <View style={styles.lockedContact}>
            <Text style={styles.lockedContactText}>Aceite para liberar contato</Text>
          </View>
        )}
      </PressableScale>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#facc15" />
        </TouchableOpacity>
        <Text style={styles.title}>Propostas recebidas</Text>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Total" value={String(indicadores.total)} />
        <Metric label="Em análise" value={String(indicadores.emAnalise)} />
        <Metric label="Aceitas" value={String(indicadores.aceitas)} />
        <Metric
          label="Melhor valor"
          value={
            indicadores.menorValor !== null
              ? `R$ ${indicadores.menorValor.toFixed(0)}`
              : "-"
          }
        />
      </View>

      <View style={styles.filtersRow}>
        {[
          { id: "todas", label: "Todas" },
          { id: "enviada", label: "Em análise" },
          { id: "aceita", label: "Aceitas" },
          { id: "recusada", label: "Recusadas" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterChip, filtro === item.id && styles.filterChipActive]}
            onPress={() => setFiltro(item.id as any)}
          >
            <Text style={[styles.filterChipText, filtro === item.id && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FACC15" />
      ) : (
        <FlatList
          data={propostasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nenhuma proposta recebida ainda
            </Text>
          }
          onRefresh={carregar}
          refreshing={loading}
        />
      )}
    </Animated.View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070f",
    padding: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
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
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#0b1220",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1b2640",
    paddingVertical: 10,
    alignItems: "center",
  },
  metricValue: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 14,
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#273244",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  filterChipText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#000",
  },

  card: {
    backgroundColor: "#0b1220",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1b2640",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#29374f",
    alignItems: "center",
    justifyContent: "center",
  },
  profTitle: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 13,
  },
  dateText: {
    color: "#94a3b8",
    fontSize: 11,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },

  badgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },

  msg: {
    color: "#e5e7eb",
    marginBottom: 12,
    lineHeight: 20,
  },

  valor: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },

  btn: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
  },

  acceptedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusChipAceita: {
    backgroundColor: "#14532d",
    borderColor: "#166534",
  },
  statusChipPaga: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1d4ed8",
  },
  statusChipText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  profInfoCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#263247",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  profInfoText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },

  lockedContact: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  lockedContactText: {
    color: "#9ca3af",
    fontWeight: "700",
  },

  viewContactBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  viewContactBtnText: {
    color: "#22c55e",
    fontWeight: "800",
  },

  contactText: {
    color: "#e5e7eb",
    fontWeight: "700",
    textAlign: "center",
  },

  empty: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 40,
  },
});
