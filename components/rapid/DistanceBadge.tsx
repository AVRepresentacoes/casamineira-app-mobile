import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  km: number | null;
};

export default function DistanceBadge({ km }: Props) {
  return (
    <View style={styles.badge}>
      <Ionicons name="location-outline" size={12} color="#67e8f9" />
      <Text style={styles.text}>
        {typeof km === "number" ? `${km.toFixed(1)} km` : "Distância indisponível"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#155e75",
    backgroundColor: "#082f49",
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  text: {
    color: "#cffafe",
    fontSize: 11,
    fontWeight: "800",
  },
});
