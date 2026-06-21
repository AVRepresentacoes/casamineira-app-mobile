import { Redirect, Stack } from "expo-router";
import { Platform } from "react-native";

export default function SiteLayout() {
  if (Platform.OS !== "web") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#050914" },
      }}
    />
  );
}
