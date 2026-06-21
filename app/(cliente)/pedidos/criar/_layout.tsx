import { Stack } from "expo-router";

export default function CriarPedidoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#020617" },
        headerTintColor: "#facc15",
        headerTitleStyle: { fontWeight: "900" },
        contentStyle: { backgroundColor: "#020617" },
      }}
    />
  );
}