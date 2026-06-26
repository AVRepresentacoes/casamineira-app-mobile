import { BrandLogo } from "@/components/brand/BrandLogo";
import { SiteButton } from "@/components/site/SiteButton";
import { usePathname, useRouter } from "expo-router";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

const NAV_ITEMS = [
  { label: "Produto", href: "/landing" },
  { label: "Planos", href: "/pricing" },
  { label: "Demo", href: "/demo" },
  { label: "FAQ", href: "/faq" },
  { label: "Contato", href: "/contato" },
];

const FOOTER_ITEMS = [
  ...NAV_ITEMS,
  { label: "Política de Privacidade", href: "/politica-privacidade" },
];

export function SiteShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.shell}>
        <View style={styles.topbar}>
          <Pressable style={styles.brand} onPress={() => router.push("/landing")}>
            <BrandLogo size="small" showText />
          </Pressable>

          <View style={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Pressable key={item.href} style={[styles.navItem, active ? styles.navItemActive : null]} onPress={() => router.push(item.href as never)}>
                  <Text style={[styles.navText, active ? styles.navTextActive : null]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.topActions}>
            <SiteButton label="Entrar" tone="secondary" onPress={() => router.push("/(auth)/login")} />
            <SiteButton label="Teste grátis" onPress={() => router.push("/teste-gratis")} />
          </View>
        </View>

        <View style={styles.main}>{children}</View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Casa Mineira SaaS</Text>
          <Text style={styles.footerText}>Plataforma para empresas de serviços ganharem mais controle operacional, resposta comercial mais rápida e uma experiência de marca mais forte.</Text>
          <View style={styles.footerLinks}>
            {FOOTER_ITEMS.map((item) => (
              <Pressable key={item.href} onPress={() => router.push(item.href as never)}>
                <Text style={styles.footerLink}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A12",
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  shell: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    gap: 30,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    shadowColor: "#020617",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 240,
  },
  nav: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  navItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(226, 232, 240, 0.14)",
    shadowColor: "#67e8f9",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  navText: {
    color: "#CBD5E1",
    fontWeight: "800",
    fontSize: 13,
  },
  navTextActive: {
    color: "#f8fafc",
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
  },
  main: {
    gap: 44,
  },
  footer: {
    padding: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.1)",
    backgroundColor: "rgba(10, 14, 26, 0.7)",
    marginBottom: 10,
    gap: 14,
  },
  footerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  footerText: {
    color: "#94a3b8",
    maxWidth: 760,
    lineHeight: 25,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 6,
  },
  footerLink: {
    color: "#dbe7f4",
    fontWeight: "700",
  },
});
