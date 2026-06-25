import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

export function SiteButton({
  label,
  onPress,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary";
}) {
  return (
    <Pressable style={[styles.button, tone === "primary" ? styles.primary : styles.secondary]} onPress={onPress}>
      <Ionicons
        name={tone === "primary" ? "arrow-forward" : "open-outline"}
        size={16}
        color={tone === "primary" ? "#08101C" : "#F8FAFC"}
      />
      <Text style={[styles.text, tone === "primary" ? styles.textPrimary : styles.textSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: "#FACC15",
    borderColor: "#FACC15",
    shadowColor: "#FACC15",
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderColor: "rgba(226, 232, 240, 0.16)",
  },
  text: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.1,
  },
  textPrimary: {
    color: "#08101c",
  },
  textSecondary: {
    color: "#f8fafc",
  },
});
