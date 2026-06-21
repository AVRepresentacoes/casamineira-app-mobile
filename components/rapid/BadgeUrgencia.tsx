import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function BadgeUrgencia() {
  return (
    <View style={styles.badge}>
      <Ionicons name="flash" size={11} color="#fb7185" />
      <Text style={styles.text}>Urgente</Text>
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
    borderColor: "#7f1d1d",
    backgroundColor: "#450a0a",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    color: "#fecdd3",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
