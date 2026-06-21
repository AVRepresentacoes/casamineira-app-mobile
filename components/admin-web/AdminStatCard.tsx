import { StyleSheet, Text, View } from "react-native";

export function AdminStatCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "accent" | "success";
}) {
  return (
    <View style={[styles.card, toneStyles[tone]]}>
      <View style={[styles.accentBar, accentBarStyles[tone]]} />
      <View style={styles.cardTop}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.dot, dotStyles[tone]]} />
      </View>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 180,
    flex: 1,
    backgroundColor: "#101826",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.24)",
    padding: 20,
    gap: 8,
    overflow: "hidden",
    shadowColor: "#020617",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  accentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#9fb3cd",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  value: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "900",
  },
  helper: {
    color: "#d6e0ee",
    fontSize: 13,
    lineHeight: 18,
  },
});

const toneStyles = StyleSheet.create({
  default: {
    backgroundColor: "rgba(13, 20, 34, 0.92)",
  },
  accent: {
    backgroundColor: "rgba(7, 89, 133, 0.32)",
  },
  success: {
    backgroundColor: "rgba(20, 83, 45, 0.34)",
  },
});

const accentBarStyles = StyleSheet.create({
  default: { backgroundColor: "rgba(96, 165, 250, 0.65)" },
  accent: { backgroundColor: "rgba(34, 211, 238, 0.82)" },
  success: { backgroundColor: "rgba(74, 222, 128, 0.82)" },
});

const dotStyles = StyleSheet.create({
  default: { backgroundColor: "#94a3b8" },
  accent: { backgroundColor: "#67e8f9" },
  success: { backgroundColor: "#4ade80" },
});
