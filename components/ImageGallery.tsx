import { Image, ScrollView, StyleSheet, View } from "react-native";

interface Props {
  images?: string[] | null;
}

export default function ImageGallery({ images }: Props) {
  if (!images || images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {images.map((uri, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image source={{ uri }} style={styles.image} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  imageWrapper: {
    marginRight: 10,
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#0b1220",
  },
});
