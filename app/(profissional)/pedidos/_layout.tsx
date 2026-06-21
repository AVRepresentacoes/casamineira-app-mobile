import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

export default function ProfissionalPedidosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#0b1220",
        },
        headerTintColor: "#facc15",
        headerTitleStyle: {
          color: "#ffffff",
        },
        contentStyle: {
          backgroundColor: "#020617",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Pedidos",
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: "",
          headerBackVisible: false,
          gestureEnabled: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                router.replace("/(profissional)");
              }}
              style={{ paddingRight: 8, paddingVertical: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#facc15" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[id]/proposta"
        options={{
          title: "Enviar proposta",
        }}
      />
      <Stack.Screen
        name="[id]/chat"
        options={{
          title: "Chat",
        }}
      />
    </Stack>
  );
}
