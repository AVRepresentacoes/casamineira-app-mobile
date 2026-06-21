import { setActiveRole } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect } from "react";

export default function ProfissionalTabs() {
  const pathname = usePathname();

  useEffect(() => {
    void setActiveRole("profissional");
  }, [pathname]);

  const renderIcon = (name: keyof typeof Ionicons.glyphMap, color: string, size: number) => (
    <Ionicons name={name} size={size} color={color} />
  );

  return (
    <Tabs
      initialRouteName="menu"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0b1220",
          borderTopColor: "#111827",
        },
        tabBarActiveTintColor: "#facc15",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => renderIcon("grid-outline", color, size),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: "Pedidos disponíveis",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => renderIcon("briefcase-outline", color, size),
        }}
      />

      <Tabs.Screen
        name="financeiro"
        options={{
          title: "Financeiro",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => renderIcon("wallet-outline", color, size),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => renderIcon("person-outline", color, size),
        }}
      />

      <Tabs.Screen
        name="(internas)"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="pedidos"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="avaliacoes"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="carteira"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="configuracoes"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="contratos"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="portfolio"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="propostas"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="servicos"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}
