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
      <Text style={[styles.text, tone === "primary" ? styles.textPrimary : styles.textSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
    shadowColor: "#facc15",
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  secondary: {
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    borderColor: "rgba(148, 163, 184, 0.26)",
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
