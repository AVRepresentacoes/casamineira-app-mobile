import { AdminShell } from "@/components/admin-web/AdminShell";
import { useRequireSuperAdminWeb } from "@/hooks/useRequireSuperAdminWeb";
import { Redirect, Slot, usePathname } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AdminLayout() {
  const pathname = usePathname();
  const { checking, authenticated, superAdmin, webOnly } = useRequireSuperAdminWeb();
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (!webOnly || typeof document === "undefined") return;

    const routeLabel =
      pathname === "/admin/login"
        ? "Login"
        : pathname === "/admin/empresas"
          ? "Empresas"
          : pathname === "/admin/planos"
            ? "Planos"
            : pathname === "/admin/assinaturas"
              ? "Assinaturas"
              : pathname === "/admin/usuarios"
                ? "Usuarios"
                : pathname === "/admin/metricas"
                  ? "Metricas"
                  : pathname?.startsWith("/admin/empresa/")
                    ? "Empresa"
                    : "Dashboard";

    document.title = `${routeLabel} | Casa Mineira Admin`;

    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.setAttribute("name", "theme-color");
      document.head.appendChild(themeColor);
    }
    themeColor.setAttribute("content", "#050816");
  }, [pathname, webOnly]);

  if (!webOnly) {
    return <Redirect href="/" />;
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (isLoginRoute) {
    if (authenticated && superAdmin) {
      return <Redirect href="/admin" />;
    }

    return <Slot />;
  }

  if (!authenticated) {
    return <Redirect href="/admin/login" />;
  }

  if (!superAdmin) {
    return <Redirect href="/admin/login" />;
  }

  return (
    <AdminShell>
      <Slot />
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#08101c",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
