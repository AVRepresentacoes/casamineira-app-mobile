import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <EmpresaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#020617" },
        }}
      />
    </EmpresaProvider>
  );
}
