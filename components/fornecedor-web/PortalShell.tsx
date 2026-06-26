import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type MenuItem = {
  key: string;
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const MENU: MenuItem[] = [
  { key: "dashboard", label: "Painel Geral", path: "/portal-fornecedor", icon: "grid-outline" },
  { key: "precificacao", label: "Central de Precificação Inteligente", path: "/portal-fornecedor/precificacao", icon: "pricetag-outline" },
  { key: "compras", label: "Compras", path: "/portal-fornecedor/compras", icon: "bag-check-outline" },
  { key: "conciliacao", label: "Conciliação", path: "/portal-fornecedor/conciliacao", icon: "git-compare-outline" },
  { key: "configuracoes", label: "Configurações", path: "/portal-fornecedor/configuracoes", icon: "settings-outline" },
  { key: "financeiro_avancado", label: "Contas", path: "/portal-fornecedor/financeiro-avancado", icon: "card-outline" },
  { key: "copilot", label: "Copilot IA", path: "/portal-fornecedor/copilot", icon: "sparkles-outline" },
  { key: "crm", label: "CRM", path: "/portal-fornecedor/crm", icon: "person-add-outline" },
  { key: "equipe", label: "Equipe", path: "/portal-fornecedor/equipe", icon: "people-outline" },
  { key: "estoque", label: "Estoque", path: "/portal-fornecedor/estoque", icon: "layers-outline" },
  { key: "financeiro", label: "Financeiro", path: "/portal-fornecedor/financeiro", icon: "wallet-outline" },
  { key: "fiscal", label: "Fiscal", path: "/portal-fornecedor/fiscal", icon: "document-text-outline" },
  { key: "inovacoes", label: "Inovações X10", path: "/portal-fornecedor/inovacoes", icon: "rocket-outline" },
  { key: "pedidos", label: "Pedidos", path: "/portal-fornecedor/pedidos", icon: "receipt-outline" },
  { key: "power_bi", label: "Power BI Executive", path: "/portal-fornecedor/power-bi", icon: "analytics-outline" },
  { key: "produtos", label: "Produtos", path: "/portal-fornecedor/produtos", icon: "cube-outline" },
  { key: "relatorios", label: "Relatórios", path: "/portal-fornecedor/relatorios", icon: "bar-chart-outline" },
];

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerRight?: ReactNode;
};

export default function PortalShell({ title, subtitle, children, headerRight }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1080;

  const [loading, setLoading] = useState(true);
  const [fornecedorNome, setFornecedorNome] = useState("Fornecedor");

  useEffect(() => {
    async function checkAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/(auth)/login");
          return;
        }

        const { data, error } = await supabase
          .from("profissionais")
          .select("fornecedor_ativo, fornecedor_nome_fantasia")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error || !data || !Boolean((data as any).fornecedor_ativo)) {
          router.replace("/register");
          return;
        }

        setFornecedorNome(String((data as any).fornecedor_nome_fantasia || "Fornecedor"));
      } finally {
        setLoading(false);
      }
    }
    void checkAccess();
  }, [router]);

  const currentKey = useMemo(() => {
    const found = MENU.find((item) => pathname === item.path);
    return found?.key || "dashboard";
  }, [pathname]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {isDesktop ? (
        <View style={styles.sidebar}>
          <Text style={styles.brand}>Portal Fornecedor</Text>
          <Text style={styles.brandSub}>{fornecedorNome}</Text>
          <View style={styles.menuBlock}>
            {MENU.map((item) => {
              const active = item.key === currentKey;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, active ? styles.menuItemActive : null]}
                  onPress={() => router.replace(item.path as any)}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={active ? "#022c22" : "#cbd5e1"}
                  />
                  <Text style={[styles.menuLabel, active ? styles.menuLabelActive : null]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              void logout().then(() => router.replace("/(auth)/login"));
            }}
          >
            <Ionicons name="log-out-outline" size={15} color="#fecaca" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.main}>
        {!isDesktop ? (
          <ScrollView
            horizontal
            style={styles.mobileNav}
            contentContainerStyle={styles.mobileNavContent}
            showsHorizontalScrollIndicator={false}
          >
            {MENU.map((item) => {
              const active = item.key === currentKey;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.mobileNavItem, active ? styles.mobileNavItemActive : null]}
                  onPress={() => router.replace(item.path as any)}
                >
                  <Ionicons name={item.icon} size={14} color={active ? "#022c22" : "#cbd5e1"} />
                  <Text style={[styles.mobileNavText, active ? styles.mobileNavTextActive : null]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617", flexDirection: "row" },
  center: { flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center" },
  sidebar: {
    width: 270,
    backgroundColor: "#0b1220",
    borderRightWidth: 1,
    borderRightColor: "#1f2937",
    paddingTop: 22,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  brand: { color: "#22c55e", fontSize: 18, fontWeight: "900" },
  brandSub: { color: "#94a3b8", marginTop: 2, marginBottom: 18 },
  menuBlock: { gap: 6 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#111827",
  },
  menuItemActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  menuLabel: { color: "#cbd5e1", fontWeight: "800", fontSize: 13 },
  menuLabelActive: { color: "#022c22" },
  logoutBtn: {
    marginTop: "auto",
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#3f1d1d",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  logoutText: { color: "#fecaca", fontWeight: "900" },
  main: { flex: 1 },
  mobileNav: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  mobileNavContent: {
    gap: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
  },
  mobileNavItemActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  mobileNavText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  mobileNavTextActive: { color: "#022c22" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { color: "#22c55e", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#94a3b8", marginTop: 3 },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
