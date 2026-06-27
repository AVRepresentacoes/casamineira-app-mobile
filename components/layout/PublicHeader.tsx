import { BrandLogo } from "@/components/brand/BrandLogo";
import { colors, componentSizes, radii, shadows, spacing, webMotion } from "@/src/design-system/tokens";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "home-outline" },
  { label: "Business DNA", href: "/business-dna", icon: "git-network-outline" },
  { label: "Marketplace", href: "/marketplace", icon: "storefront-outline" },
] as const;

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewport} contentContainerStyle={styles.rail}>
      <Pressable style={styles.brand} onPress={() => router.push("/" as never)}>
        <BrandLogo size="small" showText />
      </Pressable>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <Pressable key={item.href} style={[styles.navItem, active ? styles.navItemActive : null]} onPress={() => router.push(item.href as never)}>
              <Ionicons name={item.icon} size={16} color={active ? colors.brandText : colors.textMuted} />
              <Text style={[styles.navText, active ? styles.navTextActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.loginButton]} onPress={() => router.push("/login" as never)}>
          <Text style={styles.loginText}>Entrar</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.registerButton]} onPress={() => router.push("/register" as never)}>
          <Text style={styles.registerText}>Criar Conta</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.brandText} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: "100%",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  rail: {
    minHeight: componentSizes.headerHeight,
    minWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  navItem: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 0,
    ...webMotion,
  },
  navItemActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  navText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  navTextActive: {
    color: colors.brandText,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    flexShrink: 0,
  },
  actionButton: {
    minHeight: componentSizes.buttonHeight,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    flexShrink: 0,
    ...webMotion,
  },
  loginButton: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  registerButton: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    ...shadows.brand,
  },
  loginText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  registerText: {
    color: colors.brandText,
    fontSize: 14,
    fontWeight: "900",
  },
});
