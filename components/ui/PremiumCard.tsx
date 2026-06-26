import { colors, radius, spacing } from "@/src/saas/design-system";
import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export function PremiumCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: spacing.xl,
  },
});
