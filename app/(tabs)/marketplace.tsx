import { Ionicons } from "@expo/vector-icons";
import { getCartItems } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
const { width } = Dimensions.get("window");
const STORE_LIST_HORIZONTAL_PADDING = 16;
const STORE_CARD_GAP = 12;
const STORE_CARD_WIDTH =
  (width - STORE_LIST_HORIZONTAL_PADDING * 2 - STORE_CARD_GAP) / 2;
const CATEGORIAS_RAPIDAS = [
  "Todos",
  "Material Hidraulico",
  "Drywall",
  "Gesso",
  "Madeira",
  "PVC",
  "Eletrico",
  "Tintas",
  "Ferragens",
  "Pisos",
  "Revestimentos",
  "Iluminacao",
  "Ferramentas",
  "Acessorios para Banheiro",
  "Jardinagem",
  "Decoracao",
];

type Loja = {
  fornecedorId: string;
  nome: string;
  categoria: string;
  cidade: string;
  produtosAtivos: number;
  banner: string;
  distanciaKm: number | null;
};

type FornecedorNoRaio = {
  fornecedor_id: string;
  nome: string;
  cidade: string;
  distancia_km: number;
  raio_fornecedor_km: number;
};

const fallbackBanner =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=60";
const coverBanner =
  "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1600&q=70";

function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function loadMarketplaceStores({
  tenantId,
  fornecedorIds,
}: {
  tenantId: string | null;
  fornecedorIds?: string[];
}) {
  const profissionaisBase = supabase
    .from("profissionais")
    .select("user_id, fornecedor_categoria, fornecedor_nome_fantasia, fornecedor_ativo, fornecedor_capa_url");
  const produtosBase = supabase
    .from("produtos_fornecedor")
    .select("fornecedor_id, imagem_url")
    .eq("ativo", true);

  const profissionaisScoped = tenantId ? profissionaisBase.eq("tenant_id", tenantId) : profissionaisBase;
  const produtosScoped = tenantId ? produtosBase.eq("tenant_id", tenantId) : produtosBase;

  const profissionaisQuery = fornecedorIds?.length
    ? profissionaisScoped.in("user_id", fornecedorIds).eq("fornecedor_ativo", true)
    : profissionaisScoped.eq("fornecedor_ativo", true);
  const produtosQuery = fornecedorIds?.length ? produtosScoped.in("fornecedor_id", fornecedorIds) : produtosScoped;

  const [{ data: profissionais }, { data: produtos }] = await Promise.all([profissionaisQuery, produtosQuery]);

  const profissionalMap = new Map((profissionais || []).map((p: any) => [String(p.user_id), p]));
  const produtoStats = new Map<string, { count: number; banner: string }>();

  for (const row of (produtos || []) as any[]) {
    const fornecedorId = String(row.fornecedor_id || "");
    if (!fornecedorId) continue;
    const banner = String(row.imagem_url || "").trim() || fallbackBanner;
    const current = produtoStats.get(fornecedorId);
    if (!current) {
      produtoStats.set(fornecedorId, { count: 1, banner });
    } else {
      current.count += 1;
    }
  }

  const baseIds = fornecedorIds?.length
    ? fornecedorIds
    : Array.from(new Set([
        ...Array.from(profissionalMap.keys()),
        ...Array.from(produtoStats.keys()),
      ]));

  return baseIds
    .filter(Boolean)
    .map((fornecedorId) => {
      const prof = profissionalMap.get(fornecedorId);
      return {
        fornecedorId,
        nome: String(prof?.fornecedor_nome_fantasia || "").trim() || "Loja parceira",
        categoria: String(prof?.fornecedor_categoria || "Marketplace"),
        cidade: "",
        produtosAtivos: produtoStats.get(fornecedorId)?.count || 0,
        banner:
          String(prof?.fornecedor_capa_url || "").trim() ||
          produtoStats.get(fornecedorId)?.banner ||
          fallbackBanner,
        distanciaKm: null,
      } satisfies Loja;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fornecedorId?: string }>();

  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>(String(params.fornecedorId || ""));
  const [selectedRamo, setSelectedRamo] = useState<string>("Todos");
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    setSelectedStore(String(params.fornecedorId || ""));
  }, [params.fornecedorId]);

  const loadCartCount = useCallback(async () => {
    const items = await getCartItems();
    setCartCount(items.reduce((acc, item) => acc + item.quantity, 0));
  }, []);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      setLocationDenied(false);
      const tenantId = await resolveCurrentTenantId();

      const permission = await Location.getForegroundPermissionsAsync();
      let granted = permission.granted;
      if (!granted) {
        const requested = await Location.requestForegroundPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        setLocationDenied(true);
        const fallbackStores = await loadMarketplaceStores({ tenantId });
        setLojas(fallbackStores);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { data: raioData, error: raioError } = await supabase.rpc("listar_fornecedores_no_raio", {
        p_latitude: location.coords.latitude,
        p_longitude: location.coords.longitude,
        p_raio_cliente_km: 30,
        p_limite: 300,
      });

      if (raioError) throw raioError;

      const fornecedoresNoRaio = ((raioData || []) as FornecedorNoRaio[]).filter(
        (row) => String(row.fornecedor_id || "").trim().length > 0
      );

      if (fornecedoresNoRaio.length === 0) {
        setLojas([]);
        return;
      }

      const fornecedorIds = [...new Set(fornecedoresNoRaio.map((row) => String(row.fornecedor_id || "")))].filter(Boolean);

      const mappedBase = await loadMarketplaceStores({ tenantId, fornecedorIds });
      const mapped: Loja[] = fornecedoresNoRaio
        .map((item) => {
          const fornecedorId = String(item.fornecedor_id);
          const base = mappedBase.find((store) => store.fornecedorId === fornecedorId);
          const nomeRpc = String(item.nome || "").trim();

          return {
            fornecedorId,
            nome: base?.nome || nomeRpc || "Loja sem nome fantasia",
            categoria: base?.categoria || "Marketplace",
            cidade: String(item.cidade || "").trim(),
            produtosAtivos: base?.produtosAtivos || 0,
            banner: base?.banner || fallbackBanner,
            distanciaKm: Number(item.distancia_km || 0),
          };
        })
        .sort((a, b) => a.distanciaKm - b.distanciaKm);

      setLojas(mapped);
    } catch (error) {
      console.log("ERRO MARKETPLACE LOJAS:", error);
      setLojas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCartCount();
      void loadStores();
    }, [loadCartCount, loadStores])
  );

  const ramosDisponiveis = useMemo(() => {
    const dinamicos = Array.from(
      new Set(
        lojas
          .map((loja) => String(loja.categoria || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const base = [...CATEGORIAS_RAPIDAS];
    for (const item of dinamicos) {
      if (!base.some((b) => normalizeText(b) === normalizeText(item))) {
        base.push(item);
      }
    }
    return base;
  }, [lojas]);

  const filteredLojas = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return lojas.filter((loja) => {
      if (selectedStore && loja.fornecedorId !== selectedStore) return false;
      if (selectedRamo !== "Todos") {
        const ramoSelecionado = normalizeText(selectedRamo);
        const ramoLoja = normalizeText(loja.categoria);
        if (!ramoLoja.includes(ramoSelecionado) && !ramoSelecionado.includes(ramoLoja)) {
          return false;
        }
      }
      if (!normalizedQuery) return true;

      return (
        loja.nome.toLowerCase().includes(normalizedQuery) ||
        loja.categoria.toLowerCase().includes(normalizedQuery) ||
        loja.cidade.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [lojas, query, selectedStore, selectedRamo]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} overScrollMode="never">
      <ImageBackground source={{ uri: coverBanner }} style={styles.cover} imageStyle={styles.coverImage} fadeDuration={0}>
        <View style={styles.coverOverlay} />
        <View style={styles.coverContent}>
          <Text style={styles.coverTitle}>Marketplace de Lojas</Text>
          <Text style={styles.coverSubtitle}>
            Aqui você encontra as lojas disponíveis em sua região.
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Lojas disponíveis</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/compras",
                params: { from: "marketplace" },
              })
            }
          >
            <Ionicons name="receipt-outline" size={17} color="#111827" />
            <Text style={styles.ordersBtnText}>Compras</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/carrinho",
                params: { from: "marketplace" },
              })
            }
          >
            <Ionicons name="cart-outline" size={20} color="#111827" />
            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.92} style={styles.gasPromoCard} onPress={() => router.push("/(tabs)/gas")}>
        <ImageBackground
          source={require("../../assets/images/gas/cover.png")}
          style={styles.gasPromoSurface}
          imageStyle={styles.gasPromoImage}
          fadeDuration={0}
        >
          <View style={styles.gasPromoOverlay} />
          <View style={styles.gasPromoContent}>
            <Text style={styles.gasPromoEyebrow}>Nova categoria em destaque</Text>
            <Text style={styles.gasPromoTitle}>Gás de Cozinha</Text>
            <Text style={styles.gasPromoSubtitle}>
              Entrega rápida em Itajubá e região, com uma experiência própria dentro do app.
            </Text>
            <View style={styles.gasPromoFooter}>
              <Text style={styles.gasPromoAction}>Abrir vertical de gás</Text>
              <Ionicons name="arrow-forward" size={18} color="#fcd34d" />
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <TextInput
        style={styles.search}
        placeholder="Buscar loja por nome, ramo ou cidade"
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
      />

      <Text style={styles.filterSectionTitle}>Categorias das lojas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storeRow}>
        {ramosDisponiveis.map((ramo) => (
          <TouchableOpacity
            key={ramo}
            style={[styles.filterChip, selectedRamo === ramo ? styles.filterChipActive : null]}
            onPress={() => setSelectedRamo(ramo)}
          >
            <Text style={[styles.filterChipText, selectedRamo === ramo ? styles.filterChipTextActive : null]} numberOfLines={1}>
              {ramo}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.filterSectionTitle}>Lojas</Text>

      {loading ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Carregando lojas disponíveis na sua região...</Text>
        </View>
      ) : null}

      {!loading && filteredLojas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {locationDenied
              ? "A localização está desativada. Exibimos as lojas parceiras disponíveis no app."
              : "Nenhuma loja disponível no seu raio de busca no momento."}
          </Text>
        </View>
      ) : null}

      <View style={styles.storeList}>
        {filteredLojas.map((loja) => (
          <View key={loja.fornecedorId} style={styles.storeCard}>
            <ImageBackground source={{ uri: loja.banner }} style={styles.storeBanner} imageStyle={styles.storeBannerImage} />
            <View style={styles.storeCardBody}>
              <Text style={styles.storeName}>{loja.nome}</Text>
              <Text style={styles.storeMeta}>{loja.categoria}</Text>
              <Text style={styles.storeMetaSecondary}>
                {loja.cidade ? `${loja.cidade} • ` : ""}
                {loja.distanciaKm !== null ? `${loja.distanciaKm.toFixed(1)} km de você • ` : ""}
                {loja.produtosAtivos} produtos
              </Text>
              {loja.produtosAtivos === 0 ? (
                <View style={styles.storeStatusBadge}>
                  <Text style={styles.storeStatusBadgeText}>Sem produtos no momento</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.storeAccessBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/lojas/[fornecedorId]",
                    params: { fornecedorId: loja.fornecedorId },
                  })
                }
              >
                <Text style={styles.storeAccessBtnText}>Acessar loja</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#05070d" },
  content: { paddingBottom: 120 },
  cover: { height: 180, justifyContent: "flex-end" },
  coverImage: {},
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,4,10,0.55)" },
  coverContent: { paddingHorizontal: 16, paddingBottom: 14 },
  coverTitle: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  coverSubtitle: { color: "#e2e8f0", marginTop: 6, maxWidth: 760 },

  headerBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, marginTop: 14 },
  headerTitle: { color: "#facc15", fontSize: 24, fontWeight: "900" },
  headerSub: { color: "#94a3b8", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  gasPromoCard: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  gasPromoSurface: {
    position: "relative",
    minHeight: 208,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
    shadowColor: "#020617",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  gasPromoImage: {
    borderRadius: 24,
    resizeMode: "cover",
  },
  gasPromoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.64)",
  },
  gasPromoContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
  },
  gasPromoEyebrow: {
    color: "#fcd34d",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  gasPromoTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    maxWidth: "78%",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gasPromoSubtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: "78%",
  },
  gasPromoFooter: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gasPromoAction: {
    color: "#fcd34d",
    fontSize: 14,
    fontWeight: "900",
  },
  ordersBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#facc15",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    shadowColor: "#facc15",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  ordersBtnText: { color: "#111827", fontSize: 12, fontWeight: "900" },
  cartBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#facc15",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#facc15",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 20,
    paddingHorizontal: 5,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  cartBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  search: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterSectionTitle: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
    marginHorizontal: 16,
  },

  storeRow: { gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 220,
  },
  filterChipActive: { borderColor: "#facc15", backgroundColor: "#3a2f0b" },
  filterChipText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  filterChipTextActive: { color: "#fde68a" },

  loadingCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
  },
  loadingText: { color: "#94a3b8" },

  storeList: {
    paddingHorizontal: STORE_LIST_HORIZONTAL_PADDING,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: STORE_CARD_GAP,
    rowGap: 12,
  },
  storeCard: {
    width: STORE_CARD_WIDTH,
    backgroundColor: "#0b1220",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  storeBanner: { height: 100, backgroundColor: "#111827" },
  storeBannerImage: { resizeMode: "cover" },
  storeCardBody: { padding: 12 },
  storeName: { color: "#f8fafc", fontWeight: "900", fontSize: 14 },
  storeMeta: { color: "#e2e8f0", marginTop: 3, fontWeight: "700", fontSize: 12 },
  storeMetaSecondary: { color: "#94a3b8", marginTop: 2, fontSize: 11 },
  storeStatusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(239, 68, 68, 0.22)",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  storeStatusBadgeText: {
    color: "#fecaca",
    fontSize: 11,
    fontWeight: "800",
  },
  storeAccessBtn: {
    marginTop: 10,
    alignSelf: "stretch",
    backgroundColor: "#facc15",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  storeAccessBtnText: { color: "#000", fontWeight: "900" },

  emptyCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 14,
  },
  emptyText: { color: "#94a3b8" },
});
