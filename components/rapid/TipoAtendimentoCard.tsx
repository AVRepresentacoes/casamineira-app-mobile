import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  description: string;
  badge: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function TipoAtendimentoCard({
  title,
  description,
  badge,
  selected,
  onPress,
  icon = "flash-outline",
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
            <Ionicons name={icon} size={14} color={selected ? "#0b1220" : "#facc15"} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={[styles.badge, selected && styles.badgeSelected]}>
          <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{badge}</Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#243042",
    borderRadius: 16,
    backgroundColor: "#081225",
    padding: 14,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: "#facc15",
    backgroundColor: "#111827",
    shadowColor: "#facc15",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#172033",
  },
  iconWrapSelected: {
    backgroundColor: "#facc15",
  },
  title: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 15,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#0b1220",
  },
  badgeSelected: {
    borderColor: "#facc15",
    backgroundColor: "#facc15",
  },
  badgeText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
  },
  badgeTextSelected: {
    color: "#92400e",
  },
  description: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
  },
});
