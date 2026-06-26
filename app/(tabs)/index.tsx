import { Ionicons } from "@expo/vector-icons";
import { RemoteImageWithFallback } from "@/components/RemoteImageWithFallback";
import { supabase } from "@/lib/supabase";
import { useBranding } from "@/hooks/useBranding";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { categoriasGrandes } from "@/constants/categorias";
import * as Location from "expo-location";
import {
  ActivityIndicator,
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
const FORNECEDOR_CARD_WIDTH = width - 64;
const BANNER_ITEM_WIDTH = width - 40;
const BANNER_ITEM_GAP = 12;
const BANNER_AUTOPLAY_MS = 4000;
const FORNECEDOR_FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=60";
const normalizarTexto = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const extrairPrimeiroNome = (nome: string) => {
  const limpo = String(nome || "").trim();
  if (!limpo) return "Cliente";
  return limpo.split(/\s+/)[0] || "Cliente";
};

type FornecedorProximo = {
  fornecedor_id: string;
  nome: string;
  bairro?: string;
  cidade: string;
  distancia_km: number;
  raio_fornecedor_km: number;
  categoria?: string;
  banner?: string;
};

/* =========================
   12 CATEGORIAS PEQUENAS
========================= */

const categorias = [
  { id: "1", titulo: "Assistência", slug: "assistencia", icon: "settings-outline" },
  { id: "2", titulo: "Reformas", slug: "reformas", icon: "hammer-outline" },
  { id: "3", titulo: "Eventos", slug: "eventos", icon: "wine-outline" },
  { id: "4", titulo: "Domésticos", slug: "domesticos", icon: "home-outline" },
  { id: "5", titulo: "Aulas", slug: "aulas", icon: "book-outline" },
  { id: "6", titulo: "Beleza", slug: "beleza", icon: "sparkles-outline" },
  { id: "7", titulo: "Tecnologia", slug: "tecnologia", icon: "laptop-outline" },
  { id: "8", titulo: "Consultoria", slug: "consultoria", icon: "people-outline" },
  { id: "9", titulo: "Saúde", slug: "saude", icon: "heart-outline" },
  { id: "10", titulo: "Automóveis", slug: "automoveis", icon: "car-outline" },
  { id: "11", titulo: "Imóveis", slug: "imoveis", icon: "business-outline" },
  { id: "12", titulo: "Negócios", slug: "negocios", icon: "briefcase-outline" },
];

/* =========================
   CARROSSEL PUBLICITÁRIO
========================= */

const banners = [
  {
    id: "gas",
    titulo: "Gás de Cozinha",
    imagem: require("../../assets/images/gas/cover.png"),
    mostrarTitulo: false,
    resizeMode: "contain" as const,
    acao: "gas" as const,
  },
  {
    id: "1",
    titulo: "Seja um Profissional Premium",
    imagem: require("../../assets/images/banner-seja-profissional-premium.png"),
    mostrarTitulo: false,
    acao: "cadastro_profissional" as const,
  },
  {
    id: "2",
    titulo: "Solicitar orçamento grátis",
    imagem: require("../../assets/images/banner-orcamento-gratis.png"),
    mostrarTitulo: false,
    acao: "categoria" as const,
    slug: "reformas",
  },
  {
    id: "3",
    titulo: "Beleza Premium",
    imagem: require("../../assets/images/banner-beleza.png"),
    mostrarTitulo: false,
    acao: "categoria" as const,
    slug: "beleza",
  },
  {
    id: "4",
    titulo: "Serviços Domésticos",
    imagem: require("../../assets/images/banner-servicos-domesticos.png"),
    mostrarTitulo: false,
    acao: "categoria" as const,
    slug: "domesticos",
  },
  {
    id: "5",
    titulo: "Reformas com 20% OFF",
    imagem: require("../../assets/images/banner-reforma-desconto.png"),
    mostrarTitulo: false,
    acao: "categoria" as const,
    slug: "reformas",
  },
];

export default function HomeCliente() {
  const router = useRouter();
  const { branding } = useBranding();
  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerIndexRef = useRef(0);
  const fornecedoresScrollRef = useRef<ScrollView>(null);
  const fornecedoresIndexRef = useRef(0);
  const [busca, setBusca] = useState("");
  const [nomeCliente, setNomeCliente] = useState("Cliente");
  const [fornecedores, setFornecedores] = useState<FornecedorProximo[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);

  const carregarNomeCliente = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) return;
    const tenantId = await resolveCurrentTenantId();

    let profileQuery = supabase.from("profiles").select("name").eq("id", user.id);
    if (tenantId) {
      profileQuery = profileQuery.eq("tenant_id", tenantId);
    }

    const { data: profile } = await profileQuery.maybeSingle();

    const nome =
      String((profile as { name?: string | null } | null)?.name || "").trim() ||
      String(user.email || "Cliente").split("@")[0];

    setNomeCliente(extrairPrimeiroNome(nome));
  }, []);

  const carregarFornecedoresNoRaio = useCallback(async () => {
    try {
      setLoadingFornecedores(true);
      const tenantId = await resolveCurrentTenantId();
      const permission = await Location.getForegroundPermissionsAsync();
      let granted = permission.granted;

      if (!granted) {
        const requested = await Location.requestForegroundPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        setFornecedores([]);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { data, error } = await supabase.rpc("listar_fornecedores_no_raio", {
        p_latitude: location.coords.latitude,
        p_longitude: location.coords.longitude,
        p_raio_cliente_km: 30,
        p_limite: 50,
      });

      if (error) {
        console.log("ERRO LISTAR FORNECEDORES NO RAIO:", error);
        setFornecedores([]);
        return;
      }

      const unicos = new Map<string, FornecedorProximo>();
      for (const item of ((data || []) as FornecedorProximo[])) {
        const id = String(item.fornecedor_id || "").trim();
        if (!id || unicos.has(id)) continue;
        unicos.set(id, item);
      }

      const base = Array.from(unicos.values());
      const ids = base.map((item) => String(item.fornecedor_id || "")).filter(Boolean);

      if (ids.length === 0) {
        setFornecedores(base);
        return;
      }

      const profissionaisQuery = tenantId
        ? supabase
            .from("profissionais")
            .select("user_id, fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_capa_url, fornecedor_bairro")
            .in("user_id", ids)
            .eq("fornecedor_ativo", true)
            .eq("tenant_id", tenantId)
        : supabase
            .from("profissionais")
            .select("user_id, fornecedor_nome_fantasia, fornecedor_categoria, fornecedor_capa_url, fornecedor_bairro")
            .in("user_id", ids)
            .eq("fornecedor_ativo", true);
      const produtosQuery = tenantId
        ? supabase
            .from("produtos_fornecedor")
            .select("fornecedor_id, imagem_url")
            .in("fornecedor_id", ids)
            .eq("ativo", true)
            .eq("tenant_id", tenantId)
        : supabase
            .from("produtos_fornecedor")
            .select("fornecedor_id, imagem_url")
            .in("fornecedor_id", ids)
            .eq("ativo", true);

      const [profissionaisResult, produtosResult] = await Promise.all([profissionaisQuery, produtosQuery]);

      const profissionais = profissionaisResult.data || [];
      const produtos = produtosResult.data || [];

      const nomeFantasiaMap = new Map(
        profissionais.map((row: any) => [
          String(row.user_id || ""),
          String(row.fornecedor_nome_fantasia || "").trim(),
        ])
      );
      const categoriaMap = new Map(
        profissionais.map((row: any) => [
          String(row.user_id || ""),
          String(row.fornecedor_categoria || "").trim(),
        ])
      );
      const capaMap = new Map(
        profissionais.map((row: any) => [
          String(row.user_id || ""),
          String(row.fornecedor_capa_url || "").trim(),
        ])
      );
      const bairroMap = new Map(
        profissionais.map((row: any) => [
          String(row.user_id || ""),
          String(row.fornecedor_bairro || "").trim(),
        ])
      );
      const produtoBannerMap = new Map<string, string>();
      for (const row of produtos as any[]) {
        const fornecedorId = String(row.fornecedor_id || "");
        if (!fornecedorId || produtoBannerMap.has(fornecedorId)) continue;
        const imagem = String(row.imagem_url || "").trim();
        if (imagem) produtoBannerMap.set(fornecedorId, imagem);
      }

      const normalizados = base.map((item) => {
        const fornecedorId = String(item.fornecedor_id || "");
        const fantasia = nomeFantasiaMap.get(fornecedorId) || "";
        const categoria = categoriaMap.get(fornecedorId) || "";
        const capa = capaMap.get(fornecedorId) || "";
        const bairro = bairroMap.get(fornecedorId) || "";
        const bannerProduto = produtoBannerMap.get(fornecedorId) || "";
        return {
          ...item,
          nome: fantasia || String(item.nome || "").trim() || "Fornecedor",
          bairro,
          categoria: categoria || "Loja",
          banner: capa || bannerProduto || FORNECEDOR_FALLBACK_BANNER,
        };
      });

      setFornecedores(normalizados);
    } catch (error) {
      console.log("ERRO CARREGAR FORNECEDORES NO RAIO:", error);
      setFornecedores([]);
    } finally {
      setLoadingFornecedores(false);
    }
  }, []);

  function iniciarPedidoPorServico(
    slug: string,
    categoriaTitulo: string,
    servico: { id: string; titulo: string }
  ) {
    router.push({
      pathname: `/categorias/${slug}/intro`,
      params: {
        categoria: categoriaTitulo,
        servico: servico.titulo,
        servicoId: servico.id,
      },
    });
  }

  function onPressBanner(item: (typeof banners)[number]) {
    if (item.acao === "gas") {
      router.push("/(tabs)/gas");
      return;
    }

    if (item.acao === "cadastro_profissional") {
      router.push("/register");
      return;
    }

    if (item.slug) {
      router.push(`/categorias/${item.slug}`);
    }
  }

  const handleSolicitarServico = () => {
    const buscaNormalizada = normalizarTexto(busca);

    if (!buscaNormalizada) {
      router.push("/categorias");
      return;
    }

    const categoriaEncontrada = categoriasGrandes.find(
      (categoria) =>
        normalizarTexto(categoria.titulo).includes(buscaNormalizada) ||
        normalizarTexto(categoria.slug).includes(buscaNormalizada),
    );

    if (categoriaEncontrada) {
      router.push(`/categorias/${categoriaEncontrada.slug}`);
      return;
    }

    const categoriaPorServico = categoriasGrandes.find((categoria) =>
      categoria.servicos.some((servico) =>
        normalizarTexto(servico.titulo).includes(buscaNormalizada),
      ),
    );

    if (categoriaPorServico) {
      router.push(`/categorias/${categoriaPorServico.slug}`);
      return;
    }

    router.push("/categorias");
  };

  useEffect(() => {
    void carregarNomeCliente();
    void carregarFornecedoresNoRaio();
  }, [carregarNomeCliente, carregarFornecedoresNoRaio]);

  useFocusEffect(
    useCallback(() => {
      void carregarNomeCliente();
      void carregarFornecedoresNoRaio();
    }, [carregarNomeCliente, carregarFornecedoresNoRaio])
  );

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (bannerIndexRef.current + 1) % banners.length;
      bannerIndexRef.current = nextIndex;
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * (BANNER_ITEM_WIDTH + BANNER_ITEM_GAP),
        animated: true,
      });
    }, BANNER_AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loadingFornecedores || fornecedores.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (fornecedoresIndexRef.current + 1) % fornecedores.length;
      fornecedoresIndexRef.current = nextIndex;
      fornecedoresScrollRef.current?.scrollTo({
        x: nextIndex * (FORNECEDOR_CARD_WIDTH + 12),
        animated: true,
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [fornecedores.length, loadingFornecedores]);

  return (
    <ScrollView
      style={style.container}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      removeClippedSubviews
      scrollEventThrottle={16}
    >
      <View style={[style.heroContainer, { backgroundColor: branding.secondaryColor }]}> 
        <Text style={style.greeting}>Olá, {nomeCliente} 👋</Text>
        <Text style={style.heroTitle}>
          Qual serviço você precisa hoje?
        </Text>

        <TextInput
          placeholder="Ex: Eletricista, Pintura, Diarista..."
          placeholderTextColor="#9ca3af"
          style={style.heroInput}
          value={busca}
          onChangeText={setBusca}
        />

        <TouchableOpacity
          style={[style.heroButton, { backgroundColor: branding.primaryColor }]}
          onPress={handleSolicitarServico}
        >
          <Text style={style.heroButtonText}>
            Solicitar serviço
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, marginTop: 25 }}
        removeClippedSubviews
      >
        {categorias.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={style.categoryCard}
            onPress={() => router.push(`/categorias/${item.slug}`)}
          >
            <Ionicons name={item.icon as any} size={22} color={branding.primaryColor} />
            <Text style={style.categoryText}>{item.titulo}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        ref={bannerScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ marginTop: 25, paddingHorizontal: 20 }}
        decelerationRate="fast"
        snapToInterval={BANNER_ITEM_WIDTH + BANNER_ITEM_GAP}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          bannerIndexRef.current = Math.round(offsetX / (BANNER_ITEM_WIDTH + BANNER_ITEM_GAP));
        }}
        removeClippedSubviews
      >
        {banners.map((item, index) =>
          item.imagem ? (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => onPressBanner(item)}
              style={index < banners.length - 1 ? style.bannerGap : undefined}
            >
              <ImageBackground
                source={item.imagem}
                style={[style.banner, item.id === "gas" ? style.bannerContainSurface : null]}
                imageStyle={[
                  style.bannerImage,
                  item.resizeMode === "contain" ? style.bannerImageContain : null,
                ]}
                fadeDuration={0}
              >
                {item.mostrarTitulo === false ? null : <View style={style.bannerOverlay} />}
                {item.mostrarTitulo === false ? null : <Text style={style.bannerText}>{item.titulo}</Text>}
                {item.id === "gas" ? (
                  <View style={style.gasCtaWrap}>
                    <View style={style.gasCtaBadge}>
                      <Text style={style.gasCtaBadgeText}>Pedir gas agora</Text>
                    </View>
                  </View>
                ) : null}
              </ImageBackground>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={item.id}
              style={[style.banner, index < banners.length - 1 ? style.bannerGap : undefined]}
              activeOpacity={0.9}
              onPress={() => onPressBanner(item)}
            >
              <Text style={style.bannerText}>{item.titulo}</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      <View style={style.sectionHeader}>
        <Text style={style.sectionTitle}>Fornecedores próximos</Text>
      </View>

      {loadingFornecedores ? (
        <View style={style.fornecedorLoading}>
          <ActivityIndicator size="small" color={branding.primaryColor} />
          <Text style={style.fornecedorLoadingText}>Buscando fornecedores no seu raio...</Text>
        </View>
      ) : (
        <ScrollView
          ref={fornecedoresScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 32 }}
          decelerationRate="fast"
          snapToInterval={FORNECEDOR_CARD_WIDTH + 12}
          snapToAlignment="start"
          disableIntervalMomentum
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            fornecedoresIndexRef.current = Math.round(offsetX / (FORNECEDOR_CARD_WIDTH + 12));
          }}
          removeClippedSubviews
        >
          {(fornecedores || []).map((item) => (
            <TouchableOpacity
              key={item.fornecedor_id}
              activeOpacity={0.92}
              style={style.fornecedorCard}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/marketplace",
                  params: {
                    fornecedorId: item.fornecedor_id,
                    fornecedorNome: item.nome,
                  },
                })
              }
            >
              <RemoteImageWithFallback
                uri={item.banner}
                fallbackUri={FORNECEDOR_FALLBACK_BANNER}
                style={style.fornecedorBanner}
                resizeMode="cover"
                fadeDuration={0}
              />
              <View style={style.fornecedorContent}>
                <Text numberOfLines={1} style={style.fornecedorNome}>
                  {item.nome || "Fornecedor"}
                </Text>
                <Text numberOfLines={1} style={style.fornecedorCategoria}>
                  {item.categoria || "Loja"}
                </Text>
                <Text numberOfLines={1} style={style.fornecedorBairro}>
                  {item.bairro || "Bairro não informado"}
                </Text>
                <Text style={style.fornecedorCidade}>{item.cidade || "Cidade não informada"}</Text>
                <View style={style.fornecedorMetaRow}>
                  <Text style={style.fornecedorBadge}>{Number(item.distancia_km || 0).toFixed(1)} km</Text>
                </View>
              </View>
              <View style={[style.fornecedorBtn, { backgroundColor: branding.primaryColor }]}> 
                <Text style={style.fornecedorBtnText}>Ver produtos/serviços</Text>
              </View>
            </TouchableOpacity>
          ))}

          {fornecedores.length === 0 ? (
            <View style={style.fornecedorEmpty}>
              <Text style={style.fornecedorEmptyText}>
                Nenhum fornecedor ativo no seu raio no momento.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {categoriasGrandes.map((categoria) => (
        <View key={categoria.slug}>
          <View style={style.sectionHeader}>
            <Text style={style.sectionTitle}>{categoria.titulo}</Text>
            <TouchableOpacity
             onPress={() => router.push(`/categorias/${categoria.slug}`)}
            >
              <Text style={style.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            removeClippedSubviews
          >
            {categoria.servicos.slice(0, 8).map((item) => (
              <TouchableOpacity
                key={`${categoria.slug}-${item.id}`}
                style={style.imageCard}
                onPress={() => iniciarPedidoPorServico(categoria.slug, categoria.titulo, item)}
              >
                <RemoteImageWithFallback uri={item.imagem} fallbackUri={categoria.banner} style={style.image} fadeDuration={0} />
                <View style={style.imageContent}>
                  <Text style={style.imageTitle}>{item.titulo}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}

      <View style={style.ctaContainer}>
        <Text style={style.ctaTitle}>
          Ganhe dinheiro com seus serviços
        </Text>

        <Text style={style.ctaSubtitle}>
          Cadastre-se e receba pedidos todos os dias!
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[style.ctaButton, { backgroundColor: branding.primaryColor }]}
          onPress={() => router.push("/register")}
        >
          <Ionicons name="star" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={style.ctaButtonText}>
            Seja um Profissional
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 0 }} />
    </ScrollView>
  );
}

const style = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  heroContainer: {
    backgroundColor: "#0f172a",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#cbd5e1",
    marginBottom: 8,
    fontWeight: "600",
  },
  heroInput: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 15,
    color: "#fff",
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  heroButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  categoryCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginRight: 12,
    width: 100,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  banner: {
    width: BANNER_ITEM_WIDTH,
    height: 110,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    justifyContent: "center",
    padding: 25,
    backfaceVisibility: "hidden",
  },
  bannerGap: {
    marginRight: BANNER_ITEM_GAP,
  },
  bannerImage: {
    borderRadius: 20,
  },
  bannerImageContain: {
    resizeMode: "contain",
  },
  bannerContainSurface: {
    backgroundColor: "#0b1220",
    padding: 10,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  bannerText: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "bold",
  },
  gasCtaWrap: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  gasCtaBadge: {
    backgroundColor: "rgba(250, 204, 21, 0.96)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  gasCtaBadgeText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 35,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAll: {
    color: "#2563eb",
    fontWeight: "600",
  },
  imageCard: {
    width: width * 0.42,
    backgroundColor: "#fff",
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backfaceVisibility: "hidden",
  },
  image: {
    width: "100%",
    height: 100,
    backgroundColor: "#e5e7eb",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  imageContent: {
    padding: 10,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  ctaContainer: {
    backgroundColor: "#0f172a",
    marginTop: 60,
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: "#cbd5e1",
    marginBottom: 25,
  },
  ctaButton: {
    backgroundColor: "#facc15",
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  fornecedorLoading: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fornecedorLoadingText: {
    color: "#475569",
    fontWeight: "600",
  },
  fornecedorCard: {
    width: FORNECEDOR_CARD_WIDTH,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
  },
  fornecedorBanner: {
    width: "100%",
    height: 110,
    backgroundColor: "#e2e8f0",
  },
  fornecedorContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  fornecedorNome: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 15,
  },
  fornecedorCategoria: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  fornecedorCidade: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  fornecedorBairro: {
    color: "#475569",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  fornecedorSlideMeta: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  fornecedorMetaRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  fornecedorBadge: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontWeight: "700",
    fontSize: 11,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  fornecedorBtn: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  fornecedorBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 12,
  },
  fornecedorEmpty: {
    width: width - 40,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
  },
  fornecedorEmptyText: {
    color: "#64748b",
    fontWeight: "600",
  },
});
