import AsyncStorage from "@react-native-async-storage/async-storage";
import { RemoteImageWithFallback } from "@/components/RemoteImageWithFallback";
import { categoriasGrandes } from "@/constants/categorias";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ResultadoServico = {
  id: string;
  titulo: string;
  imagem?: ImageSourcePropType | string;
  categoriaSlug: string;
  categoriaTitulo: string;
};

type HistoricoItem = {
  termo: string;
  servicoId: string;
  servico: string;
  categoriaTitulo: string;
  categoriaSlug: string;
};

type Ordenacao = "relevancia" | "az" | "mais_buscados";

const TERMOS_TENDENCIA = [
  "Diarista",
  "Eletricista",
  "Encanador",
  "Maquiador",
  "Conserto de Celular",
  "Personal Trainer",
];

const PESO_BUSCA: Record<string, number> = {
  diarista: 100,
  eletricista: 95,
  encanador: 90,
  maquiador: 85,
  "conserto de celular": 80,
  "personal trainer": 75,
};

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function BuscarScreen() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todas");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [historyKey, setHistoryKey] = useState("buscar_historico_anon");

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id || "anon";
    const key = `buscar_historico_${uid}`;
    setHistoryKey(key);

    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      setHistorico([]);
      return;
    }

    try {
      setHistorico(JSON.parse(raw) as HistoricoItem[]);
    } catch {
      setHistorico([]);
    }
  }

  async function salvarHistorico(item: HistoricoItem) {
    const next = [item, ...historico.filter((h) => h.servico !== item.servico)].slice(0, 8);
    setHistorico(next);
    await AsyncStorage.setItem(historyKey, JSON.stringify(next));
  }

  async function limparHistorico() {
    setHistorico([]);
    await AsyncStorage.removeItem(historyKey);
  }

  const resultados: ResultadoServico[] = useMemo(() => {
    return categoriasGrandes.flatMap((categoria) =>
      categoria.servicos.map((servico) => ({
        id: servico.id,
        titulo: servico.titulo,
        imagem: servico.imagem,
        categoriaSlug: categoria.slug,
        categoriaTitulo: categoria.titulo,
      })),
    );
  }, []);

  const recomendados = useMemo(() => resultados.slice(0, 8), [resultados]);

  const categoriasResumo = useMemo(
    () =>
      categoriasGrandes.map((categoria) => ({
        slug: categoria.slug,
        titulo: categoria.titulo,
        totalServicos: categoria.servicos.length,
      })),
    [],
  );

  const resultadosFiltrados = useMemo(() => {
    const termo = normalizar(busca);

    const base = resultados.filter((item) => {
      const porCategoria = categoriaAtiva === "todas" || item.categoriaSlug === categoriaAtiva;
      if (!porCategoria) return false;
      if (!termo) return true;

      const titulo = normalizar(item.titulo);
      const categoriaTitulo = normalizar(item.categoriaTitulo);

      return titulo.includes(termo) || categoriaTitulo.includes(termo);
    });

    if (ordenacao === "az") {
      return [...base].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    }

    if (ordenacao === "mais_buscados") {
      return [...base].sort((a, b) => {
        const pa = PESO_BUSCA[normalizar(a.titulo)] || 0;
        const pb = PESO_BUSCA[normalizar(b.titulo)] || 0;
        if (pb !== pa) return pb - pa;
        return a.titulo.localeCompare(b.titulo, "pt-BR");
      });
    }

    return [...base].sort((a, b) => {
      if (!termo) return 0;
      const aStarts = normalizar(a.titulo).startsWith(termo) ? 1 : 0;
      const bStarts = normalizar(b.titulo).startsWith(termo) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;
      return a.titulo.localeCompare(b.titulo, "pt-BR");
    });
  }, [resultados, busca, categoriaAtiva, ordenacao]);

  const abrirCategoria = (slug: string) => {
    router.push(`/categorias/${slug}`);
  };

  async function iniciarPedidoDireto(item: ResultadoServico) {
    await salvarHistorico({
      termo: busca || item.titulo,
      servicoId: item.id,
      servico: item.titulo,
      categoriaTitulo: item.categoriaTitulo,
      categoriaSlug: item.categoriaSlug,
    });

    router.push({
      pathname: `/categorias/${item.categoriaSlug}/intro`,
      params: {
        slug: item.categoriaSlug,
        categoria: item.categoriaTitulo,
        servico: item.titulo,
        servicoId: item.id,
      },
    });
  }

  async function confirmarBusca() {
    if (!busca.trim()) {
      Alert.alert("Digite um serviço", "Informe um serviço para iniciar o pedido.");
      return;
    }

    const primeiro = resultadosFiltrados[0];
    if (!primeiro) {
      Alert.alert("Sem resultado", "Não encontramos um serviço compatível com sua busca.");
      return;
    }

    await iniciarPedidoDireto(primeiro);
  }

  const aplicarTendencia = (termo: string) => {
    setBusca(termo);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.titleRow}>
          <Ionicons name="search-outline" size={22} color="#facc15" />
          <Text style={styles.title}>Buscar Serviços</Text>
        </View>
        <Text style={styles.subtitle}>Digite o serviço e toque em Iniciar pedido para abrir a etapa 1 já preenchida.</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Ex: Diarista, Eletricista, Designer"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
            onSubmitEditing={confirmarBusca}
          />
          {busca.length > 0 ? (
            <TouchableOpacity onPress={() => setBusca("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={confirmarBusca}>
          <Text style={styles.primaryBtnText}>Iniciar pedido</Text>
        </TouchableOpacity>

        <View style={styles.trendingRow}>
          {TERMOS_TENDENCIA.map((termo) => (
            <TouchableOpacity key={termo} style={styles.trendChip} onPress={() => aplicarTendencia(termo)}>
              <Text style={styles.trendText}>{termo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {historico.length > 0 ? (
        <View style={styles.historyCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.historyTitle}>Buscas recentes</Text>
            <TouchableOpacity onPress={limparHistorico}>
              <Text style={styles.clearHistory}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyWrap}>
            {historico.map((item) => (
              <TouchableOpacity
                key={`${item.servico}-${item.categoriaSlug}`}
                style={styles.historyChip}
                onPress={() =>
                  iniciarPedidoDireto({
                    id: item.servicoId || `${item.categoriaSlug}-${item.servico}`,
                    titulo: item.servico,
                    categoriaSlug: item.categoriaSlug,
                    categoriaTitulo: item.categoriaTitulo,
                  })
                }
              >
                <Text style={styles.historyText}>{item.servico}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Filtros por categoria</Text>
      <View style={styles.filterRow}>
        <FilterChip active={categoriaAtiva === "todas"} label="Todas" onPress={() => setCategoriaAtiva("todas")} />
        {categoriasResumo.map((cat) => (
          <FilterChip key={cat.slug} active={categoriaAtiva === cat.slug} label={cat.titulo} onPress={() => setCategoriaAtiva(cat.slug)} />
        ))}
      </View>

      <View style={styles.orderRow}>
        <FilterChip active={ordenacao === "relevancia"} label="Relevância" onPress={() => setOrdenacao("relevancia")} />
        <FilterChip active={ordenacao === "az"} label="A-Z" onPress={() => setOrdenacao("az")} />
        <FilterChip active={ordenacao === "mais_buscados"} label="Mais buscados" onPress={() => setOrdenacao("mais_buscados")} />
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.sectionTitle}>Resultados</Text>
        <Text style={styles.resultCounter}>{resultadosFiltrados.length} itens</Text>
      </View>

      {resultadosFiltrados.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="alert-circle-outline" size={22} color="#facc15" />
          <Text style={styles.emptyTitle}>Nenhum serviço encontrado</Text>
          <Text style={styles.emptyText}>Tente outro termo ou remova filtros para ampliar os resultados.</Text>
        </View>
      ) : (
        <View style={styles.resultsGrid}>
          {resultadosFiltrados.slice(0, 18).map((item) => (
            <TouchableOpacity
              key={`${item.categoriaSlug}-${item.id}`}
              style={styles.resultCard}
              onPress={() => iniciarPedidoDireto(item)}
            >
              <RemoteImageWithFallback
                uri={item.imagem}
                fallbackUri="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
                style={styles.resultImage}
              />
              <View style={styles.resultBody}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.titulo}</Text>
                <Text style={styles.resultCategory} numberOfLines={1}>{item.categoriaTitulo}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Recomendados para você</Text>
      <FlatList
        horizontal
        data={recomendados}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.recommendedList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.recommendedCard} onPress={() => iniciarPedidoDireto(item)}>
            <RemoteImageWithFallback
              uri={item.imagem}
              fallbackUri="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
              style={styles.recommendedImage}
            />
            <Text style={styles.recommendedTitle} numberOfLines={1}>{item.titulo}</Text>
            <Text style={styles.recommendedMeta} numberOfLines={1}>{item.categoriaTitulo}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Categorias em alta</Text>
      <View style={styles.categoryGrid}>
        {categoriasResumo.map((cat) => (
          <TouchableOpacity key={cat.slug} style={styles.categoryCard} onPress={() => abrirCategoria(cat.slug)}>
            <Text style={styles.categoryTitle} numberOfLines={1}>{cat.titulo}</Text>
            <Text style={styles.categoryMeta}>{cat.totalServicos} serviços</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  hero: {
    backgroundColor: "#0b1220",
    borderColor: "#111827",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#facc15",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#03040a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 46,
    color: "#fff",
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
  },
  primaryBtn: {
    backgroundColor: "#facc15",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    color: "#000",
    fontWeight: "900",
  },
  trendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trendChip: {
    backgroundColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trendText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  historyCard: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  historyTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
  },
  clearHistory: {
    color: "#f87171",
    fontWeight: "700",
    fontSize: 12,
  },
  historyWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  historyChip: {
    backgroundColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  orderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },
  filterChip: {
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: "#facc15",
    backgroundColor: "#1a1705",
  },
  filterChipText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#facc15",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultCounter: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    marginTop: 8,
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 4,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resultCard: {
    width: "48.5%",
    backgroundColor: "#0b1220",
    borderRadius: 14,
    overflow: "hidden",
    borderColor: "#111827",
    borderWidth: 1,
    marginBottom: 10,
  },
  resultImage: {
    width: "100%",
    height: 94,
    backgroundColor: "#111827",
  },
  resultBody: {
    padding: 10,
  },
  resultTitle: {
    color: "#fff",
    fontWeight: "800",
  },
  resultCategory: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 3,
  },
  recommendedList: {
    paddingBottom: 4,
    gap: 10,
  },
  recommendedCard: {
    width: 168,
    backgroundColor: "#0b1220",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#111827",
    overflow: "hidden",
  },
  recommendedImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#111827",
  },
  recommendedTitle: {
    paddingHorizontal: 10,
    paddingTop: 10,
    color: "#fff",
    fontWeight: "800",
  },
  recommendedMeta: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 3,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48.5%",
    backgroundColor: "#0b1220",
    borderColor: "#111827",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  categoryTitle: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  categoryMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
});
