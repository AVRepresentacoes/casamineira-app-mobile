import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

type Props = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  href: string;
  badge?: string;
};

export function HomeCard({ title, icon, href, badge }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(href as any)}>
      <MaterialCommunityIcons name={icon} size={30} color="#facc15" />
      <Text style={styles.text}>{title}</Text>

      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    padding: 18,
    width: "48%",
    marginBottom: 16,
  },
  text: {
    color: "#e5e7eb",
    fontWeight: "800",
    marginTop: 12,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
});
