import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { BusinessProjectService } from "@/services/business-project";
import { findBusinessDnaBySlug } from "@/src/business-dna/catalog";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.infoPanel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.itemList}>
        {items.map((item) => (
          <View key={item} style={styles.itemRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#86efac" />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function BusinessDnaDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = String(params.slug || "");
  const dna = findBusinessDnaBySlug(slug);

  async function handleUseBusinessDna() {
    if (!dna) return;
    try {
      await BusinessProjectService.associateBusinessDna(dna.slug);
      router.push("/projects" as never);
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("autenticado") || message.toLowerCase().includes("session")) {
        router.push("/register" as never);
        return;
      }
      Alert.alert("Business Project", message || "Não foi possível associar este Business DNA agora.");
    }
  }

  if (!dna) {
    return (
      <SaasProductShell title="Business DNA™ não encontrado" subtitle="Volte ao catálogo para escolher outro modelo.">
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Modelo indisponível</Text>
          <Text style={styles.notFoundText}>O Business DNA solicitado não existe no catálogo mockado atual.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/business-dna" as never)}>
            <Text style={styles.primaryButtonText}>Voltar ao catálogo</Text>
          </Pressable>
        </View>
      </SaasProductShell>
    );
  }

  return (
    <SaasProductShell
      title={`${dna.name} DNA™`}
      subtitle={dna.commercialDescription}
    >
      <View style={[styles.hero, { backgroundColor: dna.secondaryColor, borderColor: `${dna.primaryColor}55` }]}>
        <View style={[styles.heroGlow, { backgroundColor: `${dna.primaryColor}33` }]} />
        <View style={[styles.heroIcon, { backgroundColor: `${dna.primaryColor}22`, borderColor: `${dna.primaryColor}66` }]}>
          <MaterialCommunityIcons name={dna.icon} size={42} color={dna.primaryColor} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroKicker, { color: dna.primaryColor }]}>{dna.category} / {dna.segment}</Text>
          <Text style={styles.heroTitle}>{dna.name} DNA™</Text>
          <Text style={styles.heroText}>{dna.description}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.metaChip}>Maturidade: {dna.maturity}</Text>
            <Text style={styles.metaChip}>Implantação: {dna.averageImplementationTime}</Text>
            <Text style={styles.metaChip}>Plano: {dna.recommendedPlan}</Text>
          </View>
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.mainColumn}>
          <View style={styles.descriptionPanel}>
            <Text style={styles.panelEyebrow}>Descrição</Text>
            <Text style={styles.descriptionText}>{dna.commercialDescription}</Text>
          </View>

          <InfoList title="Funcionalidades padrão" items={dna.defaultFeatures} />
          <InfoList title="Módulos disponíveis" items={dna.availableModules} />
          <InfoList title="Integrações suportadas" items={dna.supportedIntegrations} />
          <InfoList title="Recursos premium" items={dna.premiumResources} />
        </View>

        <View style={styles.sidePanel}>
          <Text style={styles.sideEyebrow}>Plano recomendado</Text>
          <Text style={styles.sideTitle}>{dna.recommendedPlan}</Text>
          <Text style={styles.sideText}>
            Estrutura recomendada para iniciar este Business DNA™ com qualidade comercial e espaço para evolução.
          </Text>

          <View style={styles.sideBlock}>
            <Text style={styles.sideBlockTitle}>Benefícios</Text>
            {dna.benefits.map((benefit) => (
              <Text key={benefit} style={styles.sideBullet}>• {benefit}</Text>
            ))}
          </View>

          <View style={styles.sideBlock}>
            <Text style={styles.sideBlockTitle}>Casos de uso</Text>
            {dna.useCases.map((useCase) => (
              <Text key={useCase} style={styles.sideBullet}>• {useCase}</Text>
            ))}
          </View>

          <View style={styles.aiContract}>
            <Text style={styles.sideBlockTitle}>Contrato futuro para IA</Text>
            <Text style={styles.aiText}>Inputs: {dna.aiPreparationContract.requiredInputs.join(", ")}</Text>
            <Text style={styles.aiText}>Outputs: {dna.aiPreparationContract.suggestedOutputs.join(", ")}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void handleUseBusinessDna()}>
            <Text style={styles.primaryButtonText}>Usar este Business DNA</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/business-dna" as never)}>
            <Text style={styles.secondaryButtonText}>Voltar ao catálogo</Text>
          </Pressable>
        </View>
      </View>
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 280,
    borderRadius: 8,
    borderWidth: 1,
    padding: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    alignItems: "center",
  },
  heroGlow: {
    position: "absolute",
    right: -80,
    top: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  heroIcon: {
    width: 92,
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    minWidth: 280,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    marginTop: 10,
  },
  heroText: {
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 10,
    maxWidth: 780,
  },
  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 18,
  },
  metaChip: {
    color: "#f8fafc",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "900",
  },
  layout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
    alignItems: "flex-start",
  },
  mainColumn: {
    flex: 1,
    minWidth: 300,
    gap: 18,
  },
  descriptionPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 22,
    gap: 10,
  },
  panelEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  descriptionText: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 26,
  },
  infoPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.82)",
    padding: 20,
    gap: 14,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  itemList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 220,
    flex: 1,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 12,
  },
  itemText: {
    flex: 1,
    color: "#dbeafe",
    lineHeight: 20,
    fontWeight: "700",
  },
  sidePanel: {
    width: "100%",
    maxWidth: 360,
    minWidth: 290,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    padding: 22,
    gap: 16,
  },
  sideEyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sideTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
  },
  sideText: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
  sideBlock: {
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 8,
  },
  sideBlockTitle: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  sideBullet: {
    color: "#a8b5c7",
    lineHeight: 20,
  },
  aiContract: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.16)",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    padding: 14,
    gap: 8,
  },
  aiText: {
    color: "#bae6fd",
    lineHeight: 20,
    fontSize: 12,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "900",
  },
  notFound: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 24,
    gap: 12,
    alignItems: "flex-start",
  },
  notFoundTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  notFoundText: {
    color: "#94a3b8",
  },
});
