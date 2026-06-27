import { BrandLogo } from "@/components/brand/BrandLogo";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteButton } from "@/components/site/SiteButton";
import { supabase } from "@/lib/supabase";
import { isPublicRoute } from "@/src/saas/routes";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "grid-outline" },
  { label: "Studio", href: "/business-studio", icon: "construct-outline" },
  { label: "DNA", href: "/business-dna", icon: "git-network-outline" },
  { label: "Marketplace", href: "/marketplace", icon: "storefront-outline" },
  { label: "Consultor", href: "/ai-business-consultant", icon: "chatbubbles-outline" },
  { label: "Workforce", href: "/ai-workforce", icon: "people-outline" },
  { label: "Projetos", href: "/projects", icon: "folder-open-outline" },
  { label: "Architect", href: "/ai-solution-architect", icon: "sparkles-outline" },
  { label: "Review", href: "/project-review", icon: "checkmark-done-outline" },
] as const;

export function SaasProductShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const publicPage = isPublicRoute(pathname);
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setAuthenticated(Boolean(session?.user));
      setChecking(false);
    }

    void checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(Boolean(session?.user));
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!publicPage && !checking && !authenticated) {
      router.replace("/login");
    }
  }, [authenticated, checking, publicPage, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!publicPage && (checking || !authenticated)) {
    return (
      <View style={styles.loading}>
        <BrandLogo size="medium" showText={false} />
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {publicPage ? (
        <PublicHeader />
      ) : (
        <View style={styles.topbar}>
          <Pressable style={styles.brand} onPress={() => router.push("/dashboard" as never)}>
            <BrandLogo size="small" showText />
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRail} style={styles.navScroller}>
            <View style={styles.nav}>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Pressable key={item.href} style={[styles.navItem, active ? styles.navItemActive : null]} onPress={() => router.push(item.href as never)}>
                    <Ionicons name={item.icon} size={16} color={active ? "#08101c" : "#cbd5e1"} />
                    <Text style={[styles.navText, active ? styles.navTextActive : null]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionSlot}>
              <SiteButton label="Sair" tone="secondary" onPress={() => void handleLogout()} />
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.eyebrow}>Casa Mineira SaaS</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A12",
  },
  content: {
    width: "100%",
    maxWidth: 1360,
    alignSelf: "center",
    padding: 24,
    gap: 24,
  },
  loading: {
    flex: 1,
    backgroundColor: "#070A12",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 260,
    flexShrink: 0,
  },
  navScroller: {
    flex: 1,
    minWidth: 0,
  },
  navRail: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    flexShrink: 0,
  },
  navItemActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  navText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  navTextActive: {
    color: "#08101c",
  },
  actionSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 24,
    gap: 10,
  },
  eyebrow: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
  },
  subtitle: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 860,
  },
});
