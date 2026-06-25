import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AdminPage } from "@/components/admin-web/AdminPage";
import { adminWebGetDashboard, type AdminWebDashboard } from "@/lib/admin-web";
import { useFocusEffect, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const platformCards: {
  title: string;
  description: string;
  icon: IconName;
  accent: string;
}[] = [
  {
    title: "Business DNA™",
    description: "Modelos inteligentes por nicho de negócio.",
    icon: "dna",
    accent: "#67e8f9",
  },
  {
    title: "AI Builder™",
    description: "Personalize apps, sites e sistemas com IA.",
    icon: "creation",
    accent: "#facc15",
  },
  {
    title: "Business OS™",
    description: "Gerencie projetos, clientes e operações.",
    icon: "view-dashboard-outline",
    accent: "#86efac",
  },
  {
    title: "Publishing Center™",
    description: "Prepare publicação Android, iOS e Web.",
    icon: "rocket-launch-outline",
    accent: "#c4b5fd",
  },
  {
    title: "Growth Center™",
    description: "Crie marketing, campanhas e páginas de venda.",
    icon: "chart-timeline-variant-shimmer",
    accent: "#fb7185",
  },
];

const buildOptions: { label: string; icon: IconName }[] = [
  { label: "Aplicativo", icon: "cellphone" },
  { label: "Site", icon: "web" },
  { label: "Marketplace", icon: "storefront-outline" },
  { label: "Sistema Web", icon: "monitor-dashboard" },
  { label: "Empresa Digital Completa", icon: "domain" },
];

const popularTemplates: { label: string; icon: IconName }[] = [
  { label: "Barbearia", icon: "content-cut" },
  { label: "Clínica", icon: "medical-bag" },
  { label: "Restaurante", icon: "silverware-fork-knife" },
  { label: "Hotel", icon: "bed-outline" },
  { label: "Imobiliária", icon: "home-city-outline" },
  { label: "Academia", icon: "weight-lifter" },
  { label: "Delivery", icon: "moped-outline" },
  { label: "Serviços Locais", icon: "account-hard-hat-outline" },
];

function formatNumber(value: number) {
  return Intl.NumberFormat("pt-BR", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function PlatformCard({
  title,
  description,
  icon,
  accent,
}: {
  title: string;
  description: string;
  icon: IconName;
  accent: string;
}) {
  return (
    <View style={styles.platformCard}>
      <View style={[styles.iconBadge, { borderColor: `${accent}55`, backgroundColor: `${accent}18` }]}>
        <MaterialCommunityIcons name={icon} size={25} color={accent} />
      </View>
      <Text style={styles.platformCardTitle}>{title}</Text>
      <Text style={styles.platformCardText}>{description}</Text>
    </View>
  );
}

function StatusMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusHelper}>{helper}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AdminWebDashboard | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDashboard(await adminWebGetDashboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const platformStats = useMemo(() => {
    const createdProjects = Number(dashboard?.total_empresas || 0);

    return [
      {
        label: "Projetos criados",
        value: formatNumber(createdProjects),
        helper: dashboard ? "Base real de empresas/projetos no SaaS" : "Carregando base real",
      },
      {
        label: "Templates disponíveis",
        value: "8",
        // TODO: integrar com catálogo real de templates quando o marketplace de modelos estiver persistido.
        helper: "Placeholder do catálogo inicial",
      },
      {
        label: "Agentes ativos",
        value: "30",
        // TODO: integrar com status operacional da fábrica IA quando houver monitoramento por agente.
        helper: "Catálogo atual da fábrica IA",
      },
      {
        label: "Builds em andamento",
        value: "0",
        // TODO: integrar com fila/esteira real de builds quando o Publishing Center for persistido.
        helper: "Aguardando esteira de publicação",
      },
    ];
  }, [dashboard]);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#facc15" />}
      showsVerticalScrollIndicator={false}
    >
      <AdminPage
        title="Transformamos ideias em empresas digitais."
        subtitle="Casa Mineira SaaS é a plataforma web para criar, operar e publicar aplicativos white-label com inteligência artificial."
      >
        {loading && !dashboard ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#facc15" />
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Casa Mineira SaaS 2.0</Text>
            <Text style={styles.heroTitle}>Crie sua empresa digital com IA</Text>
            <Text style={styles.heroSubtitle}>
              Escolha um modelo, personalize com inteligência artificial e transforme sua ideia em aplicativo, site, sistema ou marketplace.
            </Text>
            <View style={styles.heroActions}>
              <Pressable style={styles.primaryButton} onPress={() => router.push("/apps/new" as never)}>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#07111f" />
                <Text style={styles.primaryButtonText}>Criar novo projeto</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => router.push("/marketplace" as never)}>
                <MaterialCommunityIcons name="shape-outline" size={20} color="#e0f2fe" />
                <Text style={styles.secondaryButtonText}>Explorar modelos</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.heroPanel}>
            <Text style={styles.heroPanelEyebrow}>Fluxo premium</Text>
            <View style={styles.heroStep}>
              <Text style={styles.heroStepNumber}>01</Text>
              <Text style={styles.heroStepText}>Escolha um Business DNA por nicho</Text>
            </View>
            <View style={styles.heroStep}>
              <Text style={styles.heroStepNumber}>02</Text>
              <Text style={styles.heroStepText}>Personalize a proposta com IA</Text>
            </View>
            <View style={styles.heroStep}>
              <Text style={styles.heroStepNumber}>03</Text>
              <Text style={styles.heroStepText}>Prepare publicação e crescimento</Text>
            </View>
          </View>
        </View>

        <View style={styles.platformGrid}>
          {platformCards.map((card) => (
            <PlatformCard key={card.title} {...card} />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Ação rápida</Text>
            <Text style={styles.sectionTitle}>O que você deseja construir hoje?</Text>
          </View>
          <View style={styles.optionGrid}>
            {buildOptions.map((option) => (
              <Pressable key={option.label} style={styles.optionCard} onPress={() => router.push("/apps/new" as never)}>
                <MaterialCommunityIcons name={option.icon} size={24} color="#f8fafc" />
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Business DNA™</Text>
            <Text style={styles.sectionTitle}>Modelos prontos para começar</Text>
          </View>
          <View style={styles.templateGrid}>
            {popularTemplates.map((template) => (
              <Pressable key={template.label} style={styles.templateCard} onPress={() => router.push("/business-dna" as never)}>
                <View style={styles.templateIcon}>
                  <MaterialCommunityIcons name={template.icon} size={23} color="#67e8f9" />
                </View>
                <Text style={styles.templateTitle}>{template.label}</Text>
                <Text style={styles.templateMeta}>Modelo inicial</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Status da plataforma</Text>
            <Text style={styles.sectionTitle}>Operação SaaS em uma leitura rápida</Text>
          </View>
          <View style={styles.statusGrid}>
            {platformStats.map((item) => (
              <StatusMetric key={item.label} {...item} />
            ))}
          </View>
        </View>
      </AdminPage>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 34,
    alignItems: "center",
  },
  hero: {
    minHeight: 360,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.22)",
    backgroundColor: "rgba(8, 14, 29, 0.96)",
    overflow: "hidden",
    padding: 28,
    flexDirection: "row",
    gap: 24,
    alignItems: "stretch",
    shadowColor: "#020617",
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  heroGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(34, 211, 238, 0.14)",
  },
  heroCopy: {
    flex: 1.5,
    justifyContent: "center",
    maxWidth: 780,
  },
  heroEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 54,
    lineHeight: 59,
    fontWeight: "900",
    marginTop: 14,
  },
  heroSubtitle: {
    color: "#a8bdd8",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 16,
    maxWidth: 720,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 28,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#facc15",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#07111f",
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.16)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryButtonText: {
    color: "#e0f2fe",
    fontWeight: "900",
    fontSize: 15,
  },
  heroPanel: {
    flex: 0.72,
    minWidth: 260,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    padding: 22,
    justifyContent: "center",
    gap: 16,
  },
  heroPanelEyebrow: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroStep: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(2, 6, 23, 0.38)",
    padding: 14,
  },
  heroStepNumber: {
    color: "#facc15",
    fontSize: 13,
    fontWeight: "900",
  },
  heroStepText: {
    flex: 1,
    color: "#e5eefb",
    fontWeight: "800",
    lineHeight: 20,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  platformCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(10, 17, 31, 0.88)",
    padding: 20,
    minHeight: 188,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  platformCardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 16,
  },
  platformCardText: {
    color: "#9fb2cd",
    lineHeight: 22,
    marginTop: 8,
  },
  section: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(8, 14, 29, 0.82)",
    padding: 22,
    gap: 18,
  },
  sectionHeader: {
    gap: 8,
  },
  sectionEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 190,
    minHeight: 84,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  templateCard: {
    flex: 1,
    minWidth: 170,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.74)",
    padding: 18,
    minHeight: 138,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  templateTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 16,
  },
  templateMeta: {
    color: "#8da2c0",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 8,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  statusCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 24,
    backgroundColor: "rgba(2, 6, 23, 0.34)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    padding: 18,
  },
  statusValue: {
    color: "#facc15",
    fontSize: 32,
    fontWeight: "900",
  },
  statusLabel: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 8,
  },
  statusHelper: {
    color: "#8da2c0",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
});
