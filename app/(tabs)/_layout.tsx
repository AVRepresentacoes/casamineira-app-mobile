import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#03040a",
          borderTopColor: "#0b1220",
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#facc15",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      {/* INÍCIO */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* FERRAMENTAS */}
      <Tabs.Screen
        name="ferramentas"
        options={{
          title: "Ferramentas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="tools"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* PEDIDOS */}
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="clipboard-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* PERFIL */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ⛔ TUDO ABAIXO FICA FORA DO RODAPÉ */}
      <Tabs.Screen name="servicos" options={{ href: null }} />
      <Tabs.Screen name="portfolio" options={{ href: null }} />
      <Tabs.Screen name="contratos" options={{ href: null }} />
      <Tabs.Screen name="painel-cliente" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
