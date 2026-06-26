import { gradients } from "@/src/saas/design-system";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleSheet } from "react-native";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={gradients.publicShell} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shell}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 720,
  },
});
