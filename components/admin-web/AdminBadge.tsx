import { StyleSheet, Text, View } from "react-native";

export function AdminBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <View style={[styles.dot, dotStyles[tone]]} />
      <Text style={[styles.text, textStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
  },
});

const toneStyles = StyleSheet.create({
  default: { backgroundColor: "rgba(51, 65, 85, 0.22)", borderColor: "rgba(148, 163, 184, 0.12)" },
  success: { backgroundColor: "rgba(34,197,94,0.16)", borderColor: "rgba(34,197,94,0.22)" },
  warning: { backgroundColor: "rgba(250,204,21,0.16)", borderColor: "rgba(250,204,21,0.22)" },
  danger: { backgroundColor: "rgba(248,113,113,0.16)", borderColor: "rgba(248,113,113,0.22)" },
  info: { backgroundColor: "rgba(56,189,248,0.16)", borderColor: "rgba(56,189,248,0.22)" },
});

const dotStyles = StyleSheet.create({
  default: { backgroundColor: "#94a3b8" },
  success: { backgroundColor: "#4ade80" },
  warning: { backgroundColor: "#facc15" },
  danger: { backgroundColor: "#f87171" },
  info: { backgroundColor: "#38bdf8" },
});

const textStyles = StyleSheet.create({
  default: { color: "#e2e8f0" },
  success: { color: "#dcfce7" },
  warning: { color: "#fef3c7" },
  danger: { color: "#fee2e2" },
  info: { color: "#dbeafe" },
});
