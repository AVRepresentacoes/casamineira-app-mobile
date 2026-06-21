import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const BANNER_WIDTH = SCREEN_WIDTH - 32;

type PedidoItem = {
  id: string;
  categoria?: string | null;
  tipo_servico?: string | null;
  servico?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  descricao?: string | null;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  distancia_km?: number | null;
};

type BannerSlide = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  url: string;
  imageUrl?: string | null;
};

type FilterMode = "todos" | "novos" | "negociacao" | "perto";
type SortMode = "score" | "recentes" | "proximos";

const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: "afiliado-1",
    badge: "Mercado Livre",
    title: "Ferramentas com alta comissao",
    subtitle: "Divulgue kits profissionais, maquinas e acessorios com melhor conversao.",
    url: "https://www.mercadolivre.com.br/c/ferramentas",
    imageUrl: null,
  },
  {
    id: "afiliado-2",
    badge: "Afiliado PRO",
    title: "Materiais ideais para reforma rapida",
    subtitle: "Campanhas para clientes com intencao de compra imediata e ticket mais alto.",
    url: "https://www.mercadolivre.com.br/ofertas",
    imageUrl: null,
  },
  {
    id: "afiliado-3",
    badge: "Monetizacao",
    title: "Banners premium para gerar renda extra",
    subtitle: "Ative divulgacoes patrocinadas e aumente sua receita por indicacao.",
    url: "https://www.mercadolivre.com.br/",
    imageUrl: null,
  },
];

function formatDateLabel(value?: string | null) {
  if (!value) return "Agora";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `${diffMin} min atras`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h atras`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d atras`;
  return date.toLocaleDateString("pt-BR");
}

function getUrgencyColor(score: number) {
  if (score >= 85) return "#22c55e";
  if (score >= 65) return "#facc15";
  return "#38bdf8";
}

export default function PedidosProfissional() {
  const router = useRouter();
  const bannerRef = useRef<ScrollView>(null);
  const autoBannerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [slides, setSlides] = useState<BannerSlide[]>(FALLBACK_SLIDES);
  const [filterMode, setFilterMode] = useState<FilterMode>("todos");
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [query, setQuery] = useState("");

  const calcularDistanciaKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const calcularScore = (item: PedidoItem) => {
    let score = 45;
    if (item.status === "aguardando_proposta") score += 18;
    if (item.distancia_km !== null && item.distancia_km !== undefined) {
      if (item.distancia_km <= 5) score += 24;
      else if (item.distancia_km <= 12) score += 16;
      else if (item.distancia_km <= 25) score += 8;
    }
    if ((item.descricao || "").trim().length >= 80) score += 8;
    if (item.bairro) score += 5;
    return Math.min(score, 98);
  };

  const abrirLinkPublicidade = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Link indisponivel", "Nao foi possivel abrir este link agora.");
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.log("ERRO ABRIR LINK PUBLICIDADE:", error);
      Alert.alert("Erro", "Nao foi possivel abrir o link da publicidade.");
    }
  }, []);

  useEffect(() => {
    async function obterLocalizacao() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUserLocation(null);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const novaLocalizacao = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(novaLocalizacao);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        const { error: locationError } = await supabase.from("profissionais").upsert({
          user_id: session.user.id,
          latitude: novaLocalizacao.latitude,
          longitude: novaLocalizacao.longitude,
          location_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (locationError) {
          console.log("ERRO ATUALIZAR LOCALIZACAO PROFISSIONAL:", locationError);
        }
      }
    }

    void obterLocalizacao();
  }, []);

  const carregarPedidos = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .in("status", ["aguardando_proposta", "proposta_recebida"])
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Erro ao buscar pedidos:", error);
    }

    if (data) {
      const enriquecidos = data
        .filter((item) => item.tipo_atendimento !== "rapido")
        .map((item) => {
          if (
            userLocation &&
            typeof item?.latitude === "number" &&
            typeof item?.longitude === "number"
          ) {
            return {
              ...item,
              distancia_km: calcularDistanciaKm(
                userLocation.latitude,
                userLocation.longitude,
                item.latitude,
                item.longitude
              ),
            };
          }

          return { ...item, distancia_km: null };
        });

      setPedidos(enriquecidos as PedidoItem[]);
    } else {
      setPedidos([]);
    }

    setLoading(false);
  }, [userLocation]);

  const carregarBanners = useCallback(async () => {
    const { data, error } = await supabase
      .from("banners_publicitarios")
      .select("id, badge, titulo, subtitulo, link_url, image_url, ordem")
      .eq("posicao", "pedidos_profissional_topo")
      .order("ordem", { ascending: true });

    if (error) {
      console.log("ERRO CARREGAR BANNERS PUBLICITARIOS:", error);
      setSlides(FALLBACK_SLIDES);
      setBannerIndex(0);
      return;
    }

    const mapped = (data || [])
      .map((item: any) => ({
        id: String(item.id),
        badge: String(item.badge || "Patrocinado"),
        title: String(item.titulo || "Oferta"),
        subtitle: String(item.subtitulo || ""),
        url: String(item.link_url || ""),
        imageUrl: item.image_url ? String(item.image_url) : null,
      }))
      .filter((item) => item.url.startsWith("http"));

    setSlides(mapped.length > 0 ? mapped : FALLBACK_SLIDES);
    setBannerIndex(0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarPedidos();
      void carregarBanners();
    }, [carregarBanners, carregarPedidos])
  );

  useEffect(() => {
    if (slides.length <= 1) return;

    if (autoBannerRef.current) {
      clearInterval(autoBannerRef.current);
    }

    autoBannerRef.current = setInterval(() => {
      setBannerIndex((current) => {
        const next = (current + 1) % slides.length;
        bannerRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 4200);

    return () => {
      if (autoBannerRef.current) {
        clearInterval(autoBannerRef.current);
      }
    };
  }, [slides]);

  const normalizedQuery = query.trim().toLowerCase();
  const pedidosFiltrados = pedidos.filter((item) => {
    const haystack = [
      item.categoria,
      item.tipo_servico,
      item.servico,
      item.bairro,
      item.cidade,
      item.descricao,
    ]
      .join(" ")
      .toLowerCase();

    const matchQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    if (!matchQuery) return false;

    if (filterMode === "novos") return item.status === "aguardando_proposta";
    if (filterMode === "negociacao") return item.status === "proposta_recebida";
    if (filterMode === "perto") {
      return typeof item.distancia_km === "number" && item.distancia_km <= 12;
    }

    return true;
  });

  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
    if (sortMode === "recentes") {
      return new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime();
    }

    if (sortMode === "proximos") {
      const distanceA = typeof a.distancia_km === "number" ? a.distancia_km : Number.POSITIVE_INFINITY;
      const distanceB = typeof b.distancia_km === "number" ? b.distancia_km : Number.POSITIVE_INFINITY;
      return distanceA - distanceB;
    }

    return calcularScore(b) - calcularScore(a);
  });

  const totalPedidos = pedidos.length;
  const aguardando = pedidos.filter((item) => item.status === "aguardando_proposta").length;
  const negociando = pedidos.filter((item) => item.status === "proposta_recebida").length;
  const proximos = pedidos.filter(
    (item) => typeof item.distancia_km === "number" && item.distancia_km <= 12
  ).length;
  const completos = pedidos.filter(
    (item) =>
      Boolean((item.descricao || "").trim()) &&
      Boolean((item.bairro || "").trim()) &&
      Boolean((item.cidade || "").trim())
  ).length;
  const scoreMedio =
    pedidos.length > 0
      ? Math.round(
          pedidos.reduce((acc, item) => acc + calcularScore(item), 0) / pedidos.length
        )
      : 0;
  const melhorOportunidade = pedidosOrdenados[0] || null;

  return (
    <View style={styles.container}>
      <FlatList
        data={pedidosOrdenados}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={carregarPedidos}
            tintColor="#facc15"
          />
        }
        contentContainerStyle={pedidosOrdenados.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroEyebrow}>Painel operacional</Text>
                  <Text style={styles.title}>Pedidos disponiveis</Text>
                  <Text style={styles.subtitle}>
                    Priorize oportunidades mais proximas, com melhor contexto e resposta mais rapida.
                  </Text>
                </View>
                <View style={styles.heroPulse}>
                  <Ionicons name="pulse-outline" size={18} color="#0f172a" />
                </View>
              </View>

              <View style={styles.heroStatsRow}>
                <MetricCard label="Pipeline" value={String(totalPedidos)} tone="#facc15" icon="briefcase-outline" />
                <MetricCard label="Novos" value={String(aguardando)} tone="#22c55e" icon="flash-outline" />
                <MetricCard label="Negociacao" value={String(negociando)} tone="#38bdf8" icon="git-compare-outline" />
                <MetricCard label="Score medio" value={`${scoreMedio}`} tone="#f472b6" icon="analytics-outline" />
              </View>

              <View style={styles.heroBottom}>
                <QuickChip icon="navigate-outline" label={`${proximos} perto de voce`} />
                <QuickChip icon="timer-outline" label="Atualizacao em tempo real" />
                <QuickChip icon="rocket-outline" label="Resposta rapida aumenta conversao" />
              </View>
            </View>

            <View style={styles.adWrapper}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ofertas Mercado Livre</Text>
              </View>

              <ScrollView
                ref={bannerRef}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const x = event.nativeEvent.contentOffset.x;
                  const index = Math.round(x / BANNER_WIDTH);
                  setBannerIndex(index);
                }}
              >
                {slides.map((slide, index) => (
                  <TouchableOpacity
                    key={slide.id}
                    style={[
                      styles.adSlide,
                      index < slides.length - 1 ? styles.adSlideGap : null,
                    ]}
                    activeOpacity={0.92}
                    onPress={() => void abrirLinkPublicidade(slide.url)}
                  >
                    <View style={styles.adGlowA} />
                    <View style={styles.adGlowB} />
                    {slide.imageUrl ? (
                      <Image source={{ uri: slide.imageUrl }} style={styles.adImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.adPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#facc15" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.adDots}>
                {slides.map((slide, index) => (
                  <View
                    key={`dot-${slide.id}`}
                    style={[styles.adDot, index === bannerIndex ? styles.adDotActive : null]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.quickBoard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Radar tatico</Text>
                <Text style={styles.sectionHint}>Leitura rapida</Text>
              </View>
              <View style={styles.quickBoardGrid}>
                <MiniInsight
                  icon="document-text-outline"
                  label="Pedidos completos"
                  value={String(completos)}
                  tone="#22c55e"
                />
                <MiniInsight
                  icon="walk-outline"
                  label="Raio util"
                  value={String(proximos)}
                  tone="#38bdf8"
                />
                <MiniInsight
                  icon="flash-outline"
                  label="Janela de ataque"
                  value={aguardando > 0 ? "Alta" : "Baixa"}
                  tone="#facc15"
                />
              </View>
            </View>

            <View style={styles.commandCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Centro de oportunidades</Text>
                <Text style={styles.sectionHint}>{pedidosOrdenados.length} visiveis</Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#94a3b8" />
                <TextInput
                  placeholder="Buscar por servico, categoria, bairro ou cidade"
                  placeholderTextColor="#64748b"
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#64748b" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                <FilterChip
                  active={filterMode === "todos"}
                  label={`Todos (${totalPedidos})`}
                  onPress={() => setFilterMode("todos")}
                />
                <FilterChip
                  active={filterMode === "novos"}
                  label={`Novos (${aguardando})`}
                  onPress={() => setFilterMode("novos")}
                />
                <FilterChip
                  active={filterMode === "negociacao"}
                  label={`Negociacao (${negociando})`}
                  onPress={() => setFilterMode("negociacao")}
                />
                <FilterChip
                  active={filterMode === "perto"}
                  label={`Perto (${proximos})`}
                  onPress={() => setFilterMode("perto")}
                />
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
                <SortChip
                  active={sortMode === "score"}
                  label="Melhor score"
                  onPress={() => setSortMode("score")}
                />
                <SortChip
                  active={sortMode === "recentes"}
                  label="Mais recentes"
                  onPress={() => setSortMode("recentes")}
                />
                <SortChip
                  active={sortMode === "proximos"}
                  label="Mais proximos"
                  onPress={() => setSortMode("proximos")}
                />
              </ScrollView>

              <View style={styles.commandBanner}>
                <Text style={styles.commandBannerTitle}>Modo de captura profissional</Text>
                <Text style={styles.commandBannerText}>
                  Ataque primeiro os pedidos com score alto, localizacao definida e descricao mais completa.
                </Text>
              </View>
            </View>

            {melhorOportunidade ? (
              <TouchableOpacity
                activeOpacity={0.92}
                style={styles.priorityCard}
                onPress={() => router.push(`/(profissional)/pedidos/${melhorOportunidade.id}`)}
              >
                <View style={styles.priorityTop}>
                  <View>
                    <Text style={styles.priorityEyebrow}>Melhor oportunidade agora</Text>
                    <Text style={styles.priorityTitle}>
                      {melhorOportunidade.tipo_servico ||
                        melhorOportunidade.servico ||
                        "Servico em destaque"}
                    </Text>
                  </View>
                  <View style={styles.priorityScore}>
                    <Text style={styles.priorityScoreLabel}>Score</Text>
                    <Text style={styles.priorityScoreValue}>{calcularScore(melhorOportunidade)}</Text>
                  </View>
                </View>
                <Text style={styles.priorityMeta}>
                  {melhorOportunidade.categoria || "Categoria nao informada"} •{" "}
                  {typeof melhorOportunidade.distancia_km === "number"
                    ? `${melhorOportunidade.distancia_km} km`
                    : "Distancia indisponivel"}
                </Text>
                <Text style={styles.priorityDescription} numberOfLines={2}>
                  {melhorOportunidade.descricao || "Abra o pedido para avaliar o contexto completo e enviar proposta."}
                </Text>
                <View style={styles.priorityFooter}>
                  <View style={styles.prioritySignal}>
                    <Ionicons name="flash-outline" size={14} color="#022c22" />
                    <Text style={styles.prioritySignalText}>Responder primeiro aumenta destaque</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={24} color="#022c22" />
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.actionDock}>
              <TouchableOpacity
                style={styles.actionDockBtn}
                onPress={() => router.push("/(profissional)/(internas)/chamados-rapidos")}
              >
                <Ionicons name="flash-outline" size={16} color="#f8fafc" />
                <Text style={styles.actionDockText}>Chamados rapidos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionDockBtn}
                onPress={() => router.push("/(profissional)/financeiro")}
              >
                <Ionicons name="wallet-outline" size={16} color="#f8fafc" />
                <Text style={styles.actionDockText}>Financeiro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionDockBtn}
                onPress={() => router.push("/(profissional)/menu")}
              >
                <Ionicons name="grid-outline" size={16} color="#f8fafc" />
                <Text style={styles.actionDockText}>Mais ferramentas</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#facc15" style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={32} color="#facc15" />
              <Text style={styles.emptyTitle}>Nenhuma oportunidade encontrada</Text>
              <Text style={styles.emptyText}>
                Ajuste os filtros ou atualize a tela para capturar novas oportunidades em tempo real.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const score = calcularScore(item);
          const urgencyColor = getUrgencyColor(score);
          const local = [item.bairro || "", item.cidade || ""].filter(Boolean).join(" • ");

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(profissional)/pedidos/${item.id}`)}
              activeOpacity={0.92}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <View style={[styles.statusPill, item.status === "proposta_recebida" ? styles.statusNegotiation : styles.statusNew]}>
                    <Text style={styles.statusPillText}>
                      {item.status === "proposta_recebida" ? "Negociacao" : "Nova oportunidade"}
                    </Text>
                  </View>
                  <Text style={styles.cardTime}>{formatDateLabel(item.created_at)}</Text>
                </View>

                <View style={[styles.scoreCard, { borderColor: urgencyColor }]}>
                  <Text style={styles.scoreLabel}>Score</Text>
                  <Text style={[styles.scoreValue, { color: urgencyColor }]}>{score}</Text>
                </View>
              </View>

              <Text style={styles.cardCategory}>{item.categoria || "Categoria nao informada"}</Text>
              <Text style={styles.cardService}>{item.tipo_servico || item.servico || "Servico nao informado"}</Text>

              <View style={styles.signalRow}>
                <SignalTag icon="location-outline" label={local || "Local nao informado"} />
                <SignalTag
                  icon="navigate-outline"
                  label={
                    typeof item.distancia_km === "number"
                      ? `${item.distancia_km} km`
                      : "Distancia indisponivel"
                  }
                />
              </View>

              <Text style={styles.cardDescription} numberOfLines={3}>
                {item.descricao || "Sem descricao detalhada informada pelo cliente."}
              </Text>

              <View style={styles.insightBox}>
                <Ionicons name="bulb-outline" size={16} color="#facc15" />
                <Text style={styles.insightText}>
                  {score >= 85
                    ? "Oportunidade muito forte para resposta imediata."
                    : score >= 65
                    ? "Bom potencial de conversao com proposta objetiva."
                    : "Vale avaliar disponibilidade antes de entrar na disputa."}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.cardFooterLeft}>
                  <Ionicons name="flash-outline" size={15} color="#22c55e" />
                  <Text style={styles.cardFooterText}>Responder rapido melhora destaque</Text>
                </View>
                <View style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Abrir pedido</Text>
                  <Ionicons name="arrow-forward" size={14} color="#03111f" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${tone}22` }]}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function QuickChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.quickChip}>
      <Ionicons name={icon} size={14} color="#cbd5e1" />
      <Text style={styles.quickChipText}>{label}</Text>
    </View>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active ? styles.filterChipActive : null]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SortChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sortChip, active ? styles.sortChipActive : null]}
      onPress={onPress}
    >
      <Text style={[styles.sortChipText, active ? styles.sortChipTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SignalTag({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.signalTag}>
      <Ionicons name={icon} size={14} color="#7dd3fc" />
      <Text style={styles.signalTagText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function MiniInsight({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View style={styles.miniInsightCard}>
      <View style={[styles.miniInsightIcon, { backgroundColor: `${tone}22` }]}>
        <Ionicons name={icon} size={15} color={tone} />
      </View>
      <Text style={styles.miniInsightLabel}>{label}</Text>
      <Text style={[styles.miniInsightValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroEyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroPulse: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "92%",
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  metricCard: {
    width: "47%",
    minWidth: 145,
    backgroundColor: "#0d1a30",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#244267",
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
  },
  heroBottom: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0b172c",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#274264",
  },
  quickChipText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  adWrapper: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
  },
  adSlide: {
    width: BANNER_WIDTH,
    minHeight: 232,
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#39506f",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
    overflow: "hidden",
  },
  adSlideGap: {
    marginRight: 12,
  },
  adGlowA: {
    position: "absolute",
    top: -20,
    right: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#facc1533",
  },
  adGlowB: {
    position: "absolute",
    bottom: -30,
    left: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#38bdf822",
  },
  adTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  adBadge: {
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adBadgeText: {
    color: "#111827",
    fontSize: 11,
    fontWeight: "900",
  },
  adCtaPill: {
    backgroundColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adCtaPillText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
  },
  adImage: {
    width: "100%",
    height: 110,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#0f172a",
  },
  adPlaceholder: {
    height: 110,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#172036",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#3d5476",
  },
  adPlaceholderText: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "700",
  },
  adTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6,
    maxWidth: "88%",
  },
  adText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 19,
  },
  adInsightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  adInsightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#172036",
    borderWidth: 1,
    borderColor: "#2a3a57",
  },
  adInsightText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "800",
  },
  adFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adFooterMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adFooterMetricText: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "700",
  },
  adDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  adDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#334155",
  },
  adDotActive: {
    width: 22,
    backgroundColor: "#facc15",
  },
  commandCard: {
    backgroundColor: "#081121",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#26466f",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0c172d",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#304767",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#f8fafc",
    paddingVertical: 0,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  sortRow: {
    gap: 8,
    paddingBottom: 4,
    marginTop: 10,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#324867",
  },
  filterChipActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  filterChipText: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: "#111827",
  },
  sortChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#101c32",
    borderWidth: 1,
    borderColor: "#38506f",
  },
  sortChipActive: {
    backgroundColor: "#e2e8f0",
    borderColor: "#e2e8f0",
  },
  sortChipText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
  },
  sortChipTextActive: {
    color: "#0f172a",
  },
  commandBanner: {
    marginTop: 14,
    backgroundColor: "#0d1a30",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#315071",
  },
  priorityCard: {
    backgroundColor: "#facc15",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  priorityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  priorityEyebrow: {
    color: "#78350f",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priorityTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    maxWidth: 220,
  },
  priorityScore: {
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priorityScoreLabel: {
    color: "#9a3412",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  priorityScoreValue: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  priorityMeta: {
    color: "#78350f",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  priorityDescription: {
    color: "#1f2937",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  priorityFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  prioritySignal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
  },
  prioritySignalText: {
    color: "#022c22",
    fontSize: 12,
    fontWeight: "800",
  },
  quickBoard: {
    backgroundColor: "#081121",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#26466f",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 16,
  },
  quickBoardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  miniInsightCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#0d1a30",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#315071",
    padding: 12,
  },
  miniInsightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  miniInsightLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  miniInsightValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "900",
  },
  actionDock: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionDockBtn: {
    flex: 1,
    backgroundColor: "#0d1a30",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#315071",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionDockText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  commandBannerTitle: {
    color: "#ffffff",
    fontWeight: "800",
    marginBottom: 4,
  },
  commandBannerText: {
    color: "#94a3b8",
    lineHeight: 18,
    fontSize: 12,
  },
  card: {
    backgroundColor: "#0a1324",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2a4467",
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
    paddingRight: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusNew: {
    backgroundColor: "#14532d",
  },
  statusNegotiation: {
    backgroundColor: "#0f3b5f",
  },
  statusPillText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "900",
  },
  cardTime: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  scoreCard: {
    minWidth: 68,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#0b172c",
  },
  scoreLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  cardCategory: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  cardService: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 10,
  },
  signalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  signalTag: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0e1b31",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#30496b",
  },
  signalTagText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 210,
  },
  cardDescription: {
    color: "#94a3b8",
    lineHeight: 20,
    fontSize: 13,
    marginBottom: 12,
  },
  insightBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#111b2f",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#39506f",
  },
  insightText: {
    flex: 1,
    color: "#e2e8f0",
    lineHeight: 18,
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  cardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  cardFooterText: {
    color: "#86efac",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#facc15",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryActionText: {
    color: "#03111f",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 18,
    marginTop: 14,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
