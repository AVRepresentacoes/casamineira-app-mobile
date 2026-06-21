import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Categoria = {
  id: string;
  titulo: string;
  imagem: any;
};

type Props = {
  titulo: string;
  categorias?: Categoria[]; // 👈 opcional
  onSelect: (id: string) => void;
};

export default function SecaoCategorias({
  titulo,
  categorias = [], // 👈 default vazio (ESSENCIAL)
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>

      <View style={styles.lista}>
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() => onSelect(cat.id)}
          >
            <Image source={cat.imagem} style={styles.imagem} />
            <Text style={styles.label}>{cat.titulo}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  titulo: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 16,
    marginBottom: 10,
  },
  lista: {
    flexDirection: "row",
    paddingLeft: 16,
  },
  card: {
    width: 140,
    backgroundColor: "#071026",
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
  },
  imagem: { width: "100%", height: 90 },
  label: {
    color: "#e5e7eb",
    fontWeight: "800",
    padding: 8,
  },
});
