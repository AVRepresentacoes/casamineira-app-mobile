import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#03040a" },
        tabBarActiveTintColor: "#facc15",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      {/* 1️⃣ HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="buscar/index"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3️⃣ PEDIDOS */}
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="meus-dados"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="cancelamento-conta"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="central-ajuda"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="politica-privacidade"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Lojas",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="gas"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="gas-checkout"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="carrinho"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="compras"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="lojas"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      {/* 4️⃣ PERFIL */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="lojas/[fornecedorId]"
        options={{
          href: null,
          headerShown: false,
        }}
      />

    </Tabs>
  );
}
