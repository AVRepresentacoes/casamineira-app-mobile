import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { HospedagensLaunchSplash } from "@/components/HospedagensLaunchSplash";
import { AiCopilot } from "@/components/ai-copilot/AiCopilot";
import { AiCopilotProvider } from "@/src/ai-copilot/AiCopilotContext";
import { AiWorkforceProvider } from "@/src/ai-workforce/AiWorkforceContext";
import { getConfiguredTenantSlug } from "@/lib/tenant";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const isHospedagensApp = getConfiguredTenantSlug() === "hospedagens-caminhos-da-fe";
  const [showHospedagensSplash, setShowHospedagensSplash] = useState(isHospedagensApp);

  useEffect(() => {
    if (!isHospedagensApp) return;

    const timeout = setTimeout(() => {
      setShowHospedagensSplash(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isHospedagensApp]);

  return (
    <EmpresaProvider>
      <AiCopilotProvider>
        <AiWorkforceProvider>
          <StatusBar style="light" hidden={showHospedagensSplash} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#020617" },
            }}
          />
          <AiCopilot />
          {showHospedagensSplash ? <HospedagensLaunchSplash /> : null}
        </AiWorkforceProvider>
      </AiCopilotProvider>
    </EmpresaProvider>
  );
}
