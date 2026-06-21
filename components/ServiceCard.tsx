import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  titulo: string;
  imagem: string;
  onPress: () => void;
};

export function ServiceCard({ titulo, imagem, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: imagem }} style={styles.imagem} />
      <Text style={styles.titulo}>{titulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    marginLeft: 16,
    backgroundColor: "#071026",
    borderRadius: 18,
    overflow: "hidden",
  },
  imagem: { width: "100%", height: 110 },
  titulo: {
    color: "#e5e7eb",
    fontWeight: "800",
    padding: 12,
  },
});
