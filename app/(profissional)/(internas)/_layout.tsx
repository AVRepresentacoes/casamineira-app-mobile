import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

const MENU_ROUTES = new Set([
  "agenda",
  "avaliacoes",
  "propostas",
  "ranking",
  "servicos",
  "portfolio",
  "contratos",
  "assinatura",
  "configuracoes",
  "meus-pedidos",
  "inovacao",
  "analytics",
  "crescimento",
  "notificacoes",
  "chamados-rapidos",
  "dashboard-empresa",
  "convites-profissionais",
]);

export default function ProfissionalInternasLayout() {
  return (
    <Stack
      screenOptions={({
        route,
        navigation,
      }: {
        route: { name: string; params?: Record<string, unknown> };
        navigation: { canGoBack: () => boolean };
      }) => {
        const fromPerfil = (route.params as Record<string, unknown> | undefined)?.from === "perfil";
        const fromMenu = MENU_ROUTES.has(route.name) && !fromPerfil;
        const destinoVoltar = fromPerfil
          ? "/(profissional)/perfil"
          : fromMenu
          ? "/(profissional)/menu"
          : null;

        return {
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
          headerLeft: destinoVoltar
            ? () => (
                <TouchableOpacity
                  onPress={() => {
                    router.replace(destinoVoltar);
                  }}
                  style={{ paddingRight: 8, paddingVertical: 4 }}
                >
                  <Ionicons name="chevron-back" size={24} color="#facc15" />
                </TouchableOpacity>
              )
            : undefined,
          headerBackVisible: !destinoVoltar,
          gestureEnabled: !destinoVoltar,
        };
      }}
    />
  );
}
