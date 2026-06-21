import AsyncStorage from "@react-native-async-storage/async-storage";
import { GasArtwork } from "@/components/gas/GasArtwork";
import { useBranding } from "@/hooks/useBranding";
import {
  formatGasPrice,
  listActiveGasRevendedores,
  listMyGasPedidos,
  normalizeGasText,
  type GasPedido,
  type GasRevendedor,
} from "@/lib/gas";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  type ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GasCylinderType = "P13" | "P20" | "P45";
type RecommendationCriterion = "balance" | "preco" | "tempo" | "avaliacao";

type DeliveryForm = {
  recebedor: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  referencia: string;
};

const CYLINDER_OPTIONS: { id: GasCylinderType; label: string; enabled: boolean; badge?: string }[] = [
  { id: "P13", label: "P13", enabled: true },
  { id: "P20", label: "P20", enabled: false, badge: "Em breve" },
  { id: "P45", label: "P45", enabled: false, badge: "Em breve" },
];

const RECOMMENDATION_OPTIONS: { id: RecommendationCriterion; label: string }[] = [
  { id: "balance", label: "Melhor custo-benefício" },
  { id: "preco", label: "Menor preço" },
  { id: "tempo", label: "Mais rápido" },
  { id: "avaliacao", label: "Melhor avaliação" },
];

const EMPTY_DELIVERY_FORM: DeliveryForm = {
  recebedor: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "Itajubá",
  referencia: "",
};

const GAS_DELIVERY_STORAGE_KEY = "@gas_delivery_form";
const GAS_PREFERENCES_STORAGE_KEY = "@gas_marketplace_preferences";
const CTA_BUTTON_COLOR = "#FACC15";

const CRITERION_EXPLANATIONS: Record<RecommendationCriterion, string> = {
  balance: "Baseado em preço, prazo e avaliação",
  preco: "Priorizando o menor preço disponível",
  tempo: "Priorizando a entrega mais rápida",
  avaliacao: "Priorizando a melhor avaliação",
};

function getSupplierPrice(supplier: GasRevendedor, cylinderType: GasCylinderType) {
  if (cylinderType === "P13") return supplier.preco_p13;
  return null;
}

function getSupplierEtaBounds(time: number | null) {
  if (!time || time <= 0) return null;
  return {
    min: Math.max(10, time - 5),
    max: time + 10,
  };
}

function buildEtaLabel(value: number | null) {
  const bounds = getSupplierEtaBounds(value);
  if (!bounds) return "Entrega sob consulta";
  return `${bounds.min}-${bounds.max} min`;
}

function buildEtaFullLabel(value: number | null) {
  const bounds = getSupplierEtaBounds(value);
  if (!bounds) return "Entrega sob consulta";
  return `Entrega em ${bounds.min}-${bounds.max} min`;
}

function isSupplierVerified(supplier: GasRevendedor) {
  return Boolean(String(supplier.whatsapp || "").trim()) || Number(supplier.avaliacao || 0) >= 4.5;
}

function buildTrustLabel(supplier: GasRevendedor) {
  if (Number(supplier.avaliacao || 0) >= 4.8) return "Fornecedor verificado";
  if (Number(supplier.avaliacao || 0) >= 4.5) return "Boa avaliação";
  if (isSupplierVerified(supplier)) return "Fornecedor verificado";
  return "Atendimento ativo";
}

function buildRecommendationBadges(supplier: GasRevendedor, criterion: RecommendationCriterion) {
  const badges = [buildTrustLabel(supplier)];
  if (criterion === "balance") badges.push("Melhor custo-benefício");
  if (criterion === "tempo") badges.push("Entrega rápida");
  if (criterion === "preco") badges.push("Melhor preço");
  if (criterion === "avaliacao") badges.push("Recomendado");
  return badges;
}

function getEffectiveCylinderType(value: string | null | undefined): GasCylinderType {
  if (value === "P20" || value === "P45") return value;
  return "P13";
}

function calculateSupplierScore(
  supplier: GasRevendedor,
  criterion: RecommendationCriterion,
  cylinderType: GasCylinderType,
) {
  const price = getSupplierPrice(supplier, cylinderType) ?? Number.MAX_SAFE_INTEGER;
  const time = supplier.tempo_entrega_min ?? 999;
  const rating = Number(supplier.avaliacao || 0);
  const verifiedBoost = isSupplierVerified(supplier) ? 18 : 0;

  if (criterion === "preco") return verifiedBoost + (220 - price) + rating * 8 - time * 0.1;
  if (criterion === "tempo") return verifiedBoost + (240 - time) + rating * 6 - price * 0.1;
  if (criterion === "avaliacao") return verifiedBoost + rating * 24 + (220 - price) * 0.25 - time * 0.08;

  return verifiedBoost + rating * 16 + (220 - price) * 0.45 + (220 - time) * 0.22;
}

function rankSuppliers(
  suppliers: GasRevendedor[],
  criterion: RecommendationCriterion,
  cylinderType: GasCylinderType,
) {
  return suppliers
    .filter((supplier) => getSupplierPrice(supplier, cylinderType) !== null)
    .map((supplier) => ({
      supplier,
      score: calculateSupplierScore(supplier, criterion, cylinderType),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (getSupplierPrice(a.supplier, cylinderType) || 0) - (getSupplierPrice(b.supplier, cylinderType) || 0);
    });
}

function buildDeliverySummary(form: DeliveryForm, lastPedido: GasPedido | null) {
  const enderecoCompleto = [form.endereco.trim(), form.numero.trim()].filter(Boolean).join(", ");
  const localidade = [form.bairro.trim(), form.cidade.trim()].filter(Boolean).join(" • ");

  if (enderecoCompleto && localidade) return `${enderecoCompleto} • ${localidade}`;
  if (enderecoCompleto) return enderecoCompleto;
  if (localidade) return localidade;

  const ultimoEndereco = [lastPedido?.endereco, [lastPedido?.bairro, lastPedido?.cidade].filter(Boolean).join(" • ")]
    .filter(Boolean)
    .join(" • ");

  return ultimoEndereco || "Adicionar endereço de entrega";
}

function buildDeliverySecondaryText(form: DeliveryForm) {
  const recebedor = form.recebedor.trim();
  const localidade = [form.bairro.trim(), form.cidade.trim()].filter(Boolean).join(" • ");

  if (recebedor && localidade) return `${recebedor} • ${localidade}`;
  if (recebedor) return recebedor;
  if (localidade) return localidade;
  return "Adicione seu endereço para concluir o pedido";
}

function isDeliveryFormComplete(form: DeliveryForm) {
  return Boolean(
    form.recebedor.trim() &&
      form.endereco.trim() &&
      form.numero.trim() &&
      form.bairro.trim() &&
      form.cidade.trim(),
  );
}

function buildRepeatOrderSubtitle(lastPedido: GasPedido) {
  const createdAt = new Date(lastPedido.created_at);
  const data = Number.isNaN(createdAt.getTime()) ? "" : createdAt.toLocaleDateString("pt-BR");
  const base = [lastPedido.tipo_botijao, lastPedido.preco ? formatGasPrice(lastPedido.preco) : null]
    .filter(Boolean)
    .join(" • ");
  return data ? `${base} • ${data}` : base || "Pedido anterior";
}

function buildAddressLines(form: DeliveryForm) {
  const line1 = [form.endereco.trim(), form.numero.trim()].filter(Boolean).join(", ");
  const line2 = [form.bairro.trim(), form.cidade.trim()].filter(Boolean).join(" • ");
  const line3 = [form.recebedor.trim(), form.referencia.trim() ? `Referência: ${form.referencia.trim()}` : ""]
    .filter(Boolean)
    .join(" • ");

  return [line1, line2, line3].filter(Boolean);
}

function resolveCtaColor(primaryColor?: string | null) {
  const fallback = CTA_BUTTON_COLOR;
  if (!primaryColor || !/^#([0-9a-f]{6})$/i.test(primaryColor)) return fallback;

  const hex = primaryColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance >= 0.52 ? primaryColor : fallback;
}

export default function GasMarketplaceScreen() {
  const router = useRouter();
  const { branding } = useBranding();
  const insets = useSafeAreaInsets();
  const ctaColor = resolveCtaColor(branding.primaryColor);
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const stickyAnim = useRef(new Animated.Value(0)).current;
  const recommendationAnim = useRef(new Animated.Value(1)).current;
  const lastLoadedAtRef = useRef<number>(0);
  const deliveryHydratedRef = useRef(false);
  const preferencesHydratedRef = useRef(false);
  const [storageScope, setStorageScope] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<GasCylinderType>("P13");
  const [criterion, setCriterion] = useState<RecommendationCriterion>("balance");
  const [revendedores, setRevendedores] = useState<GasRevendedor[]>([]);
  const [pedidos, setPedidos] = useState<GasPedido[]>([]);
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>(EMPTY_DELIVERY_FORM);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [otherOptionsExpanded, setOtherOptionsExpanded] = useState(false);
  const [recommendationExpanded, setRecommendationExpanded] = useState(false);

  const loadRevendedores = useCallback(async (mode: "initial" | "refresh" | "background" = "initial") => {
    try {
      if (mode === "refresh") {
        setRefreshing(true);
      } else if (mode === "initial") {
        setLoading(true);
      }

      const [revendedoresData, pedidosData] = await Promise.all([
        listActiveGasRevendedores(),
        listMyGasPedidos().catch(() => []),
      ]);

      setLoadError(null);
      setRevendedores(revendedoresData);
      setPedidos(pedidosData);
      lastLoadedAtRef.current = Date.now();
    } catch (error) {
      console.log("ERRO GAS MARKETPLACE:", error);
      setLoadError("Não foi possível carregar os fornecedores de gás agora. Tente novamente.");

      if (mode === "initial") {
        setRevendedores([]);
        setPedidos([]);
      }
    } finally {
      if (mode === "initial") {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const hasData = revendedores.length > 0 || pedidos.length > 0;
      const isFresh = Date.now() - lastLoadedAtRef.current < 15000;

      if (!hasData) {
        void loadRevendedores("initial");
        return;
      }

      if (!isFresh) {
        void loadRevendedores("background");
      }
    }, [loadRevendedores, pedidos.length, revendedores.length]),
  );

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const resolveStorageScope = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;
        setStorageScope(session?.user?.id?.trim() || "guest");
      } catch (error) {
        console.log("ERRO AO DEFINIR ESCOPO DO GAS:", error);
        if (active) {
          setStorageScope("guest");
        }
      }
    };

    void resolveStorageScope();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageScope) return;
    let active = true;
    const deliveryStorageKey = `${GAS_DELIVERY_STORAGE_KEY}:${storageScope}`;

    const hydrateDeliveryForm = async () => {
      try {
        const raw = await AsyncStorage.getItem(deliveryStorageKey);
        if (!raw || !active) {
          deliveryHydratedRef.current = true;
          return;
        }

        const parsed = JSON.parse(raw) as Partial<DeliveryForm>;

        if (!parsed || typeof parsed !== "object") {
          deliveryHydratedRef.current = true;
          return;
        }

        setDeliveryForm((current) => ({
          ...current,
          recebedor: typeof parsed.recebedor === "string" ? parsed.recebedor : current.recebedor,
          endereco: typeof parsed.endereco === "string" ? parsed.endereco : current.endereco,
          numero: typeof parsed.numero === "string" ? parsed.numero : current.numero,
          complemento: typeof parsed.complemento === "string" ? parsed.complemento : current.complemento,
          bairro: typeof parsed.bairro === "string" ? parsed.bairro : current.bairro,
          cidade: typeof parsed.cidade === "string" && parsed.cidade.trim() ? parsed.cidade : current.cidade,
          referencia: typeof parsed.referencia === "string" ? parsed.referencia : current.referencia,
        }));
      } catch (error) {
        console.log("ERRO AO RECUPERAR ENDERECO DO GAS:", error);
      } finally {
        deliveryHydratedRef.current = true;
      }
    };

    void hydrateDeliveryForm();

    return () => {
      active = false;
    };
  }, [storageScope]);

  useEffect(() => {
    if (!storageScope) return;
    let active = true;
    const preferencesStorageKey = `${GAS_PREFERENCES_STORAGE_KEY}:${storageScope}`;

    const hydratePreferences = async () => {
      try {
        const raw = await AsyncStorage.getItem(preferencesStorageKey);
        if (!raw || !active) {
          preferencesHydratedRef.current = true;
          return;
        }

        const parsed = JSON.parse(raw) as {
          selectedType?: GasCylinderType;
          criterion?: RecommendationCriterion;
        };

        if (!parsed || typeof parsed !== "object") {
          preferencesHydratedRef.current = true;
          return;
        }

        if (parsed.selectedType === "P13" || parsed.selectedType === "P20" || parsed.selectedType === "P45") {
          setSelectedType(parsed.selectedType);
        }

        if (
          parsed.criterion === "balance" ||
          parsed.criterion === "preco" ||
          parsed.criterion === "tempo" ||
          parsed.criterion === "avaliacao"
        ) {
          setCriterion(parsed.criterion);
        }
      } catch (error) {
        console.log("ERRO AO RECUPERAR PREFERENCIAS DO GAS:", error);
      } finally {
        preferencesHydratedRef.current = true;
      }
    };

    void hydratePreferences();

    return () => {
      active = false;
    };
  }, [storageScope]);

  useEffect(() => {
    if (!deliveryHydratedRef.current || !storageScope) return;
    void AsyncStorage.setItem(`${GAS_DELIVERY_STORAGE_KEY}:${storageScope}`, JSON.stringify(deliveryForm)).catch((error) => {
      console.log("ERRO AO SALVAR ENDERECO DO GAS:", error);
    });
  }, [deliveryForm, storageScope]);

  useEffect(() => {
    if (!preferencesHydratedRef.current || !storageScope) return;
    void AsyncStorage.setItem(
      `${GAS_PREFERENCES_STORAGE_KEY}:${storageScope}`,
      JSON.stringify({ selectedType, criterion }),
    ).catch((error) => {
      console.log("ERRO AO SALVAR PREFERENCIAS DO GAS:", error);
    });
  }, [criterion, selectedType, storageScope]);

  const rankedSuppliers = useMemo(
    () => rankSuppliers(revendedores, criterion, selectedType),
    [criterion, revendedores, selectedType],
  );

  const recommended = rankedSuppliers[0]?.supplier ?? null;
  const otherSuppliers = rankedSuppliers.slice(1).map((item) => item.supplier);

  const cheapestSupplier = useMemo(() => {
    const availableSuppliers = revendedores.filter((supplier) => getSupplierPrice(supplier, selectedType) !== null);
    if (!availableSuppliers.length) return null;

    return [...availableSuppliers].sort((a, b) => {
      const priceA = getSupplierPrice(a, selectedType) ?? Number.MAX_SAFE_INTEGER;
      const priceB = getSupplierPrice(b, selectedType) ?? Number.MAX_SAFE_INTEGER;
      if (priceA !== priceB) return priceA - priceB;
      return (a.tempo_entrega_min ?? Number.MAX_SAFE_INTEGER) - (b.tempo_entrega_min ?? Number.MAX_SAFE_INTEGER);
    })[0] ?? null;
  }, [revendedores, selectedType]);

  const latestPedido = useMemo(
    () =>
      [...pedidos].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0] ?? null,
    [pedidos],
  );

  const deliveryReady = isDeliveryFormComplete(deliveryForm);
  const deliverySummary = buildDeliverySummary(deliveryForm, latestPedido);
  const deliverySecondaryText = buildDeliverySecondaryText(deliveryForm);
  const recommendedPrice = recommended ? getSupplierPrice(recommended, selectedType) : null;
  const recommendedEta = recommended ? buildEtaFullLabel(recommended.tempo_entrega_min) : "Entrega sob consulta";

  const aggregateTimes = useMemo(() => {
    const values = revendedores
      .map((supplier) => getSupplierEtaBounds(supplier.tempo_entrega_min))
      .filter(Boolean) as { min: number; max: number }[];

    if (!values.length) return "Entrega sob consulta";
    const min = Math.min(...values.map((item) => item.min));
    const max = Math.max(...values.map((item) => item.max));
    return `${min}-${max} min`;
  }, [revendedores]);

  const aggregatePriceText = useMemo(() => {
    const prices = revendedores
      .map((supplier) => getSupplierPrice(supplier, selectedType))
      .filter((value): value is number => value !== null);

    if (!prices.length) return "Sob consulta";
    return `A partir de ${formatGasPrice(Math.min(...prices))}`;
  }, [revendedores, selectedType]);

  const updateDeliveryField = useCallback((field: keyof DeliveryForm, value: string) => {
    setDeliveryForm((current) => ({ ...current, [field]: value }));
  }, []);

  const validateAndCloseAddress = useCallback(() => {
    if (!isDeliveryFormComplete(deliveryForm)) {
      Alert.alert(
        "Entrega incompleta",
        "Informe nome de quem vai receber, endereço, número, bairro e cidade.",
      );
      return;
    }

    setAddressModalVisible(false);
  }, [deliveryForm]);

  const openCheckout = useCallback(
    (supplier: GasRevendedor, orderType: GasCylinderType) => {
      if (orderType !== "P13") {
        Alert.alert("Em breve", "Os tamanhos P20 e P45 estarão disponíveis em breve.");
        return;
      }

      if (!deliveryReady) {
        setAddressModalVisible(true);
        return;
      }

      router.push({
        pathname: "/(tabs)/gas-checkout",
        params: {
          revendedorId: supplier.id,
          tipoBotijao: orderType,
        },
      });
    },
    [deliveryReady, router],
  );

  const handleMainOrder = useCallback(() => {
    if (!recommended) {
      Alert.alert("Sem opções no momento", "Nenhum revendedor disponível agora.");
      return;
    }

    void openCheckout(recommended, selectedType);
  }, [openCheckout, recommended, selectedType]);

  const handleRepeatOrder = useCallback(() => {
    if (!latestPedido) return;

    const repeatType = getEffectiveCylinderType(latestPedido.tipo_botijao);
    const safeRepeatType: GasCylinderType = repeatType === "P13" ? "P13" : "P13";
    const repeatSupplier = revendedores.find((supplier) => supplier.id === latestPedido.revendedor_id) || recommended;

    if (!repeatSupplier) {
      Alert.alert("Indisponível", "Não encontramos um fornecedor para repetir esse pedido agora.");
      return;
    }

    if (repeatType !== safeRepeatType) {
      Alert.alert(
        "Tipo indisponível",
        "No momento, a recompra no app está disponível apenas para o botijão P13. Ajustamos seu pedido para continuar.",
      );
    }

    if (repeatSupplier.id !== latestPedido.revendedor_id) {
      Alert.alert(
        "Fornecedor indisponível",
        "Seu último revendedor não está disponível agora. Selecionamos a melhor opção disponível.",
      );
    }

    setSelectedType(safeRepeatType);
    void openCheckout(repeatSupplier, safeRepeatType);
  }, [latestPedido, openCheckout, recommended, revendedores]);

  const stickySupplier = recommended || cheapestSupplier;
  const stickySupplierName = stickySupplier?.nome || "Melhor opção disponível";
  const stickyPriceLabel = stickySupplier
    ? formatGasPrice(getSupplierPrice(stickySupplier, selectedType) || 0)
    : aggregatePriceText;
  const stickyDetail = `${stickySupplier ? buildEtaLabel(stickySupplier.tempo_entrega_min) : aggregateTimes} • ${
    deliveryReady ? `Entregar em ${deliveryForm.bairro.trim() || deliveryForm.cidade.trim()}` : "Confirmar endereço"
  }`;
  const heroButtonLabel = deliveryReady ? "⚡ Pedir gás agora" : "Informar entrega";
  const recommendedButtonLabel = deliveryReady ? "⚡ Pedir gás agora" : "Informar entrega";
  const stickyButtonLabel = deliveryReady ? "Pedir agora" : "Continuar pedido";
  const entranceTranslateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const stickyTranslateY = stickyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  const recommendationOpacity = recommendationAnim.interpolate({
    inputRange: [0.96, 1],
    outputRange: [0.82, 1],
  });

  useEffect(() => {
    if (loading) {
      entranceAnim.setValue(0);
      return;
    }

    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceAnim, loading]);

  useEffect(() => {
    Animated.spring(stickyAnim, {
      toValue: !loading && recommended ? 1 : 0,
      damping: 18,
      stiffness: 180,
      mass: 0.85,
      useNativeDriver: true,
    }).start();
  }, [loading, recommended, stickyAnim]);

  useEffect(() => {
    if (loading || !recommended) return;

    recommendationAnim.setValue(0.96);
    Animated.spring(recommendationAnim, {
      toValue: 1,
      damping: 16,
      stiffness: 220,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }, [criterion, loading, recommended, recommendationAnim, selectedType]);

  const toggleRecommendationExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecommendationExpanded((current) => !current);
  }, []);

  const toggleOtherOptionsExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOtherOptionsExpanded((current) => !current);
  }, []);

  const renderSecondarySupplier = useCallback(
    (supplier: GasRevendedor) => {
      const badges = buildRecommendationBadges(supplier, criterion).slice(0, 2);

      return (
        <View key={supplier.id} style={styles.otherSupplierCard}>
          <View style={styles.otherSupplierTop}>
            <GasArtwork variant="card" compact />
            <View style={styles.otherSupplierInfo}>
              <View style={styles.otherSupplierHeader}>
                <View style={styles.nameWrap}>
                  <Text style={styles.otherSupplierName}>{supplier.nome}</Text>
                  <Text style={styles.otherSupplierMeta}>
                    {[supplier.bairro, supplier.cidade].filter(Boolean).join(" • ") || "Itajubá e região"}
                  </Text>
                </View>
                <View style={styles.ratingWrap}>
                  <Ionicons name="star" size={14} color="#facc15" />
                  <Text style={styles.ratingText}>{Number(supplier.avaliacao || 0).toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.badgesWrap}>
                {badges.map((badge) => (
                  <View key={`${supplier.id}-${normalizeGasText(badge)}`} style={styles.secondaryBadge}>
                    <Text style={styles.secondaryBadgeText}>{badge}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.otherSupplierBottom}>
                <Text style={[styles.otherSupplierPrice, { color: branding.primaryColor }]}>
                  {formatGasPrice(getSupplierPrice(supplier, selectedType) || 0)}
                </Text>
                <Text style={styles.otherSupplierEta}>{buildEtaFullLabel(supplier.tempo_entrega_min)}</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryActionButton,
              pressed ? styles.secondaryActionButtonPressed : null,
            ]}
            onPress={() => void openCheckout(supplier, selectedType)}
          >
            <Text style={styles.secondaryActionText}>
              {deliveryReady ? "Selecionar e pedir" : "Informar entrega"}
            </Text>
          </Pressable>
        </View>
      );
    },
    [branding.primaryColor, criterion, deliveryReady, openCheckout, selectedType],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 168 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadRevendedores("refresh")}
            tintColor={branding.primaryColor}
          />
        }
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#f8fafc" />
            </TouchableOpacity>
            <View style={styles.locationPill}>
              <Ionicons name="location-sharp" size={14} color={branding.primaryColor} />
              <Text style={styles.locationText}>Itajubá e região</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingHero} />
            <View style={styles.loadingRecommendation} />
            <View style={styles.loadingRecommendation} />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: entranceAnim,
                transform: [{ translateY: entranceTranslateY }],
              },
            ]}
          >
            <View style={styles.heroCard}>
              <ImageBackground
                source={require("../../assets/images/gas/cover.png")}
                style={styles.heroCover}
                imageStyle={styles.heroCoverImage}
              >
                <View style={styles.heroCoverShade} />
              </ImageBackground>

              <View style={styles.heroContentCard}>
                <View style={styles.heroChipRow}>
                  <View style={styles.heroSignalPill}>
                    <Ionicons name="flash" size={14} color="#facc15" />
                    <Text style={styles.heroSignalText}>Melhor opção para você agora</Text>
                  </View>
                </View>

                <Text style={styles.heroSectionLabel}>Pedido rápido</Text>
                <Text style={styles.title}>Acabou o gás?</Text>
                <Text style={styles.subtitle}>
                  Entrega rápida com revendedores verificados da sua região.
                </Text>

                <View style={styles.quickSummaryCard}>
                  <View style={styles.quickSummaryTop}>
                    <Text style={styles.quickSummaryType}>{selectedType}</Text>
                    <Text style={[styles.quickSummaryPrice, { color: branding.primaryColor }]}>
                      {recommendedPrice ? formatGasPrice(recommendedPrice) : aggregatePriceText}
                    </Text>
                  </View>
                  <Text style={styles.quickSummaryMeta}>
                    {recommended ? recommendedEta : `Entrega em ${aggregateTimes}`}
                  </Text>
                  <Text style={styles.quickSummarySupport}>
                    {recommended
                      ? `${recommended.nome} selecionado automaticamente para entrega mais eficiente.`
                      : "Carregando a melhor opção para sua região."}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.ctaPrimaryButton,
                    styles.heroPrimaryButton,
                    { backgroundColor: ctaColor, shadowColor: ctaColor as ColorValue },
                    pressed ? styles.ctaPrimaryButtonPressed : null,
                  ]}
                  onPress={handleMainOrder}
                >
                  <Text style={styles.heroPrimaryButtonText}>{heroButtonLabel}</Text>
                </Pressable>
              </View>
            </View>

            {recommended ? (
              <Animated.View
                style={[
                  styles.recommendedCard,
                  {
                    opacity: recommendationOpacity,
                    transform: [{ scale: recommendationAnim }],
                  },
                ]}
              >
                <View style={styles.recommendedHeader}>
                  <View style={styles.recommendedHeading}>
                    <Text style={styles.sectionLabel}>Selecionado para você</Text>
                    <Text style={styles.recommendedName}>{recommended.nome}</Text>
                    <Text style={styles.recommendedMeta}>
                      {[recommended.bairro, recommended.cidade].filter(Boolean).join(" • ") || "Itajubá e região"}
                    </Text>
                  </View>
                  <View style={styles.ratingWrap}>
                    <Ionicons name="star" size={14} color="#facc15" />
                    <Text style={styles.ratingText}>{Number(recommended.avaliacao || 0).toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.badgesWrap}>
                  {buildRecommendationBadges(recommended, criterion).map((badge) => (
                    <View key={`${recommended.id}-${normalizeGasText(badge)}`} style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recommendedMetrics}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Preço</Text>
                    <Text style={[styles.metricValue, { color: branding.primaryColor }]}>
                      {recommendedPrice ? formatGasPrice(recommendedPrice) : "Sob consulta"}
                    </Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Entrega</Text>
                    <Text style={styles.metricValueAlt}>{recommendedEta}</Text>
                  </View>
                </View>

                <Text style={styles.recommendedCopy}>
                  Melhor opção disponível agora com preço competitivo e entrega rápida.
                </Text>

                <TouchableOpacity
                  style={styles.preferenceSummary}
                  onPress={toggleRecommendationExpanded}
                >
                  <View style={styles.preferenceCopy}>
                    <Text style={styles.preferenceTitle}>Melhor opção para você agora</Text>
                    <Text style={styles.preferenceText}>{CRITERION_EXPLANATIONS[criterion]}</Text>
                  </View>
                  <View style={styles.preferenceAction}>
                    <Text style={[styles.preferenceActionText, { color: branding.primaryColor }]}>Ajustar</Text>
                    <Ionicons
                      name={recommendationExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={branding.primaryColor}
                    />
                  </View>
                </TouchableOpacity>

                {recommendationExpanded ? (
                  <View style={styles.criterionRow}>
                    {RECOMMENDATION_OPTIONS.map((option) => {
                      const active = criterion === option.id;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.criterionChip,
                            active ? [styles.criterionChipActive, { borderColor: branding.primaryColor }] : null,
                          ]}
                          onPress={() => setCriterion(option.id)}
                        >
                          <Text
                            style={[
                              styles.criterionChipText,
                              active ? [styles.criterionChipTextActive, { color: branding.primaryColor }] : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.ctaPrimaryButton,
                    styles.recommendedButton,
                    { backgroundColor: ctaColor, shadowColor: ctaColor as ColorValue },
                    pressed ? styles.ctaPrimaryButtonPressed : null,
                  ]}
                  onPress={handleMainOrder}
                >
                  <Text style={styles.recommendedButtonText}>{recommendedButtonLabel}</Text>
                </Pressable>
              </Animated.View>
            ) : null}

            <View style={styles.addressCard}>
              <View style={styles.addressContent}>
                <Text style={styles.sectionLabel}>Entregar em</Text>
                <Text style={styles.addressSummary}>{deliverySummary}</Text>
                <Text style={styles.addressHelper}>{deliverySecondaryText}</Text>
              </View>
              <TouchableOpacity
                style={styles.addressAction}
                onPress={() => setAddressModalVisible(true)}
              >
                <Text style={[styles.addressActionText, { color: branding.primaryColor }]}>
                  {deliveryReady ? "Alterar" : "Adicionar endereço"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectorCard}>
              <Text style={styles.sectionLabel}>Tipo de botijão</Text>
              <View style={styles.selectorRow}>
                {CYLINDER_OPTIONS.map((option) => {
                  const active = selectedType === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.selectorChip,
                        active ? [styles.selectorChipActive, { borderColor: branding.primaryColor }] : null,
                        !option.enabled ? styles.selectorChipDisabled : null,
                      ]}
                      disabled={!option.enabled}
                      onPress={() => setSelectedType(option.id)}
                    >
                      <Text
                        style={[
                          styles.selectorChipText,
                          active ? [styles.selectorChipTextActive, { color: branding.primaryColor }] : null,
                          !option.enabled ? styles.selectorChipTextDisabled : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.badge ? <Text style={styles.selectorBadge}>{option.badge}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {latestPedido ? (
              <View style={styles.repeatCard}>
                <View style={styles.repeatHeader}>
                  <View style={styles.repeatContent}>
                    <Text style={styles.sectionLabel}>Pedir novamente</Text>
                    <Text style={styles.repeatTitle}>Repita seu último pedido em segundos</Text>
                    <Text style={styles.repeatSubtitle}>{buildRepeatOrderSubtitle(latestPedido)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.repeatButton, { borderColor: branding.primaryColor }]}
                    onPress={handleRepeatOrder}
                  >
                    <Text style={[styles.repeatButtonText, { color: branding.primaryColor }]}>Repetir pedido</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.historyEmptyCard}>
                <Text style={styles.sectionLabel}>Recompra</Text>
                <Text style={styles.historyEmptyText}>Seu próximo pedido de gás aparecerá aqui.</Text>
              </View>
            )}

            <View style={styles.otherOptionsSection}>
              <TouchableOpacity
                style={styles.otherOptionsHeader}
                onPress={toggleOtherOptionsExpanded}
              >
                <View>
                  <Text style={styles.sectionLabel}>Outras opções</Text>
                  <Text style={styles.otherOptionsSubtitle}>Ver mais revendedores</Text>
                </View>
                <Ionicons
                  name={otherOptionsExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#f8fafc"
                />
              </TouchableOpacity>

              {otherOptionsExpanded ? (
                <View style={styles.otherSuppliersList}>
                  {otherSuppliers.length === 0 ? (
                    <Text style={styles.otherOptionsEmpty}>Não há outras opções além da recomendação atual.</Text>
                  ) : (
                    otherSuppliers.map((supplier) => renderSecondarySupplier(supplier))
                  )}
                </View>
              ) : null}
            </View>

            {loadError && revendedores.length === 0 ? (
              <View style={styles.stateCard}>
                <Ionicons name="cloud-offline-outline" size={28} color="#f59e0b" />
                <Text style={styles.stateTitle}>Não foi possível carregar agora</Text>
                <Text style={styles.stateText}>{loadError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => void loadRevendedores("refresh")}>
                  <Text style={[styles.retryButtonText, { color: branding.primaryColor }]}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!loadError && !revendedores.length ? (
              <View style={styles.stateCard}>
                <Ionicons name="flame-outline" size={28} color="#f59e0b" />
                <Text style={styles.stateTitle}>Nenhum revendedor disponível no momento</Text>
                <Text style={styles.stateText}>Tente novamente em instantes ou altere sua região de entrega.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => void loadRevendedores("refresh")}>
                  <Text style={[styles.retryButtonText, { color: branding.primaryColor }]}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.ordersSection}>
              <Text style={styles.ordersTitle}>Histórico</Text>
              <Text style={styles.ordersSubtitle}>Acompanhe seus pedidos de gás dentro do app.</Text>

              {pedidos.length === 0 ? (
                <View style={styles.orderEmptyCard}>
                  <Text style={styles.orderEmptyText}>Nenhum pedido de gás registrado ainda.</Text>
                </View>
              ) : (
                pedidos.map((pedido) => {
                  const destino = [pedido.bairro, pedido.cidade].filter(Boolean).join(" • ");

                  return (
                    <View key={pedido.id} style={styles.orderCard}>
                      <View style={styles.orderTop}>
                        <Text style={styles.orderName}>
                          {pedido.gas_revendedores?.nome || "Revendedor"}
                        </Text>
                        <View style={styles.orderStatusPill}>
                          <Text style={styles.orderStatusText}>{pedido.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.orderMeta}>
                        {pedido.total ? formatGasPrice(pedido.total) : pedido.preco !== null ? formatGasPrice(pedido.preco) : "Preço a confirmar"} • {pedido.tipo_botijao}
                      </Text>
                      <Text style={styles.orderMeta}>
                        {destino || pedido.endereco || "Endereço não informado"}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {!loading && recommended ? (
        <Animated.View
          style={[
            styles.stickyWrap,
            {
              paddingBottom: 4 + insets.bottom,
              opacity: stickyAnim,
              transform: [{ translateY: stickyTranslateY }],
            },
          ]}
        >
          <View style={styles.stickyBar}>
            <View style={styles.stickyCopy}>
              <Text style={styles.stickyEyebrow}>Melhor preço com {stickySupplierName}</Text>
              <Text style={styles.stickySummary}>
                {selectedType}
                <Text style={styles.stickySummaryMuted}> • </Text>
                <Text style={styles.stickySummaryPrice}>{stickyPriceLabel}</Text>
              </Text>
              <Text style={styles.stickyMetaText}>{stickyDetail}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.ctaPrimaryButton,
                styles.stickyButton,
                { backgroundColor: ctaColor, shadowColor: ctaColor as ColorValue },
                pressed ? styles.ctaPrimaryButtonPressed : null,
              ]}
              onPress={handleMainOrder}
            >
              <Text style={styles.stickyButtonText}>{stickyButtonLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      <Modal visible={addressModalVisible} animationType="slide" transparent onRequestClose={() => setAddressModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setAddressModalVisible(false)} />
          <View style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Entregar em</Text>
                <Text style={styles.modalSubtitle}>Preencha só o essencial para concluir seu pedido.</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={18} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Nome de quem vai receber"
                placeholderTextColor="#64748b"
                value={deliveryForm.recebedor}
                onChangeText={(value) => updateDeliveryField("recebedor", value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Rua ou avenida"
                placeholderTextColor="#64748b"
                value={deliveryForm.endereco}
                onChangeText={(value) => updateDeliveryField("endereco", value)}
              />

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Número"
                  placeholderTextColor="#64748b"
                  value={deliveryForm.numero}
                  onChangeText={(value) => updateDeliveryField("numero", value)}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Complemento"
                  placeholderTextColor="#64748b"
                  value={deliveryForm.complemento}
                  onChangeText={(value) => updateDeliveryField("complemento", value)}
                />
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Bairro"
                  placeholderTextColor="#64748b"
                  value={deliveryForm.bairro}
                  onChangeText={(value) => updateDeliveryField("bairro", value)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Cidade"
                  placeholderTextColor="#64748b"
                  value={deliveryForm.cidade}
                  onChangeText={(value) => updateDeliveryField("cidade", value)}
                />
              </View>

              <TextInput
                style={[styles.input, styles.inputTextarea]}
                placeholder="Ponto de referência"
                placeholderTextColor="#64748b"
                value={deliveryForm.referencia}
                onChangeText={(value) => updateDeliveryField("referencia", value)}
                multiline
                textAlignVertical="top"
              />

              {buildAddressLines(deliveryForm).length > 0 ? (
                <View style={styles.modalPreviewCard}>
                  <Text style={styles.modalPreviewLabel}>Resumo</Text>
                  {buildAddressLines(deliveryForm).map((line) => (
                    <Text key={line} style={styles.modalPreviewText}>{line}</Text>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalPrimaryButton, { backgroundColor: ctaColor }]}
              onPress={validateAndCloseAddress}
            >
              <Text style={styles.modalPrimaryText}>Salvar endereço</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#05070d" },
  container: { flex: 1, backgroundColor: "#05070d" },
  content: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 14 },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  locationText: { color: "#e2e8f0", fontSize: 12, fontWeight: "800" },
  loadingWrap: { gap: 16, marginTop: 12 },
  loadingHero: {
    height: 320,
    borderRadius: 30,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  loadingRecommendation: {
    height: 220,
    borderRadius: 26,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  mainContent: { gap: 16 },
  heroCard: { marginBottom: 2 },
  heroCover: {
    minHeight: 228,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#08111d",
    justifyContent: "flex-start",
  },
  heroCoverImage: { borderRadius: 30, resizeMode: "cover" },
  heroCoverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 7, 18, 0.18)",
  },
  heroContentCard: {
    marginTop: -34,
    marginHorizontal: 16,
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 12,
  },
  heroChipRow: { flexDirection: "row", justifyContent: "flex-start" },
  heroSignalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(8, 15, 28, 0.78)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroSignalText: { color: "#f8fafc", fontSize: 12, fontWeight: "800" },
  heroSectionLabel: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: { color: "#f8fafc", fontSize: 32, fontWeight: "900", lineHeight: 38 },
  subtitle: { color: "#94a3b8", fontSize: 15, lineHeight: 22 },
  quickSummaryCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  quickSummaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  quickSummaryType: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  quickSummaryPrice: { fontSize: 24, fontWeight: "900" },
  quickSummaryMeta: { color: "#f8fafc", fontSize: 14, fontWeight: "800", marginTop: 8 },
  quickSummarySupport: { color: "#94a3b8", fontSize: 13, lineHeight: 18, marginTop: 6 },
  ctaPrimaryButton: {
    minHeight: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 8,
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaPrimaryButtonPressed: { transform: [{ scale: 0.985 }] },
  ctaPrimaryButtonDisabled: { opacity: 0.74 },
  heroPrimaryButton: { marginTop: 18 },
  heroPrimaryButtonText: { color: "#111827", fontSize: 16, fontWeight: "900" },
  recommendedCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  recommendedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  recommendedHeading: { flex: 1 },
  recommendedName: { color: "#f8fafc", fontSize: 22, fontWeight: "900", marginTop: 2 },
  recommendedMeta: { color: "#94a3b8", fontSize: 13, marginTop: 6 },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratingText: { color: "#f8fafc", fontSize: 12, fontWeight: "800" },
  badgesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  recommendedBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
  },
  recommendedBadgeText: { color: "#f8fafc", fontSize: 11, fontWeight: "800" },
  recommendedMetrics: { flexDirection: "row", gap: 10, marginTop: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metricLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  metricValue: { fontSize: 24, fontWeight: "900" },
  metricValueAlt: { color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  recommendedCopy: { color: "#cbd5e1", fontSize: 13, lineHeight: 20, marginTop: 14 },
  preferenceSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  preferenceCopy: { flex: 1 },
  preferenceTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "800" },
  preferenceText: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  preferenceAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  preferenceActionText: { fontSize: 13, fontWeight: "800" },
  criterionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  criterionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  criterionChipActive: { backgroundColor: "#111827" },
  criterionChipText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  criterionChipTextActive: { fontWeight: "900" },
  recommendedButton: { marginTop: 18 },
  recommendedButtonText: { color: "#111827", fontSize: 16, fontWeight: "900" },
  addressCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addressContent: { flex: 1 },
  sectionLabel: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  addressSummary: { color: "#f8fafc", fontSize: 16, fontWeight: "800", marginTop: 8 },
  addressHelper: { color: "#94a3b8", fontSize: 13, lineHeight: 18, marginTop: 6 },
  addressAction: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  addressActionText: { fontSize: 13, fontWeight: "800" },
  selectorCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
  },
  selectorRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  selectorChip: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  selectorChipActive: { backgroundColor: "#121c31" },
  selectorChipDisabled: { opacity: 0.55 },
  selectorChipText: { color: "#f8fafc", fontSize: 17, fontWeight: "900" },
  selectorChipTextActive: { fontWeight: "900" },
  selectorChipTextDisabled: { color: "#64748b" },
  selectorBadge: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  repeatCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
  },
  repeatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  repeatContent: { flex: 1 },
  repeatTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 8 },
  repeatSubtitle: { color: "#94a3b8", fontSize: 13, lineHeight: 19, marginTop: 6 },
  repeatButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#111827",
  },
  repeatButtonText: { fontSize: 13, fontWeight: "900" },
  historyEmptyCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
  },
  historyEmptyText: { color: "#94a3b8", fontSize: 14, lineHeight: 20, marginTop: 8 },
  otherOptionsSection: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
  },
  otherOptionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  otherOptionsSubtitle: { color: "#94a3b8", fontSize: 13, marginTop: 6 },
  otherSuppliersList: { gap: 12, marginTop: 14 },
  otherOptionsEmpty: { color: "#94a3b8", fontSize: 13 },
  otherSupplierCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
  },
  otherSupplierTop: { flexDirection: "row", gap: 12 },
  otherSupplierInfo: { flex: 1 },
  otherSupplierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
  },
  nameWrap: { flex: 1 },
  otherSupplierName: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  otherSupplierMeta: { color: "#94a3b8", fontSize: 12, marginTop: 5 },
  secondaryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(59, 130, 246, 0.14)",
  },
  secondaryBadgeText: { color: "#f8fafc", fontSize: 11, fontWeight: "800" },
  otherSupplierBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
  },
  otherSupplierPrice: { fontSize: 20, fontWeight: "900" },
  otherSupplierEta: { color: "#e2e8f0", fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  secondaryActionButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#182338",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  secondaryActionButtonPressed: { opacity: 0.88 },
  secondaryActionButtonDisabled: { opacity: 0.72 },
  secondaryActionText: { color: "#f8fafc", fontSize: 14, fontWeight: "800" },
  stateCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 24,
    alignItems: "center",
  },
  stateTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 10 },
  stateText: { color: "#94a3b8", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  retryButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "#111827",
  },
  retryButtonText: { fontSize: 13, fontWeight: "800" },
  ordersSection: { marginTop: 4 },
  ordersTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  ordersSubtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4, marginBottom: 12 },
  orderEmptyCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  orderEmptyText: { color: "#94a3b8", fontSize: 14 },
  orderCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  orderName: { color: "#f8fafc", fontSize: 16, fontWeight: "800", flex: 1 },
  orderStatusPill: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  orderStatusText: { color: "#facc15", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  orderMeta: { color: "#94a3b8", fontSize: 13, marginTop: 8 },
  stickyWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
  },
  stickyBar: {
    backgroundColor: "#111827",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.28)",
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stickyCopy: { flex: 1, paddingBottom: 14 },
  stickyEyebrow: { color: "#f8fafc", fontSize: 12, fontWeight: "800" },
  stickySummary: { color: "#f8fafc", fontSize: 16, fontWeight: "900", marginTop: 4 },
  stickySummaryMuted: { color: "#94a3b8" },
  stickySummaryPrice: { color: "#22c55e", fontSize: 18, fontWeight: "900" },
  stickyMetaText: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
  stickyButton: {
    minWidth: 140,
    marginBottom: 14,
  },
  stickyButtonText: { color: "#111827", fontSize: 15, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 18,
    paddingTop: 18,
    maxHeight: "82%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  modalSubtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4, lineHeight: 19 },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  inputTextarea: { minHeight: 84 },
  inputHalf: { flex: 1, marginBottom: 0 },
  modalPreviewCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  modalPreviewLabel: { color: "#facc15", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  modalPreviewText: { color: "#f8fafc", fontSize: 13, marginTop: 6, lineHeight: 18 },
  modalPrimaryButton: {
    minHeight: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: CTA_BUTTON_COLOR,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalPrimaryText: { color: "#111827", fontSize: 15, fontWeight: "900" },
});
