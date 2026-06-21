import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function SiteFeatureCard({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color="#0f172a" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 260,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.2)",
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    padding: 24,
    gap: 15,
    shadowColor: "#020617",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#67e8f9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#67e8f9",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
  },
  description: {
    color: "#96aac7",
    fontSize: 14,
    lineHeight: 23,
  },
});
