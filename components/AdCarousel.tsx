import { FlatList, Image, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const ADS = [
  { id: "1", image: "https://via.placeholder.com/900x300/111827/facc15?text=Plano+PRO" },
  { id: "2", image: "https://via.placeholder.com/900x300/111827/facc15?text=Parcerias" },
  { id: "3", image: "https://via.placeholder.com/900x300/111827/facc15?text=Ofertas" },
];

export function AdCarousel() {
  return (
    <FlatList
      data={ADS}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Image source={{ uri: item.image }} style={styles.banner} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    width: width - 40,
    height: 160,
    borderRadius: 20,
    marginRight: 12,
  },
});
