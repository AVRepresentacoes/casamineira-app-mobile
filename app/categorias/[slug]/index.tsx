import { categoriasGrandes } from "@/constants/categorias";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function CategoriaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const categoria = categoriasGrandes.find(
    (cat) => cat.slug === slug
  );

  if (!categoria) {
    return (
      <View style={style.container}>
        <Text style={{ padding: 20 }}>
          Categoria não encontrada
        </Text>
      </View>
    );
  }

  return (
    <View style={style.container}>
      {/* HEADER ESCURO PADRÃO DO APP */}
      <View style={style.header}>
        <Text style={style.headerTitle}>
          {categoria.titulo}
        </Text>
      </View>

      {/* BANNER IMAGEM */}
      <Image
        source={{ uri: categoria.banner }}
        style={style.banner}
        resizeMode="cover"
      />

      {/* LISTA DE SERVIÇOS */}
      <FlatList
        data={categoria.servicos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={style.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: `/categorias/${slug}/intro`,
                params: {
                  categoria: categoria.titulo,
                  servico: item.titulo,
                  servicoId: item.id,
                },
              })
            }
          >
            <View>
              <Text style={style.cardTitle}>
                {item.titulo}
              </Text>
              <Text style={style.cardSubtitle}>
                Profissionais verificados disponíveis
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#2563eb"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  header: {
    backgroundColor: "#0f172a",
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },

  banner: {
    width: width,
    height: 180,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 5,
  },
});
