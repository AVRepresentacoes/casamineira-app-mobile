import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { BusinessProjectService } from "@/services/business-project";
import { BusinessDnaService } from "@/services/business-dna";
import { PremiumTemplateService } from "@/services/premium-template";
import { premiumTemplates } from "@/src/template-marketplace/catalog";
import type { BusinessDna } from "@/src/business-dna/types";
import type { PremiumTemplate } from "@/src/template-marketplace/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.infoPanel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.itemGrid}>
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

function MiniTemplateCard({ template }: { template: PremiumTemplate }) {
  const router = useRouter();
  return (
    <Pressable style={styles.miniCard} onPress={() => router.push(`/marketplace/${template.slug}` as never)}>
      <View style={[styles.miniIcon, { backgroundColor: `${template.primaryColor}22`, borderColor: `${template.primaryColor}66` }]}>
        <MaterialCommunityIcons name={template.icon} size={22} color={template.primaryColor} />
      </View>
      <View style={styles.miniCopy}>
        <Text style={styles.miniTitle}>{template.name}</Text>
        <Text style={styles.miniText}>{template.businessDnaName}</Text>
      </View>
    </Pressable>
  );
}

export default function TemplateDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = String(params.slug || "");
  const [template, setTemplate] = useState<PremiumTemplate | undefined>();
  const [dna, setDna] = useState<BusinessDna | undefined>();
  const [recommended, setRecommended] = useState<PremiumTemplate[]>([]);
  const [related, setRelated] = useState<PremiumTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTemplate() {
      try {
        setLoading(true);
        const templateData = await PremiumTemplateService.findBySlug(slug);
        if (!active) return;
        setTemplate(templateData);

        if (templateData) {
          const [dnaData, recommendedData, relatedData] = await Promise.all([
            BusinessDnaService.findBySlug(templateData.businessDnaSlug).catch(() => undefined),
            PremiumTemplateService.getBySlugs(templateData.recommendedTemplateSlugs).catch(() => []),
            PremiumTemplateService.getBySlugs(templateData.relatedTemplateSlugs).catch(() => []),
          ]);
          if (!active) return;
          setDna(dnaData);
          setRecommended(recommendedData);
          setRelated(relatedData);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTemplate();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <SaasProductShell title="Carregando Template" subtitle="Buscando template persistido no Supabase.">
        <View style={styles.notFound}>
          <ActivityIndicator color="#facc15" />
          <Text style={styles.notFoundText}>Preparando Marketplace...</Text>
        </View>
      </SaasProductShell>
    );
  }

  if (!template) {
    return (
      <SaasProductShell title="Template não encontrado" subtitle="Volte ao Marketplace para escolher outro projeto.">
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Template indisponível</Text>
          <Text style={styles.notFoundText}>O template solicitado não existe no catálogo premium atual.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/marketplace" as never)}>
            <Text style={styles.primaryButtonText}>Voltar ao Marketplace</Text>
          </Pressable>
        </View>
      </SaasProductShell>
    );
  }

  const selectedTemplate = template;
  const fallbackRelated = related.length ? related : premiumTemplates.filter((item) => item.slug !== selectedTemplate.slug).slice(0, 3);

  async function handleUseTemplate() {
    try {
      await BusinessProjectService.associateTemplate(selectedTemplate.slug);
      router.push("/projects" as never);
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("autenticado") || message.toLowerCase().includes("session")) {
        router.push("/register" as never);
        return;
      }
      Alert.alert("Business Project", message || "Não foi possível associar este template agora.");
    }
  }

  return (
    <SaasProductShell title={selectedTemplate.name} subtitle={selectedTemplate.longDescription}>
      <View style={[styles.hero, { backgroundColor: template.secondaryColor, borderColor: `${template.primaryColor}55` }]}>
        <View style={[styles.heroGlow, { backgroundColor: `${template.primaryColor}33` }]} />
        <View style={[styles.heroIcon, { backgroundColor: `${template.primaryColor}22`, borderColor: `${template.primaryColor}66` }]}>
          <MaterialCommunityIcons name={template.icon} size={42} color={template.primaryColor} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroKicker, { color: template.primaryColor }]}>{template.badge} / {template.category}</Text>
          <Text style={styles.heroTitle}>{template.name}</Text>
          <Text style={styles.heroText}>{template.description}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.metaChip}>★★★★★ {template.rating.toFixed(1)}</Text>
            <Text style={styles.metaChip}>{template.downloads} downloads</Text>
            <Text style={styles.metaChip}>{template.deployments} implantações</Text>
            <Text style={styles.metaChip}>Versão {template.version}</Text>
          </View>
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.mainColumn}>
          <View style={styles.gallery}>
            {template.gallery.map((item, index) => (
              <View key={item} style={[styles.galleryItem, { backgroundColor: index === 0 ? `${template.primaryColor}22` : "rgba(255, 255, 255, 0.05)" }]}>
                <Text style={styles.galleryNumber}>0{index + 1}</Text>
                <Text style={styles.galleryText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.descriptionPanel}>
            <Text style={styles.panelEyebrow}>Descrição</Text>
            <Text style={styles.descriptionText}>{template.longDescription}</Text>
            <View style={styles.dnaBox}>
              <Text style={styles.dnaLabel}>Business DNA utilizado</Text>
              <Text style={styles.dnaValue}>{template.businessDnaName}</Text>
              {dna ? <Text style={styles.dnaDescription}>{dna.description}</Text> : null}
            </View>
          </View>

          <InfoPanel title="Funcionalidades" items={template.features} />
          <InfoPanel title="Módulos inclusos" items={template.includedModules} />
          <InfoPanel title="Integrações" items={template.integrations} />
          <InfoPanel title="Tecnologias" items={template.technologies} />

          <View style={styles.recommendations}>
            <Text style={styles.panelTitle}>Templates Recomendados</Text>
            <View style={styles.miniGrid}>
              {recommended.map((item) => (
                <MiniTemplateCard key={item.id} template={item} />
              ))}
            </View>
          </View>

          <View style={styles.recommendations}>
            <Text style={styles.panelTitle}>Templates Relacionados</Text>
            <View style={styles.miniGrid}>
              {fallbackRelated.map((item) => (
                <MiniTemplateCard key={item.id} template={item} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sidePanel}>
          <Text style={styles.sideEyebrow}>Plano recomendado</Text>
          <Text style={styles.sideTitle}>{template.recommendedPlan}</Text>
          <Text style={styles.price}>{template.priceLabel}</Text>
          <Text style={styles.sideText}>Template preparado para implantação assistida e futura personalização por IA.</Text>

          <View style={styles.sideMetrics}>
            <View style={styles.sideMetric}>
              <Text style={styles.sideMetricValue}>{template.modulesCount}</Text>
              <Text style={styles.sideMetricLabel}>módulos</Text>
            </View>
            <View style={styles.sideMetric}>
              <Text style={styles.sideMetricValue}>{template.averageImplementationTime}</Text>
              <Text style={styles.sideMetricLabel}>implantação</Text>
            </View>
          </View>

          <View style={styles.sideBlock}>
            <Text style={styles.sideBlockTitle}>Compatibilidade</Text>
            {template.compatibility.map((item) => (
              <Text key={item} style={styles.sideBullet}>• {item}</Text>
            ))}
          </View>

          <View style={styles.aiBox}>
            <Text style={styles.sideBlockTitle}>Contrato futuro para IA</Text>
            <Text style={styles.aiText}>Contexto: {template.aiIntegrationContract.recommendedPromptContext.join(", ")}</Text>
            <Text style={styles.aiText}>Limites: {template.aiIntegrationContract.generationBoundaries.join(", ")}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void handleUseTemplate()}>
            <Text style={styles.primaryButtonText}>Usar Template</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Alert.alert("Demonstração", "A visualização pública deste template será conectada em uma próxima etapa.")}
          >
            <Text style={styles.secondaryButtonText}>Visualizar Demonstração</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={() => router.push("/marketplace" as never)}>
            <Text style={styles.ghostButtonText}>Voltar ao Marketplace</Text>
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
    minHeight: 290,
    borderRadius: 8,
    borderWidth: 1,
    padding: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    alignItems: "center",
  },
  heroGlow: {
    position: "absolute",
    right: -80,
    top: -110,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  heroIcon: {
    width: 96,
    height: 96,
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
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "900",
    marginTop: 10,
  },
  heroText: {
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 10,
    maxWidth: 800,
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
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  galleryItem: {
    flex: 1,
    minWidth: 180,
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    padding: 16,
    justifyContent: "space-between",
  },
  galleryNumber: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
  },
  galleryText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  descriptionPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 22,
    gap: 14,
  },
  panelEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  descriptionText: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 26,
  },
  dnaBox: {
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    gap: 6,
  },
  dnaLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dnaValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  dnaDescription: {
    color: "#a8b5c7",
    lineHeight: 21,
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
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  itemRow: {
    flex: 1,
    minWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  recommendations: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.82)",
    padding: 20,
    gap: 14,
  },
  miniGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    minWidth: 230,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.10)",
    padding: 14,
  },
  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCopy: {
    flex: 1,
  },
  miniTitle: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  miniText: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
  },
  sidePanel: {
    width: "100%",
    maxWidth: 370,
    minWidth: 290,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
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
  price: {
    color: "#fde68a",
    fontSize: 18,
    fontWeight: "900",
  },
  sideText: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
  sideMetrics: {
    flexDirection: "row",
    gap: 10,
  },
  sideMetric: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    gap: 5,
  },
  sideMetricValue: {
    color: "#f8fafc",
    fontWeight: "900",
    lineHeight: 20,
  },
  sideMetricLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
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
  aiBox: {
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "900",
  },
  ghostButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: "#93c5fd",
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
