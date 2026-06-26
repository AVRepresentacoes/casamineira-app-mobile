import { colors, radius } from "@/src/saas/design-system";
import { StyleSheet, Text, View } from "react-native";

export function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "warning" | "info" }) {
  const toneStyle = {
    default: styles.default,
    success: styles.success,
    warning: styles.warning,
    info: styles.info,
  }[tone];

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
  },
  default: {
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  success: {
    borderColor: "rgba(134,239,172,0.35)",
    backgroundColor: "rgba(22,101,52,0.2)",
  },
  warning: {
    borderColor: "rgba(250,204,21,0.35)",
    backgroundColor: "rgba(113,63,18,0.2)",
  },
  info: {
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(8,145,178,0.16)",
  },
});
