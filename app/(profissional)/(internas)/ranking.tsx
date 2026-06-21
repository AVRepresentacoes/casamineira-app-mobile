import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { getBadge } from "@/lib/badge";
import { loadProfessionalSubscriptionContext, type ProfessionalSubscriptionContext } from "@/lib/pro-subscription";

type Profissional = {
  id: string;
  nome: string | null;
  media: number | null;
  total: number;
};

function formatScore(value: number | null | undefined) {
  return (value ?? 0).toFixed(1);
}

function getRankTone(index: number) {
  if (index === 0) return "#facc15";
  if (index === 1) return "#cbd5e1";
  if (index === 2) return "#fb923c";
  return "#38bdf8";
}

function getRankIcon(index: number) {
  if (index === 0) return "trophy-outline";
  if (index === 1) return "medal-outline";
  if (index === 2) return "ribbon-outline";
  return "trending-up-outline";
}

export default function Ranking() {
  const router = useRouter();
  const [lista, setLista] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [subscription, setSubscription] = useState<ProfessionalSubscriptionContext | null>(null);

  const carregarRanking = useCallback(async () => {
    setLoading(true);
    setErro(false);

    try {
      const { data, error } = await supabase.rpc("ranking_profissionais");

      if (error) {
        console.log("Erro ao buscar ranking:", error);
        setLista([]);
        setErro(true);
        return;
      }

      setLista(((data as Profissional[] | null) ?? []).filter((item) => item?.id));
    } catch (err) {
      console.log("Erro inesperado ao buscar ranking:", err);
      setLista([]);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarRanking();
    }, [carregarRanking])
  );

  useFocusEffect(
    useCallback(() => {
      loadProfessionalSubscriptionContext().then(setSubscription).catch(() => setSubscription(null));
    }, [])
  );

  const topThree = useMemo(() => lista.slice(0, 3), [lista]);
  const lider = lista[0] || null;
  const melhorMedia = useMemo(
    () => (lista.length ? Math.max(...lista.map((i) => i.media ?? 0)) : 0),
    [lista]
  );
  const avaliacoesTotal = useMemo(
    () => lista.reduce((acc, item) => acc + (item.total || 0), 0),
    [lista]
  );
  const mediaGeral = useMemo(
    () =>
      lista.length
        ? lista.reduce((acc, item) => acc + (item.media ?? 0), 0) / lista.length
        : 0,
    [lista]
  );

  const header = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="podium-outline" size={20} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>Ranking de Profissionais</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Compare reputação, volume de avaliações e força competitiva em uma leitura mais executiva do ecossistema profissional.
        </Text>

        <View style={styles.heroSignalRow}>
          <View style={styles.heroSignal}>
            <Ionicons name="sparkles-outline" size={14} color="#facc15" />
            <Text style={styles.heroSignalText}>
              {lider ? `${lider.nome || "Líder atual"} no topo do ranking` : "Sem liderança definida"}
            </Text>
          </View>
          <View style={styles.heroSignal}>
            <Ionicons name="bar-chart-outline" size={14} color="#facc15" />
            <Text style={styles.heroSignalText}>{avaliacoesTotal} avaliações processadas</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Profissionais ativos</Text>
          <Text style={styles.metricValue}>{lista.length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Melhor média</Text>
          <Text style={styles.metricValue}>{formatScore(melhorMedia)}★</Text>
        </View>
        <View style={styles.metricCardWide}>
          <Text style={styles.metricLabel}>Média geral do ecossistema</Text>
          <Text style={styles.metricValueSoft}>{formatScore(mediaGeral)}★</Text>
        </View>
      </View>

      <View style={styles.planSignalCard}>
        <Text style={styles.planSignalTitle}>Impacto do seu plano no ranking</Text>
        <Text style={styles.planSignalText}>
          {subscription?.plan.features.rankingBoost === "elite"
            ? "Elite Black entrega o maior destaque visual e reforço de autoridade."
            : subscription?.plan.features.rankingBoost === "boosted"
              ? "Pro Performance posiciona seu perfil com destaque competitivo."
              : "Starter PRO aparece na base do ranking sem impulso premium adicional."}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.upgradeButton}
          onPress={() => router.push("/(profissional)/(internas)/assinatura")}
        >
          <Text style={styles.upgradeButtonTitle}>Melhorar posicionamento</Text>
          <Text style={styles.upgradeButtonSub}>Suba de plano para ganhar mais visibilidade competitiva.</Text>
        </TouchableOpacity>
      </View>

      {topThree.length > 0 ? (
        <View style={styles.podiumCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pódio de excelência</Text>
            <Text style={styles.sectionHint}>Top 3 do período</Text>
          </View>

          <View style={styles.podiumRow}>
            {topThree.map((item, index) => {
              const tone = getRankTone(index);
              const isLeader = index === 0;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.podiumSlot,
                    isLeader ? styles.podiumSlotLeader : null,
                    { borderColor: `${tone}55` },
                  ]}
                >
                  <View style={[styles.podiumBadge, { backgroundColor: tone }]}>
                    <Ionicons name={getRankIcon(index) as any} size={16} color="#0B0F1A" />
                  </View>
                  <Text style={styles.podiumPosition}>#{index + 1}</Text>
                  <Text style={styles.podiumName} numberOfLines={2}>
                    {item.nome || "Profissional"}
                  </Text>
                  <Text style={[styles.podiumScore, { color: tone }]}>
                    {formatScore(item.media)}★
                  </Text>
                  <Text style={styles.podiumMeta}>{item.total} avaliações</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.boardCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Leitura do mercado</Text>
          <Text style={styles.sectionHint}>Radar competitivo</Text>
        </View>
        <Text style={styles.boardText}>
          Profissionais com maior média e volume consistente de avaliações tendem a ocupar as posições de maior confiança percebida no marketplace.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ranking completo</Text>
        <Text style={styles.sectionHint}>{lista.length} profissionais visíveis</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#facc15" />
        </View>
      ) : null}

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListFooterComponent={
          lista.length > 0 ? (
            <View style={styles.summaryBoard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Posições e pontuação</Text>
                <Text style={styles.sectionHint}>Resumo final</Text>
              </View>
              {lista.slice(0, 10).map((item, index) => (
                <View key={`summary-${item.id}`} style={styles.summaryRow}>
                  <View style={styles.summaryIdentity}>
                    <View style={[styles.summaryRankPill, { backgroundColor: getRankTone(index) }]}>
                      {index === 0 ? (
                        <Ionicons name="trophy-outline" size={14} color="#0B0F1A" />
                      ) : (
                        <Text style={styles.summaryRankPillText}>#{index + 1}</Text>
                      )}
                    </View>
                    <Text style={styles.summaryName} numberOfLines={1}>
                      {item.nome || "Profissional"}
                    </Text>
                  </View>
                  <Text style={styles.summaryScore}>{formatScore(item.media)}★</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={lista.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={carregarRanking} tintColor="#facc15" />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const tone = getRankTone(index);
          const badge = getBadge(item.media ?? 0, item.total);
          const delta = lider ? Math.max(0, (lider.media ?? 0) - (item.media ?? 0)) : 0;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.identityBlock}>
                  <View style={[styles.rankPill, { backgroundColor: tone }]}>
                    {index === 0 ? (
                      <Ionicons name="trophy-outline" size={15} color="#0B0F1A" />
                    ) : (
                      <Text style={styles.rankPillText}>#{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.identityCopy}>
                    <Text style={styles.nome}>{item.nome || "Profissional"}</Text>
                    <Text style={styles.metaLine}>
                      {item.total} avaliações registradas
                    </Text>
                  </View>
                </View>
                <Ionicons name={getRankIcon(index) as any} size={18} color={tone} />
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>Média</Text>
                  <Text style={styles.kpiValue}>{formatScore(item.media)}★</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>Distância do líder</Text>
                  <Text style={styles.kpiValueSoft}>{lider && index > 0 ? `${delta.toFixed(1)} pts` : "Liderança"}</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.badgeChip}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
                <Text style={styles.signalText}>
                  {index === 0
                    ? "Referência atual de reputação"
                    : item.total >= 10
                      ? "Tração consistente no ranking"
                      : "Ainda em construção de reputação"}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={erro ? "alert-circle-outline" : "podium-outline"} size={30} color="#facc15" />
            <Text style={styles.emptyTitle}>
              {erro ? "Falha ao carregar o ranking" : "Nenhum profissional ranqueado ainda"}
            </Text>
            <Text style={styles.emptyText}>
              {erro
                ? "Tente atualizar novamente em alguns instantes."
                : "Quando houver avaliações suficientes, o comparativo aparecerá aqui."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    overflow: "hidden",
  },
  heroGlowA: {
    position: "absolute",
    top: -24,
    right: -16,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#facc1516",
  },
  heroGlowB: {
    position: "absolute",
    bottom: -50,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#38bdf810",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
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
  heroText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
  },
  heroSignalRow: {
    gap: 8,
    marginTop: 14,
  },
  heroSignal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroSignalText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
  },
  metricCardWide: {
    width: "100%",
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  metricValue: {
    color: "#facc15",
    fontWeight: "900",
    marginTop: 6,
    fontSize: 20,
  },
  metricValueSoft: {
    color: "#f8fafc",
    fontWeight: "900",
    marginTop: 6,
    fontSize: 20,
  },
  planSignalCard: {
    backgroundColor: "#081121",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
    marginBottom: 12,
  },
  planSignalTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 6,
  },
  planSignalText: {
    color: "#94a3b8",
    lineHeight: 20,
    fontSize: 12,
  },
  upgradeButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#facc15",
    padding: 12,
  },
  upgradeButtonTitle: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 13,
  },
  upgradeButtonSub: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  podiumCard: {
    backgroundColor: "#081121",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  podiumRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  podiumSlot: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: "#0c172d",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  podiumSlotLeader: {
    backgroundColor: "#101b30",
  },
  podiumBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  podiumPosition: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 12,
    marginBottom: 6,
  },
  podiumName: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
    minHeight: 38,
  },
  podiumScore: {
    fontWeight: "900",
    fontSize: 20,
    marginTop: 10,
  },
  podiumMeta: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 11,
    textAlign: "center",
  },
  boardCard: {
    backgroundColor: "#081121",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
    marginBottom: 12,
  },
  boardText: {
    color: "#94a3b8",
    lineHeight: 20,
    fontSize: 13,
  },
  card: {
    backgroundColor: "#081121",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#26466f",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  identityBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  rankPill: {
    minWidth: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  rankPillText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 12,
  },
  identityCopy: {
    flex: 1,
  },
  nome: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  metaLine: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#0c172d",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#304767",
    padding: 12,
  },
  kpiLabel: {
    color: "#94a3b8",
    fontSize: 11,
  },
  kpiValue: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 18,
    marginTop: 6,
  },
  kpiValueSoft: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 6,
  },
  badgeRow: {
    marginTop: 12,
    gap: 10,
  },
  badgeChip: {
    alignSelf: "flex-start",
    backgroundColor: "#10203a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#304767",
  },
  badgeText: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "900",
  },
  signalText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  summaryBoard: {
    backgroundColor: "#081121",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#26466f",
    padding: 14,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f3353",
  },
  summaryIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  summaryRankPill: {
    minWidth: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  summaryRankPillText: {
    color: "#0B0F1A",
    fontWeight: "900",
    fontSize: 12,
  },
  summaryName: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  summaryScore: {
    color: "#facc15",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
