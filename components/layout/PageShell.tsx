import { colors } from "@/src/saas/design-system";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, ViewStyle } from "react-native";

export function PageShell({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, style]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    width: "100%",
    maxWidth: 1360,
    alignSelf: "center",
    padding: 24,
    gap: 24,
  },
});
