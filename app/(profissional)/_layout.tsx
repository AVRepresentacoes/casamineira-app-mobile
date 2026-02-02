import { Stack } from "expo-router";

export default function ProfissionalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#03040a" },
      }}
    />
  );
}
