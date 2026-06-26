import { colors, radius } from "@/src/saas/design-system";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

export function PrimaryButton({
  label,
  icon,
  loading = false,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.button, loading ? styles.disabled : null]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={colors.primaryText} /> : icon ? <Ionicons name={icon} size={17} color={colors.primaryText} /> : null}
      {!loading ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
  },
  label: {
    color: colors.primaryText,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.65,
  },
});
