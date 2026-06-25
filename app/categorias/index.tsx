import { Ionicons } from "@expo/vector-icons";
import { RemoteImageWithFallback } from "@/components/RemoteImageWithFallback";
import { contarPropostasNaoLidasCliente } from "@/lib/propostas-notificacoes";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { categoriasGrandes } from "@/constants/categorias";
import {
    Animated,
    Dimensions,
    FlatList,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const normalizarTexto = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef<FlatList>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [propostasNaoLidas, setPropostasNaoLidas] = useState(0);

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
    if (item.acao === "cadastro_profissional") {
      router.push("/(auth)/cadastro-profissional");
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
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      const next = (bannerIndex + 1) % banners.length;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
      setBannerIndex(next);
    }, 4000);

    return () => clearInterval(interval);
  }, [bannerIndex, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarNaoLidas() {
        const total = await contarPropostasNaoLidasCliente();
        if (ativo) {
          setPropostasNaoLidas(total);
        }
      }

      carregarNaoLidas();

      return () => {
        ativo = false;
      };
    }, [])
  );

  return (
    <Animated.ScrollView
      style={[style.container, { opacity: fadeAnim }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={style.heroContainer}>
        <Text style={style.heroTitle}>
          Qual serviço você precisa hoje?
        </Text>

        <TouchableOpacity
          style={style.quickLinkBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/(cliente)/pedidos/propostas")}
        >
          {propostasNaoLidas > 0 ? (
            <View style={style.quickLinkBadge}>
              <Text style={style.quickLinkBadgeText}>
                {propostasNaoLidas > 99 ? "99+" : propostasNaoLidas}
              </Text>
            </View>
          ) : null}
          <Ionicons name="document-text-outline" size={16} color="#facc15" />
          <Text style={style.quickLinkText}>Minhas propostas</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Ex: Eletricista, Pintura, Diarista..."
          placeholderTextColor="#9ca3af"
          style={style.heroInput}
          value={busca}
          onChangeText={setBusca}
        />

        <TouchableOpacity
          style={style.heroButton}
          onPress={handleSolicitarServico}
        >
          <Text style={style.heroButtonText}>
            Solicitar serviço
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={categorias}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, marginTop: 25 }}
        renderItem={({ item }) => (
  <TouchableOpacity
    style={style.categoryCard}
    onPress={() => router.push(`/categorias/${item.slug}`)}
  >
            <Ionicons name={item.icon as any} size={22} color="#facc15" />
            <Text style={style.categoryText}>{item.titulo}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        ref={bannerRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 25 }}
        renderItem={({ item }) =>
          item.imagem ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => onPressBanner(item)}>
              <ImageBackground source={item.imagem} style={style.banner} imageStyle={style.bannerImage}>
                {item.mostrarTitulo === false ? null : <View style={style.bannerOverlay} />}
                {item.mostrarTitulo === false ? null : <Text style={style.bannerText}>{item.titulo}</Text>}
              </ImageBackground>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={style.banner} activeOpacity={0.9} onPress={() => onPressBanner(item)}>
              <Text style={style.bannerText}>{item.titulo}</Text>
            </TouchableOpacity>
          )
        }
      />

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

          <FlatList
            horizontal
            data={categoria.servicos}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={style.imageCard}
                onPress={() => iniciarPedidoPorServico(categoria.slug, categoria.titulo, item)}
              >
                <RemoteImageWithFallback uri={item.imagem} fallbackUri={categoria.banner} style={style.image} />
                <View style={style.imageContent}>
                  <Text style={style.imageTitle}>{item.titulo}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
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
          style={style.ctaButton}
          onPress={() => router.push("/(auth)/cadastro-profissional")}
        >
          <Ionicons name="star" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={style.ctaButtonText}>
            Seja um Profissional
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 0 }} />
    </Animated.ScrollView>
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
  quickLinkBtn: {
    position: "relative",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  quickLinkText: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 12,
  },
  quickLinkBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  quickLinkBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 10,
    lineHeight: 12,
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
    elevation: 2,
  },
  categoryText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  banner: {
    width: width - 40,
    marginHorizontal: 20,
    height: 110,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    justifyContent: "center",
    padding: 25,
    overflow: "hidden",
  },
  bannerImage: {
    borderRadius: 20,
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
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 100,
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
});
