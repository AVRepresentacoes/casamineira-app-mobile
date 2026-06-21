import { Ionicons } from "@expo/vector-icons";
import { shouldSkipLocalStep } from "@/lib/serviceQuestionnaire";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, categoria, servico, servicoId } = useLocalSearchParams();
  const skipLocal = shouldSkipLocalStep(String(slug || ""), String(servico || ""), String(servicoId || ""));
  const totalSteps = skipLocal ? 5 : 6;
  const progressPercent = Math.round((1 / totalSteps) * 100);
  const slugValue = String(slug || "");

  const introCopyBySlug: Record<
    string,
    {
      titulo: string;
      badge: string;
      cards: { icon: string; title: string; subtitle: string; color: string }[];
    }
  > = {
    imoveis: {
      titulo: "Vamos abrir sua solicitação imobiliária",
      badge: "Documentação e segurança",
      cards: [
        {
          icon: "document-text",
          title: "Descreva seu objetivo",
          subtitle: "Compra, aluguel, vistoria ou regularização: detalhe o que você precisa.",
          color: "#2563eb",
        },
        {
          icon: "business",
          title: "Conecte com especialista",
          subtitle: "Seu pedido vai para profissionais com experiência em imóveis.",
          color: "#7c3aed",
        },
        {
          icon: "shield-checkmark",
          title: "Negocie com proteção",
          subtitle: "Mantenha acordos e pagamentos dentro da plataforma.",
          color: "#facc15",
        },
      ],
    },
    negocios: {
      titulo: "Vamos estruturar sua demanda de negócios",
      badge: "Atendimento profissional",
      cards: [
        {
          icon: "briefcase",
          title: "Defina a prioridade",
          subtitle: "Explique sua dor principal: fiscal, jurídico, marketing, vendas ou processos.",
          color: "#2563eb",
        },
        {
          icon: "analytics",
          title: "Receba propostas objetivas",
          subtitle: "Quanto mais contexto você passar, mais assertivo fica o orçamento.",
          color: "#7c3aed",
        },
        {
          icon: "lock-closed",
          title: "Contrate com segurança",
          subtitle: "Formalize escopo e pagamento no app para evitar riscos.",
          color: "#facc15",
        },
      ],
    },
  };

  const introCopy = introCopyBySlug[slugValue] || {
    titulo: "Chegou a hora de solicitar seu serviço",
    badge: "100% Seguro",
    cards: [
      {
        icon: "information-circle",
        title: "Explique com detalhes",
        subtitle: "Quanto mais detalhes você informar, melhores propostas receberá.",
        color: "#2563eb",
      },
      {
        icon: "time",
        title: "Aguarde os profissionais",
        subtitle: "Seu pedido será enviado para profissionais avaliados.",
        color: "#7c3aed",
      },
      {
        icon: "lock-closed",
        title: "Negocie dentro do app",
        subtitle: "Para sua segurança, feche contratos e pagamentos somente dentro da plataforma.",
        color: "#facc15",
      },
    ],
  };

  // ===== ANIMAÇÕES =====
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start(() =>
      router.push({
        pathname: `/categorias/${slug}/profissional`,
        params: { categoria, servico, servicoId },
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#fff"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>{servico}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* BARRA DE PROGRESSO */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.stepText}>Etapa 1 de {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          }}
        >
          <Text style={styles.title}>{introCopy.titulo}</Text>

          {/* BADGE */}
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
            <Text style={styles.badgeText}>{introCopy.badge}</Text>
          </View>

          {introCopy.cards.map((card) => (
            <View key={card.title} style={styles.card}>
              <Ionicons name={card.icon as any} size={26} color={card.color} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 26) }]}>
        <TouchableWithoutFeedback
          onPressIn={animateIn}
          onPressOut={animateOut}
        >
          <Animated.View
            style={[
              styles.footerButton,
              { transform: [{ scale }] },
            ]}
          >
            <Text style={styles.footerButtonText}>
              Iniciar Pedido
            </Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },

  header: {
    backgroundColor: "#0f172a",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  progressContainer: {
    paddingHorizontal: 22,
    paddingTop: 15,
  },

  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#facc15",
  },

  stepText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },

  content: {
    padding: 22,
    paddingBottom: 180,
  },

  title: {
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 25,
  },

  badgeText: {
    marginLeft: 6,
    color: "#166534",
    fontWeight: "600",
    fontSize: 12,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 22,
    marginBottom: 18,
    elevation: 6,
  },

  cardText: {
    marginLeft: 14,
    flex: 1,
  },

  cardTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 6,
    color: "#0f172a",
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 15,
  },

  footerButton: {
    backgroundColor: "#facc15",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },

  footerButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
});
