import { SiteButton } from "@/components/site/SiteButton";
import { usePathname, useRouter } from "expo-router";
import { ReactNode } from "react";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

const NAV_ITEMS = [
  { label: "Produto", href: "/landing" },
  { label: "Planos", href: "/pricing" },
  { label: "Demo", href: "/demo" },
  { label: "FAQ", href: "/faq" },
  { label: "Contato", href: "/contato" },
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
      <View style={styles.backdropA} />
      <View style={styles.backdropB} />

      <View style={styles.shell}>
        <View style={styles.topbar}>
          <Pressable style={styles.brand} onPress={() => router.push("/landing")}>
            <Image source={require("@/assets/images/icons/icon.png")} style={styles.logo} contentFit="contain" />
            <View>
              <Text style={styles.brandTitle}>Casa Mineira SaaS</Text>
              <Text style={styles.brandSubtitle}>Site comercial</Text>
            </View>
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
            {NAV_ITEMS.map((item) => (
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
    backgroundColor: "#050914",
  },
  content: {
    paddingHorizontal: 26,
    paddingVertical: 26,
  },
  backdropA: {
    position: "absolute",
    top: -140,
    right: -80,
    width: 420,
    height: 420,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  backdropB: {
    position: "absolute",
    left: -120,
    top: 320,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  shell: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    gap: 34,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.22)",
    backgroundColor: "rgba(5, 9, 20, 0.82)",
    shadowColor: "#020617",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 240,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    shadowColor: "#67e8f9",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  brandTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "#88a4c4",
    fontSize: 12,
    fontWeight: "700",
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  navItemActive: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(148, 163, 184, 0.22)",
    shadowColor: "#67e8f9",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  navText: {
    color: "#cbd5e1",
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
    gap: 42,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 28,
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
