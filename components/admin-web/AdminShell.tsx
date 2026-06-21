import { adminWebLogout } from "@/lib/admin-web";
import { usePathname, useRouter } from "expo-router";
import { ReactNode, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const NAV_ITEMS = [
  { label: "Dashboard", caption: "Visão executiva", href: "/admin" },
  { label: "Empresas", caption: "Empresas e operação", href: "/admin/empresas" },
  { label: "Oferta", caption: "Gestão de planos", href: "/admin/planos" },
  { label: "Assinaturas", caption: "Cobrança e status", href: "/admin/assinaturas" },
  { label: "Usuários", caption: "Acesso e vínculos", href: "/admin/usuarios" },
  { label: "Métricas", caption: "Receita e crescimento", href: "/admin/metricas" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const activeHref = useMemo(() => {
    if (!pathname) return "/admin";
    const match = [...NAV_ITEMS]
      .sort((left, right) => right.href.length - left.href.length)
      .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return match?.href || "/admin";
  }, [pathname]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await adminWebLogout();
      router.replace("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />
      <View style={styles.sidebar}>
        <View style={styles.brandBlock}>
          <View style={styles.brandBadge}>
            <Image source={require("../../assets/images/icons/icon.png")} style={styles.brandLogo} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.brandEyebrow}>Console do Proprietário</Text>
            <Text style={styles.brandTitle}>Casa Mineira Admin</Text>
            <Text style={styles.brandDescription}>Controle completo da plataforma, da aquisição ao faturamento.</Text>
          </View>
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === activeHref;
            return (
              <Pressable
                key={item.href}
                style={[styles.navItem, active ? styles.navItemActive : null]}
                onPress={() => router.push(item.href as never)}
              >
                <Text style={[styles.navItemText, active ? styles.navItemTextActive : null]}>{item.label}</Text>
                <Text style={[styles.navItemCaption, active ? styles.navItemCaptionActive : null]}>{item.caption}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.liveCard}>
            <Text style={styles.liveLabel}>Ambiente</Text>
            <Text style={styles.liveValue}>Console seguro exclusivo da web</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={() => void handleLogout()} disabled={loggingOut}>
            {loggingOut ? <ActivityIndicator color="#f8fafc" /> : <Text style={styles.logoutText}>Sair do admin</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.topbarEyebrow}>Super Admin</Text>
            <Text style={styles.topbarText}>Painel do proprietário da plataforma</Text>
            <Text style={styles.topbarSubtext}>Governança, crescimento, receita e operação em um único ambiente.</Text>
          </View>
          <View style={styles.topbarPills}>
            <View style={styles.topbarPill}>
              <Text style={styles.topbarPillText}>Perfis protegidos</Text>
            </View>
            <View style={styles.topbarPill}>
              <Text style={styles.topbarPillText}>Isolado do mobile</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#050816",
  },
  backgroundOrbA: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(14, 165, 233, 0.12)",
  },
  backgroundOrbB: {
    position: "absolute",
    right: -140,
    bottom: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(250, 204, 21, 0.10)",
  },
  sidebar: {
    width: 292,
    backgroundColor: "rgba(7, 12, 26, 0.92)",
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.22)",
    padding: 24,
    justifyContent: "space-between",
  },
  brandBlock: {
    gap: 16,
  },
  brandBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.24)",
  },
  brandLogo: {
    width: 56,
    height: 56,
  },
  brandEyebrow: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  brandTitle: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 8,
  },
  brandDescription: {
    color: "#8da2c0",
    marginTop: 8,
    lineHeight: 20,
  },
  nav: {
    marginTop: 32,
    gap: 10,
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  navItemActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  navItemText: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 14,
  },
  navItemTextActive: {
    color: "#08101c",
  },
  navItemCaption: {
    color: "#7f92ac",
    fontSize: 12,
    marginTop: 4,
  },
  navItemCaptionActive: {
    color: "#243042",
  },
  sidebarFooter: {
    gap: 12,
  },
  liveCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  liveLabel: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  liveValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: "#172033",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  main: {
    flex: 1,
  },
  topbar: {
    minHeight: 88,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
    paddingHorizontal: 28,
    paddingVertical: 18,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "rgba(9, 14, 30, 0.82)",
  },
  topbarEyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  topbarText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  topbarSubtext: {
    color: "#8ea6c5",
    fontSize: 13,
    marginTop: 6,
  },
  topbarPills: {
    flexDirection: "row",
    gap: 10,
  },
  topbarPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  topbarPillText: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "800",
  },
  content: {
    padding: 28,
    paddingBottom: 56,
  },
});
