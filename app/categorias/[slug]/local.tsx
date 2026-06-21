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

export default function LocalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    slug,
    categoria,
    servico,
    servicoId,
    profissional,
  } = useLocalSearchParams<{
    slug: string;
    categoria: string;
    servico: string;
    servicoId?: string;
    profissional: string;
  }>();

  const [localSelecionado, setLocalSelecionado] = useState("");
  const skipLocal = shouldSkipLocalStep(String(slug || ""), String(servico || ""), String(servicoId || ""));
  const totalSteps = skipLocal ? 5 : 6;
  const progressPercent = Math.round((3 / totalSteps) * 100);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (skipLocal) {
      router.replace({
        pathname: `/categorias/${slug}/resumo`,
        params: {
          categoria,
          servico,
          servicoId,
          profissional,
          local: "Definido no questionário",
        },
      });
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [skipLocal, router, slug, categoria, servico, servicoId, profissional, fadeAnim]);

  const opcoesBySlug: Record<string, { nome: string; icon: string }[]> = {
    imoveis: [
      { nome: "Apartamento", icon: "business-outline" },
      { nome: "Casa", icon: "home-outline" },
      { nome: "Comercial", icon: "storefront-outline" },
      { nome: "Terreno", icon: "map-outline" },
      { nome: "Condomínio", icon: "people-outline" },
      { nome: "Outro", icon: "ellipsis-horizontal-outline" },
    ],
    negocios: [
      { nome: "Remoto", icon: "laptop-outline" },
      { nome: "Presencial no meu endereço", icon: "location-outline" },
      { nome: "Híbrido", icon: "sync-outline" },
      { nome: "No escritório do profissional", icon: "business-outline" },
      { nome: "A combinar", icon: "chatbubbles-outline" },
    ],
  };

  const opcoes = opcoesBySlug[String(slug || "")] || [
    { nome: "Casa", icon: "home-outline" },
    { nome: "Apartamento", icon: "business-outline" },
    { nome: "Comércio", icon: "storefront-outline" },
    { nome: "Sítio / Chácara", icon: "leaf-outline" },
    { nome: "Condomínio", icon: "people-outline" },
    { nome: "Outro", icon: "ellipsis-horizontal-outline" },
  ];

  const tituloBySlug: Record<string, string> = {
    imoveis: "Qual o tipo/local do imóvel?",
    negocios: "Como prefere o atendimento?",
  };

  const subtituloBySlug: Record<string, string> = {
    imoveis: "Isso ajuda a filtrar profissionais do segmento correto",
    negocios: "Defina o formato para receber propostas compatíveis",
  };

  function avancar() {
    if (!localSelecionado) return;

    router.push({
      pathname: `/categorias/${slug}/resumo`,
      params: {
        categoria,
        servico,
        servicoId,
        profissional,
        local: localSelecionado,
      },
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
        <Text style={styles.stepText}>Etapa 3 de {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>{tituloBySlug[String(slug || "")] || "Qual o local do serviço?"}</Text>
          <Text style={styles.subtitle}>
            {subtituloBySlug[String(slug || "")] || "Isso ajuda a encontrar profissionais mais adequados"}
          </Text>

          {opcoes.map((item) => {
            const selected = localSelecionado === item.nome;

            return (
              <TouchableOpacity
                key={item.nome}
                style={[
                  styles.card,
                  selected && styles.cardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setLocalSelecionado(item.nome)}
              >
                <View style={styles.cardLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={selected ? "#fff" : "#2563eb"}
                  />
                </View>

                <Text
                  style={[
                    styles.cardText,
                    selected && { color: "#fff" },
                  ]}
                >
                  {item.nome}
                </Text>

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
            !localSelecionado && { opacity: 0.5 },
          ]}
          disabled={!localSelecionado}
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
    marginBottom: 6,
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 25,
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

  cardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
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
