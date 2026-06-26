import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { businessDnaCatalog } from "@/src/business-dna/catalog";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const projectTypes: { id: string; label: string; icon: IconName; featured?: boolean }[] = [
  { id: "app", label: "Aplicativo", icon: "cellphone" },
  { id: "site", label: "Site", icon: "web" },
  { id: "system", label: "Sistema Web", icon: "monitor-dashboard" },
  { id: "marketplace", label: "Marketplace", icon: "storefront-outline" },
  { id: "complete", label: "Empresa Digital Completa", icon: "domain", featured: true },
];

const startPlans = ["Template Premium", "Personalizar modelo existente", "Criar com IA"];

const includedFeatures = [
  "Business DNA™ inicial",
  "Painel administrativo visual",
  "Estrutura white-label",
  "Checklist de publicação",
  "Growth Center™ planejado",
];

export default function BusinessStudioScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(projectTypes[4]);
  const [selectedDna, setSelectedDna] = useState(businessDnaCatalog[2]);
  const [selectedPlan, setSelectedPlan] = useState(startPlans[0]);

  const estimatedTime = useMemo(() => {
    if (selectedPlan === "Criar com IA") return "Briefing guiado em minutos";
    if (selectedPlan === "Personalizar modelo existente") return "Primeira versão em 2-5 dias";
    return "Base premium pronta para configurar";
  }, [selectedPlan]);

  return (
    <SaasProductShell
      title="Business Studio™"
      subtitle="Inicie um Projeto Empresarial com Business DNA™, template e estrutura preparada para Blueprint."
    >
      <View style={styles.studioHero}>
        <View style={styles.heroGlow} />
        <Text style={styles.kicker}>Novo Projeto Empresarial</Text>
        <Text style={styles.heroTitle}>O que você deseja construir?</Text>
        <Text style={styles.heroSubtitle}>Escolha um modelo de negócio e prepare a base para personalização assistida.</Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.marketplaceButton} onPress={() => router.push("/marketplace" as never)}>
            <MaterialCommunityIcons name="shopping-search-outline" size={20} color="#08101c" />
            <Text style={styles.marketplaceButtonText}>Explorar Marketplace</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.mainColumn}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Tipo de produto</Text>
              <Text style={styles.sectionTitle}>Escolha o formato do Projeto Empresarial</Text>
            </View>

            <View style={styles.typeGrid}>
              {projectTypes.map((type) => {
                const active = selectedType.id === type.id;
                return (
                  <Pressable
                    key={type.id}
                    style={[styles.typeCard, active ? styles.typeCardActive : null, type.featured ? styles.typeCardFeatured : null]}
                    onPress={() => setSelectedType(type)}
                  >
                    <View style={[styles.typeIcon, active ? styles.typeIconActive : null]}>
                      <MaterialCommunityIcons name={type.icon} size={30} color={active ? "#07111f" : "#e0f2fe"} />
                    </View>
                    <View style={styles.typeCopy}>
                      <View style={styles.typeTitleRow}>
                        <Text style={[styles.typeTitle, active ? styles.typeTitleActive : null]}>{type.label}</Text>
                        {type.featured ? <Text style={styles.featuredBadge}>⭐</Text> : null}
                      </View>
                      <Text style={[styles.typeText, active ? styles.typeTextActive : null]}>
                        Estrutura visual para iniciar um novo projeto SaaS sem gerar nada automaticamente.
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Business DNA™</Text>
              <Text style={styles.sectionTitle}>Escolha seu Business DNA™</Text>
            </View>

            <View style={styles.dnaGrid}>
              {businessDnaCatalog.slice(0, 11).map((dna) => {
                const active = selectedDna.id === dna.id;
                return (
                  <Pressable key={dna.id} style={[styles.dnaCard, active ? styles.dnaCardActive : null]} onPress={() => setSelectedDna(dna)}>
                    <View style={[styles.dnaIcon, active ? styles.dnaIconActive : null]}>
                      <MaterialCommunityIcons name={dna.icon} size={25} color={active ? "#07111f" : "#67e8f9"} />
                    </View>
                    <Text style={[styles.dnaTitle, active ? styles.dnaTitleActive : null]}>{dna.name}</Text>
                    <Text style={[styles.dnaDescription, active ? styles.dnaDescriptionActive : null]}>{dna.description}</Text>
                  </Pressable>
                );
              })}
              <Pressable style={styles.dnaCard} onPress={() => router.push("/business-dna" as never)}>
                <View style={styles.dnaIcon}>
                  <MaterialCommunityIcons name="plus" size={25} color="#67e8f9" />
                </View>
                <Text style={styles.dnaTitle}>Ver todos</Text>
                <Text style={styles.dnaDescription}>Explore o catálogo completo de Business DNA™.</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Ponto de partida</Text>
              <Text style={styles.sectionTitle}>Como você deseja começar?</Text>
            </View>

            <View style={styles.planPanel}>
              {startPlans.map((plan) => {
                const active = selectedPlan === plan;
                return (
                  <Pressable key={plan} style={[styles.planRow, active ? styles.planRowActive : null]} onPress={() => setSelectedPlan(plan)}>
                    <View style={[styles.radio, active ? styles.radioActive : null]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.planCopy}>
                      <Text style={[styles.planTitle, active ? styles.planTitleActive : null]}>{plan}</Text>
                      <Text style={styles.planText}>Layout demonstrativo para orientar a próxima etapa do Business Studio™.</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.sidePanel}>
          <Text style={styles.sideEyebrow}>Resumo do Projeto</Text>
          <Text style={styles.sideTitle}>Projeto Empresarial em construção</Text>

          <View style={styles.summaryList}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tipo</Text>
              <Text style={styles.summaryValue}>{selectedType.label}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Nicho</Text>
              <Text style={styles.summaryValue}>{selectedDna.name}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Plano</Text>
              <Text style={styles.summaryValue}>{selectedPlan}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Estimativa de tempo</Text>
              <Text style={styles.summaryValue}>{estimatedTime}</Text>
            </View>
          </View>

          <View style={styles.featureBox}>
            <Text style={styles.featureTitle}>Recursos incluídos</Text>
            {includedFeatures.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#86efac" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sideNote}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#facc15" />
            <Text style={styles.sideNoteText}>Nenhuma geração automática será executada nesta etapa.</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerTitle}>Pronto para avançar?</Text>
          <Text style={styles.footerText}>Esta etapa organiza a intenção comercial antes do Blueprint™.</Text>
        </View>
        <View style={styles.footerActions}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/projects" as never)}>
            <Text style={styles.secondaryButtonText}>Salvar rascunho</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/business-dna" as never)}>
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </Pressable>
        </View>
      </View>
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  studioHero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.20)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 30,
    minHeight: 220,
    justifyContent: "center",
  },
  heroGlow: {
    position: "absolute",
    right: -90,
    top: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(34, 211, 238, 0.14)",
  },
  kicker: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    marginTop: 12,
  },
  heroSubtitle: {
    color: "#a9b8cc",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 12,
    maxWidth: 760,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  marketplaceButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#facc15",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  marketplaceButtonText: {
    color: "#08101c",
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
    minWidth: 280,
    gap: 22,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.82)",
    padding: 22,
    gap: 18,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  typeCard: {
    flex: 1,
    minWidth: 210,
    minHeight: 154,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 18,
    gap: 14,
  },
  typeCardActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  typeCardFeatured: {
    minWidth: 260,
  },
  typeIcon: {
    width: 54,
    height: 54,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.18)",
  },
  typeIconActive: {
    backgroundColor: "rgba(7, 17, 31, 0.10)",
    borderColor: "rgba(7, 17, 31, 0.16)",
  },
  typeCopy: {
    flex: 1,
    gap: 8,
  },
  typeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  typeTitleActive: {
    color: "#07111f",
  },
  featuredBadge: {
    fontSize: 15,
  },
  typeText: {
    color: "#96a8bf",
    lineHeight: 21,
  },
  typeTextActive: {
    color: "#253044",
  },
  dnaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  dnaCard: {
    flex: 1,
    minWidth: 190,
    minHeight: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 17,
  },
  dnaCardActive: {
    backgroundColor: "rgba(250, 204, 21, 0.95)",
    borderColor: "#facc15",
  },
  dnaIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    marginBottom: 14,
  },
  dnaIconActive: {
    backgroundColor: "rgba(7, 17, 31, 0.10)",
  },
  dnaTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  dnaTitleActive: {
    color: "#07111f",
  },
  dnaDescription: {
    color: "#94a3b8",
    lineHeight: 20,
    marginTop: 8,
  },
  dnaDescriptionActive: {
    color: "#263244",
  },
  planPanel: {
    gap: 12,
  },
  planRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 16,
  },
  planRowActive: {
    borderColor: "rgba(250, 204, 21, 0.65)",
    backgroundColor: "rgba(250, 204, 21, 0.10)",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioActive: {
    borderColor: "#facc15",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#facc15",
  },
  planCopy: {
    flex: 1,
  },
  planTitle: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 16,
  },
  planTitleActive: {
    color: "#facc15",
  },
  planText: {
    color: "#8fa1b7",
    lineHeight: 20,
    marginTop: 5,
  },
  sidePanel: {
    width: "100%",
    maxWidth: 340,
    minWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    padding: 22,
    gap: 18,
  },
  sideEyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sideTitle: {
    color: "#f8fafc",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  summaryList: {
    gap: 12,
  },
  summaryItem: {
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.10)",
    padding: 14,
    gap: 5,
  },
  summaryLabel: {
    color: "#8fa1b7",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  summaryValue: {
    color: "#f8fafc",
    fontWeight: "900",
    lineHeight: 20,
  },
  featureBox: {
    borderRadius: 8,
    backgroundColor: "rgba(2, 6, 23, 0.32)",
    padding: 15,
    gap: 11,
  },
  featureTitle: {
    color: "#e2e8f0",
    fontWeight: "900",
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    color: "#a8b5c7",
    lineHeight: 19,
  },
  sideNote: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.18)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    padding: 14,
  },
  sideNoteText: {
    flex: 1,
    color: "#fde68a",
    lineHeight: 20,
    fontWeight: "800",
  },
  footerBar: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.92)",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  footerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  footerText: {
    color: "#94a3b8",
    marginTop: 5,
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#facc15",
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "900",
  },
});
