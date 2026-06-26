import { BrandLogo } from "@/components/brand/BrandLogo";
import { colors } from "@/src/saas/design-system";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PublicLayout } from "./PublicLayout";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <View style={styles.wrap}>
        <View style={styles.brand}>
          <BrandLogo size="medium" showText={false} />
          <Text style={styles.product}>Casa Mineira SaaS</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </View>
    </PublicLayout>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 18,
  },
  brand: {
    alignItems: "center",
    gap: 10,
  },
  product: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  copy: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 520,
  },
});
