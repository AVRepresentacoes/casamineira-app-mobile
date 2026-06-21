import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImagePickerField({ images, onChange }: Props) {
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      onChange([...images, ...uris]);
    }
  }

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={pickImage}>
        <Text style={styles.btnText}>Adicionar fotos</Text>
      </TouchableOpacity>

      <View style={styles.previewRow}>
        {images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#facc15",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#facc15",
    fontWeight: "900",
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});
