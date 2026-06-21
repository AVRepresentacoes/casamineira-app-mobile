import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  titulo: string;
  imagem: any;
  onPress: () => void;
};

export default function CategoriaCard({ titulo, imagem, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={imagem} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.text}>{titulo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  text: {
    color: "#fff",
    fontWeight: "800",
  },
});
