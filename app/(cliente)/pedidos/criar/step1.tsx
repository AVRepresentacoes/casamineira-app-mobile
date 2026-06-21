import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const categorias = [
  "Reformas",
  "Serviços Domésticos",
  "Tecnologia",
  "Automóveis",
  "Beleza",
];

export default function Step1Categoria() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qual categoria?</Text>

      {categorias.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/(cliente)/pedidos/criar/step2",
              params: { categoria: cat },
            })
          }
        >
          <Text style={styles.cardText}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", padding: 20 },
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#0b1220",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardText: { color: "#fff", fontWeight: "700" },
});