import { SiteButton } from "@/components/site/SiteButton";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "grid-outline" },
  { label: "Apps", href: "/apps", icon: "apps-outline" },
  { label: "Gerador IA", href: "/ai-app-generator", icon: "sparkles-outline" },
  { label: "Planos", href: "/billing", icon: "card-outline" },
  { label: "Conta", href: "/settings", icon: "settings-outline" },
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
    if (!checking && !authenticated) {
      router.replace("/login");
    }
  }, [authenticated, checking, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking || !authenticated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <Pressable style={styles.brand} onPress={() => router.push("/dashboard")}>
          <View style={styles.brandMark}>
            <Ionicons name="sparkles" size={20} color="#08101c" />
          </View>
          <View>
            <Text style={styles.brandTitle}>Casa Mineira SaaS</Text>
            <Text style={styles.brandSubtitle}>Plataforma de apps com IA</Text>
          </View>
        </Pressable>

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

        <SiteButton label="Sair" tone="secondary" onPress={() => void handleLogout()} />
      </View>

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
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 14,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 230,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  nav: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  navText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
  },
  navTextActive: {
    color: "#08101c",
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
