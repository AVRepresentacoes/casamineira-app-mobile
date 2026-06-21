import { Ionicons } from "@expo/vector-icons";
import { shouldSkipLocalStep } from "@/lib/serviceQuestionnaire";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfissionalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, categoria, servico, servicoId } = useLocalSearchParams<{
    slug: string;
    categoria: string;
    servico: string;
    servicoId?: string;
  }>();

  const [profissionalSelecionado, setProfissionalSelecionado] = useState("");
  const skipLocal = shouldSkipLocalStep(String(slug || ""), String(servico || ""), String(servicoId || ""));
  const totalSteps = skipLocal ? 5 : 6;
  const progressPercent = Math.round((2 / totalSteps) * 100);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const profissionaisBySlug: Record<
    string,
    { titulo: string; descricao: string; icon: string }[]
  > = {
    imoveis: [
      {
        titulo: "Corretor",
        descricao: "Ideal para compra, venda e aluguel.",
        icon: "home-outline",
      },
      {
        titulo: "Consultor Imobiliário",
        descricao: "Foco em análise de mercado e estratégia de negociação.",
        icon: "bar-chart-outline",
      },
      {
        titulo: "Especialista em Documentação",
        descricao: "Apoio em regularização, contratos e trâmites.",
        icon: "document-text-outline",
      },
    ],
    negocios: [
      {
        titulo: "Consultor Generalista",
        descricao: "Visão ampla para organizar seu escopo de negócio.",
        icon: "briefcase-outline",
      },
      {
        titulo: "Especialista de Área",
        descricao: "Profissional focado em fiscal, jurídico, marketing ou vendas.",
        icon: "ribbon-outline",
      },
      {
        titulo: "Mentor Sênior",
        descricao: "Atendimento estratégico para decisões críticas.",
        icon: "star-outline",
      },
    ],
  };

  const profissionais = profissionaisBySlug[String(slug || "")] || [
    {
      titulo: "Profissional Padrão",
      descricao: "Ideal para serviços simples e rápidos.",
      icon: "person-outline",
    },
    {
      titulo: "Profissional Premium",
      descricao: "Mais avaliações positivas e maior experiência.",
      icon: "star-outline",
    },
    {
      titulo: "Profissional Especialista",
      descricao: "Altamente qualificado para serviços complexos.",
      icon: "ribbon-outline",
    },
  ];

  const tituloTelaBySlug: Record<string, string> = {
    imoveis: "Escolha o perfil do especialista",
    negocios: "Escolha o tipo de consultor",
  };

  function avancar() {
    if (!profissionalSelecionado) return;

    const p = {
      categoria,
      servico,
      servicoId,
      profissional: profissionalSelecionado,
    };

    if (shouldSkipLocalStep(String(slug || ""), String(servico || ""), String(servicoId || ""))) {
      router.push({
        pathname: `/categorias/${slug}/resumo`,
        params: {
          ...p,
          local: "Definido no questionário",
        },
      });
      return;
    }

    router.push({
      pathname: `/categorias/${slug}/local`,
      params: p,
    });
  }

  return (
    <View style={styles.container}>
      {/* HEADER ESCURO */}
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

      {/* PROGRESSO */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.stepText}>Etapa 2 de {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>{tituloTelaBySlug[String(slug || "")] || "Escolha o tipo de profissional"}</Text>

          {profissionais.map((item) => {
            const selected = profissionalSelecionado === item.titulo;

            return (
              <TouchableOpacity
                key={item.titulo}
                style={[
                  styles.card,
                  selected && styles.cardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setProfissionalSelecionado(item.titulo)
                }
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={26}
                    color={selected ? "#fff" : "#2563eb"}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.cardTitle,
                      selected && { color: "#fff" },
                    ]}
                  >
                    {item.titulo}
                  </Text>

                  <Text
                    style={[
                      styles.cardDescription,
                      selected && { color: "#e0e7ff" },
                    ]}
                  >
                    {item.descricao}
                  </Text>
                </View>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* FOOTER FIXO PREMIUM */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !profissionalSelecionado && { opacity: 0.5 },
          ]}
          disabled={!profissionalSelecionado}
          onPress={avancar}
        >
          <Text style={styles.nextText}>Próximo</Text>
        </TouchableOpacity>
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
    paddingBottom: 150,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#111827",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 22,
    marginBottom: 18,
    alignItems: "center",
    elevation: 4,
  },

  cardSelected: {
    backgroundColor: "#2563eb",
  },

  cardLeft: {
    marginRight: 15,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#0f172a",
  },

  cardDescription: {
    fontSize: 13,
    color: "#64748b",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  backButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 25,
    width: "45%",
    alignItems: "center",
  },

  backText: {
    color: "#fff",
    fontWeight: "bold",
  },

  nextButton: {
    backgroundColor: "#facc15",
    paddingVertical: 16,
    borderRadius: 25,
    width: "45%",
    alignItems: "center",
  },

  nextText: {
    color: "#000",
    fontWeight: "bold",
  },
});
