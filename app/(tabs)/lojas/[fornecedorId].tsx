import { addToCart, formatMoney, getCartItems } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

type ProdutoLoja = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  price: number;
  priceFrom?: number | null;
  stock: number;
  supplierName: string;
  rating: number;
  sold: number;
};

type SortMode = "relevance" | "price_asc" | "price_desc";
type PriceRange = "all" | "up_50" | "50_150" | "150_300" | "300_plus";

const fallbackBanner =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=60";

export default function LojaDetalheScreen() {
  const { fornecedorId } = useLocalSearchParams<{ fornecedorId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [storeName, setStoreName] = useState("Loja");
  const [storeCategory, setStoreCategory] = useState("Marketplace");
  const [bannerUrl, setBannerUrl] = useState(fallbackBanner);
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>("all");
  const [showAddedToast, setShowAddedToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const load = useCallback(async () => {
    if (!fornecedorId) return;
    setLoading(true);
    try {
      let tenantId: string | null = null;
      try {
        tenantId = await ensureCurrentUserTenantContext();
      } catch {
        try {
          tenantId = await getCurrentTenantId();
        } catch {
          tenantId = null;
        }
      }

      const [cartItems, productsRes, profileRes, profissionalRes] = await Promise.all([
        getCartItems(),
        tenantId
          ? supabase
              .from("produtos_fornecedor")
              .select("id, titulo, descricao, categoria, preco, preco_de, preco_por, estoque, imagem_url, ativo")
              .eq("fornecedor_id", fornecedorId)
              .eq("ativo", true)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
          : supabase
              .from("produtos_fornecedor")
              .select("id, titulo, descricao, categoria, preco, preco_de, preco_por, estoque, imagem_url, ativo")
              .eq("fornecedor_id", fornecedorId)
              .eq("ativo", true)
              .order("created_at", { ascending: false }),
        tenantId
          ? supabase.from("profiles").select("name").eq("id", fornecedorId).eq("tenant_id", tenantId).maybeSingle()
          : supabase.from("profiles").select("name").eq("id", fornecedorId).maybeSingle(),
        tenantId
          ? supabase
              .from("profissionais")
              .select("fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_capa_url")
              .eq("user_id", fornecedorId)
              .eq("tenant_id", tenantId)
              .maybeSingle()
          : supabase
              .from("profissionais")
              .select("fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_capa_url")
              .eq("user_id", fornecedorId)
              .maybeSingle(),
      ]);

      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));

      const prof = profissionalRes.data as any;
      const profile = profileRes.data as any;
      setStoreName(
        String(prof?.fornecedor_nome_fantasia || "").trim() ||
          String(profile?.name || "").trim() ||
          "Loja"
      );
      setStoreCategory(String(prof?.fornecedor_categoria || "Marketplace"));

      const rows = (productsRes.data || []) as any[];
      const capaUrl = String(prof?.fornecedor_capa_url || "").trim();
      if (capaUrl) {
        setBannerUrl(capaUrl);
      } else if (rows.length > 0 && String(rows[0].imagem_url || "").trim()) {
        setBannerUrl(String(rows[0].imagem_url));
      } else {
        setBannerUrl(fallbackBanner);
      }

      const mapped: ProdutoLoja[] = rows.map((row) => ({
        ...(Number(row.preco_por || 0) > 0
          ? { priceFrom: Number(row.preco_de || row.preco || 0) }
          : { priceFrom: null }),
        id: String(row.id),
        title: String(row.titulo || "Produto"),
        subtitle: String(row.descricao || "Sem descrição"),
        category: String(row.categoria || "Outros"),
        image:
          String(row.imagem_url || "").trim() ||
          "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=60",
        price: Number(row.preco || 0),
        stock: Number(row.estoque || 0),
        rating: 4.6 + (Number(row.preco || 0) % 4) / 10,
        sold: 12 + (Number(row.estoque || 0) % 80),
        supplierName:
          String(prof?.fornecedor_nome_fantasia || "").trim() ||
          String(profile?.name || "").trim() ||
          "Loja",
      }));
      setProdutos(mapped);
    } finally {
      setLoading(false);
    }
  }, [fornecedorId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function handleAdd(product: ProdutoLoja) {
    await addToCart(
      {
        id: product.id,
        fornecedorId: String(fornecedorId),
        fornecedorNome: product.supplierName,
        title: product.title,
        subtitle: product.subtitle,
        category: product.category,
        image: product.image,
        price: product.price,
        rating: 4.8,
        stock: product.stock,
        deliveryKm: 15,
      },
      1
    );
    const cartItems = await getCartItems();
    setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    if (Platform.OS === "android") {
      ToastAndroid.show("Adicionado ao carrinho!", ToastAndroid.SHORT);
      return;
    }
    setShowAddedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowAddedToast(false), 1400);
  }

  const title = useMemo(() => `${storeName} • ${produtos.length} produtos`, [storeName, produtos.length]);
  const categoriasDisponiveis = useMemo(() => {
    const values = Array.from(new Set(produtos.map((p) => p.category).filter(Boolean)));
    return ["Todas", ...values];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((product) => {
      const byCategory = selectedCategory === "Todas" || product.category === selectedCategory;
      const byPrice =
        selectedPriceRange === "all" ||
        (selectedPriceRange === "up_50" && product.price <= 50) ||
        (selectedPriceRange === "50_150" && product.price > 50 && product.price <= 150) ||
        (selectedPriceRange === "150_300" && product.price > 150 && product.price <= 300) ||
        (selectedPriceRange === "300_plus" && product.price > 300);

      return byCategory && byPrice;
    });
  }, [produtos, selectedCategory, selectedPriceRange]);

  const produtosOrdenados = useMemo(() => {
    const cloned = [...produtosFiltrados];
    if (sortMode === "price_asc") return cloned.sort((a, b) => a.price - b.price);
    if (sortMode === "price_desc") return cloned.sort((a, b) => b.price - a.price);
    return cloned.sort((a, b) => (b.rating * 100 + b.sold) - (a.rating * 100 + a.sold));
  }, [produtosFiltrados, sortMode]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} overScrollMode="never">
      <ImageBackground
        source={{ uri: bannerUrl }}
        style={styles.banner}
        imageStyle={styles.bannerImage}
        fadeDuration={0}
      >
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerContent}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.storeMeta}>{storeCategory}</Text>
          <Text style={styles.storeSub}>{title}</Text>
        </View>
      </ImageBackground>

      <View style={styles.topActions}>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color="#111827" />
          <Text style={styles.outlineBtnText}>Voltar</Text>
        </TouchableOpacity>
        <View style={styles.topActionsRight}>
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/compras",
                params: { from: "loja", fornecedorId: String(fornecedorId || "") },
              })
            }
          >
            <Ionicons name="receipt-outline" size={16} color="#111827" />
            <Text style={styles.ordersBtnText}>Compras</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/carrinho",
                params: { from: "loja", fornecedorId: String(fornecedorId || "") },
              })
            }
          >
            <Ionicons name="cart-outline" size={18} color="#111827" />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>Compra</Text>
          <Text style={styles.kpiLabel}>protegida pela plataforma</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>Pagamento</Text>
          <Text style={styles.kpiLabel}>seguro e rastreável</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>⭐ 4.8</Text>
          <Text style={styles.kpiLabel}>Reputação</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        <TouchableOpacity
          style={[styles.sortChip, sortMode === "relevance" ? styles.sortChipActive : null]}
          onPress={() => setSortMode("relevance")}
        >
          <Text style={[styles.sortText, sortMode === "relevance" ? styles.sortTextActive : null]}>
            Relevância
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortMode === "price_asc" ? styles.sortChipActive : null]}
          onPress={() => setSortMode("price_asc")}
        >
          <Text style={[styles.sortText, sortMode === "price_asc" ? styles.sortTextActive : null]}>
            Menor preço
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortMode === "price_desc" ? styles.sortChipActive : null]}
          onPress={() => setSortMode("price_desc")}
        >
          <Text style={[styles.sortText, sortMode === "price_desc" ? styles.sortTextActive : null]}>
            Maior preço
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {categoriasDisponiveis.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.filterChip, selectedCategory === category ? styles.filterChipActive : null]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.filterText, selectedCategory === category ? styles.filterTextActive : null]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedPriceRange === "all" ? styles.filterChipActive : null]}
          onPress={() => setSelectedPriceRange("all")}
        >
          <Text style={[styles.filterText, selectedPriceRange === "all" ? styles.filterTextActive : null]}>
            Todos preços
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedPriceRange === "up_50" ? styles.filterChipActive : null]}
          onPress={() => setSelectedPriceRange("up_50")}
        >
          <Text style={[styles.filterText, selectedPriceRange === "up_50" ? styles.filterTextActive : null]}>
            Até R$ 50
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedPriceRange === "50_150" ? styles.filterChipActive : null]}
          onPress={() => setSelectedPriceRange("50_150")}
        >
          <Text style={[styles.filterText, selectedPriceRange === "50_150" ? styles.filterTextActive : null]}>
            R$ 50 a R$ 150
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedPriceRange === "150_300" ? styles.filterChipActive : null]}
          onPress={() => setSelectedPriceRange("150_300")}
        >
          <Text style={[styles.filterText, selectedPriceRange === "150_300" ? styles.filterTextActive : null]}>
            R$ 150 a R$ 300
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedPriceRange === "300_plus" ? styles.filterChipActive : null]}
          onPress={() => setSelectedPriceRange("300_plus")}
        >
          <Text style={[styles.filterText, selectedPriceRange === "300_plus" ? styles.filterTextActive : null]}>
            Acima de R$ 300
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? <ActivityIndicator color="#facc15" style={{ marginTop: 20 }} /> : null}

      {!loading && produtos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Esta loja ainda não possui produtos ativos.</Text>
        </View>
      ) : null}

      {!loading ? (
        <View style={styles.grid}>
          {produtosOrdenados.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} style={styles.image} fadeDuration={0} />
              <View style={styles.body}>
                <Text numberOfLines={1} style={styles.productTitle}>
                  {product.title}
                </Text>
                <Text numberOfLines={2} style={styles.productSubtitle}>
                  {product.subtitle}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Estoque {product.stock}</Text>
                </View>
                <View style={styles.bottomRow}>
                  {Number(product.priceFrom || 0) > 0 ? (
                    <Text style={styles.priceFrom}>De: {formatMoney(Number(product.priceFrom || 0))}</Text>
                  ) : null}
                  <Text style={styles.price}>
                    {Number(product.priceFrom || 0) > 0 ? `Por: ${formatMoney(product.price)}` : formatMoney(product.price)}
                  </Text>
                  <Text style={styles.installments}>em 12x de {formatMoney(product.price / 12)}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(product)}>
                  <Text style={styles.addBtnText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {showAddedToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Adicionado ao carrinho!</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#05070d" },
  content: { paddingBottom: 120 },
  banner: { height: 220, justifyContent: "flex-end", backfaceVisibility: "hidden" },
  bannerImage: {},
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerContent: { padding: 16 },
  storeName: { color: "#fff", fontSize: 28, fontWeight: "900" },
  storeMeta: { color: "#facc15", marginTop: 2, fontWeight: "700" },
  storeSub: { color: "#e2e8f0", marginTop: 4 },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
  },
  topActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  kpiValue: { color: "#f8fafc", fontWeight: "900", fontSize: 15 },
  kpiLabel: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  sortRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  sortChip: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0b1220",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sortChipActive: {
    borderColor: "#facc15",
    backgroundColor: "#3a2f0b",
  },
  sortText: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: 12,
  },
  sortTextActive: {
    color: "#fde68a",
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0b1220",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: "#60a5fa",
    backgroundColor: "#13233f",
  },
  filterText: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 12,
  },
  filterTextActive: {
    color: "#bfdbfe",
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#facc15",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#facc15",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  outlineBtnText: { color: "#111827", fontWeight: "900" },
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
  ordersBtnText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "900",
  },
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
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 10 },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  productCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    width: "48.4%",
    minWidth: 160,
  },
  image: { width: "100%", aspectRatio: 0.75, backgroundColor: "#111827" },
  body: { padding: 12 },
  productTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 15 },
  productSubtitle: { color: "#94a3b8", marginTop: 2, fontSize: 12, minHeight: 34 },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniBadgeText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaText: { color: "#94a3b8", fontSize: 12 },
  soldText: { color: "#7dd3fc", fontSize: 12, marginTop: 6, fontWeight: "700" },
  bottomRow: {
    marginTop: 10,
  },
  priceFrom: {
    color: "#94a3b8",
    fontSize: 11,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  price: { color: "#22c55e", fontWeight: "900", fontSize: 17 },
  installments: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  addBtn: {
    marginTop: 10,
    backgroundColor: "#facc15",
    borderRadius: 9,
    width: "100%",
    paddingVertical: 8,
    alignItems: "center",
  },
  addBtnText: { color: "#000", fontWeight: "900" },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
  },
  emptyText: { color: "#94a3b8" },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  toastText: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 13,
  },
});
