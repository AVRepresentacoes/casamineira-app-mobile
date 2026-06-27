import { PublicHeader } from "@/components/layout/PublicHeader";
import { getActiveRole, setActiveRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getConfiguredTenantSlug, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { DimensionValue } from "react-native";

const VALUE_PROPS = [
  {
    title: "Business DNA™",
    description: "Modelos inteligentes por nicho com fluxos, módulos e operação prontos para acelerar o projeto.",
    icon: "git-branch-outline",
  },
  {
    title: "AI Builder™",
    description: "Personalização assistida por IA para adaptar templates sem começar tudo do zero.",
    icon: "sparkles-outline",
  },
  {
    title: "Business Studio™",
    description: "Ambiente guiado para transformar uma ideia em aplicativo, site, sistema ou marketplace.",
    icon: "grid-outline",
  },
  {
    title: "Publishing Center™",
    description: "Preparação organizada para publicação Web, Android e iOS com revisão humana.",
    icon: "rocket-outline",
  },
  {
    title: "Growth Center™",
    description: "Marketing, landing pages, SEO e campanhas para levar a empresa digital ao mercado.",
    icon: "trending-up-outline",
  },
];

const CREATION_TYPES = [
  { title: "Aplicativos", icon: "phone-portrait-outline" },
  { title: "Sites", icon: "globe-outline" },
  { title: "Sistemas Web", icon: "desktop-outline" },
  { title: "Marketplaces", icon: "storefront-outline" },
  { title: "Empresas Digitais Completas", icon: "business-outline" },
];

const NICHES = ["Clínica", "Restaurante", "Hotel", "Barbearia", "Imobiliária", "Academia", "Delivery", "Serviços Locais"];

const STEPS = [
  "Escolha um Business DNA™",
  "Personalize com IA",
  "Aprove o Blueprint™",
  "Publique sua empresa digital",
];

const PIPELINE_STEPS = [
  { title: "Ideia", icon: "bulb-outline" },
  { title: "Business DNA™", icon: "git-branch-outline" },
  { title: "Template", icon: "albums-outline" },
  { title: "IA", icon: "sparkles-outline" },
  { title: "Blueprint", icon: "document-text-outline" },
  { title: "Deploy", icon: "rocket-outline" },
  { title: "Empresa pronta", icon: "business-outline" },
];

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (isWeb) {
      return;
    }

    const resolverRota = async () => {
      try {
        if (getConfiguredTenantSlug() === "hospedagens-caminhos-da-fe") {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            setRoute("/hospedagens");
            return;
          }

          let tenantId: string | null = null;
          try {
            tenantId = await ensureCurrentUserTenantContext();
          } catch {
            try {
              tenantId = await getCurrentTenantId();
            } catch {
              tenantId = null;
            }
          }

          let fornecedorQuery = supabase
            .from("profissionais")
            .select("fornecedor_ativo")
            .eq("user_id", session.user.id);

          if (tenantId) {
            fornecedorQuery = fornecedorQuery.eq("tenant_id", tenantId);
          }

          const { data: fornecedorData, error: fornecedorError } = await fornecedorQuery.maybeSingle();
          if (fornecedorError) {
            console.log("HOSPEDAGENS FORNECEDOR ROUTING ERROR:", fornecedorError.message);
          }

          if (Boolean((fornecedorData as { fornecedor_ativo?: boolean } | null)?.fornecedor_ativo)) {
            await setActiveRole("fornecedor");
            setRoute("/hospedagens/pousada");
            return;
          }

          await setActiveRole("cliente");
          setRoute("/hospedagens");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setRoute("/(auth)/login");
          return;
        }

        const { data: fornecedorData, error: fornecedorError } = await supabase
          .from("profissionais")
          .select("fornecedor_ativo")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (fornecedorError) {
          console.log("FORNECEDOR CHECK ROUTING ERROR:", fornecedorError);
        }

        const isFornecedor = Boolean(
          (fornecedorData as { fornecedor_ativo?: boolean } | null)?.fornecedor_ativo
        );
        if (isFornecedor) {
          setRoute("/(fornecedor)");
          return;
        }

        const activeRole = await getActiveRole();
        if (activeRole === "fornecedor") {
          setRoute("/(fornecedor)");
          return;
        }
        if (activeRole === "profissional") {
          setRoute("/(profissional)");
          return;
        }

        setRoute("/(tabs)/index");
      } catch (error) {
        console.log("ERRO ROUTING INICIAL:", error);
        setRoute("/(auth)/login");
      }
    };

    void resolverRota();
  }, [isWeb]);

  if (isWeb) {
    return <SaasLandingPage />;
  }

  if (!route) {
    return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  }

  return <Redirect href={route} />;
}

function SaasLandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isTablet = width >= 760 && width < 1080;
  const cardWidth = useMemo<DimensionValue>(() => {
    if (isCompact) {
      return "100%";
    }
    if (isTablet) {
      return "48%";
    }
    return "31.5%";
  }, [isCompact, isTablet]);

  const navigate = (href: string) => {
    router.push(href as never);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#07111f", "#0f172a", "#111827"]} style={styles.gradientLayer}>
        <View style={styles.shell}>
          <PublicHeader />

          <View style={[styles.hero, isCompact ? styles.heroCompact : null]}>
            <View style={styles.heroCopy}>
              <View style={styles.eyebrowPill}>
                <Ionicons name="sparkles-outline" size={16} color="#facc15" />
                <Text style={styles.eyebrowText}>Fábrica de Empresas Digitais com IA</Text>
              </View>
              <Text style={[styles.heroTitle, isCompact ? styles.heroTitleCompact : null]}>
                Transforme qualquer ideia{"\n"}em uma empresa digital completa.
              </Text>
              <Text style={styles.heroSubtitle}>
                Crie aplicativos, sistemas web, marketplaces e painéis administrativos utilizando Business DNA™, IA e publicação automatizada.
              </Text>
              <View style={[styles.heroActions, isCompact ? styles.stack : null]}>
                <LandingButton label="Começar agora" icon="arrow-forward" onPress={() => navigate("/register")} full={isCompact} />
                <LandingButton label="Ver Marketplace" icon="storefront-outline" tone="secondary" onPress={() => navigate("/marketplace")} full={isCompact} />
                <LandingButton label="Explorar Business DNA" icon="git-branch-outline" tone="ghost" onPress={() => navigate("/business-dna")} full={isCompact} />
              </View>
            </View>

            <PipelinePanel compact={isCompact} />
          </View>

          <Section title="Plataforma para criar, operar e publicar" subtitle="Cinco centros de produto conectam estratégia, IA, templates, publicação e crescimento.">
            <View style={styles.grid}>
              {VALUE_PROPS.map((item) => (
                <FeatureCard key={item.title} item={item} width={cardWidth} />
              ))}
            </View>
          </Section>

          <Section title="O que você pode criar" subtitle="Da primeira página de venda ao ecossistema completo de uma empresa digital.">
            <View style={styles.grid}>
              {CREATION_TYPES.map((item) => (
                <View key={item.title} style={[styles.creationCard, { width: cardWidth }]}>
                  <Ionicons name={item.icon as never} size={26} color="#67e8f9" />
                  <Text style={styles.creationTitle}>{item.title}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Modelos prontos por nicho" subtitle="Comece com um Business DNA™ especializado e evolua com personalização assistida.">
            <View style={styles.nicheGrid}>
              {NICHES.map((niche) => (
                <View key={niche} style={styles.nichePill}>
                  <Text style={styles.nicheText}>{niche}</Text>
                </View>
              ))}
            </View>
            <View style={styles.sectionActions}>
              <LandingButton label="Explorar Business DNA" icon="git-branch-outline" tone="secondary" onPress={() => navigate("/business-dna")} full={isCompact} />
            </View>
          </Section>

          <Section title="Como funciona" subtitle="Um fluxo guiado para transformar intenção em produto digital revisável e publicável.">
            <View style={styles.stepsGrid}>
              {STEPS.map((step, index) => (
                <View key={step} style={styles.stepCard}>
                  <Text style={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</Text>
                  <Text style={styles.stepTitle}>{step}</Text>
                </View>
              ))}
            </View>
          </Section>

          <View style={styles.trustBand}>
            <Text style={styles.trustText}>
              Uma plataforma criada para empreendedores, agências e empresas que querem lançar produtos digitais com velocidade, qualidade e baixo custo.
            </Text>
          </View>

          <LinearGradient colors={["rgba(250, 204, 21, 0.18)", "rgba(103, 232, 249, 0.14)"]} style={styles.finalCta}>
            <Text style={styles.finalTitle}>Pronto para criar sua próxima empresa digital?</Text>
            <View style={[styles.heroActions, isCompact ? styles.stack : null]}>
              <LandingButton label="Criar conta" icon="person-add-outline" onPress={() => navigate("/register")} full={isCompact} />
              <LandingButton label="Fazer login" icon="log-in-outline" tone="secondary" onPress={() => navigate("/login")} full={isCompact} />
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

function LandingButton({
  label,
  icon,
  onPress,
  tone = "primary",
  compact = false,
  full = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: "primary" | "secondary" | "ghost";
  compact?: boolean;
  full?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const hovered = Boolean((state as any).hovered);
        return [
          styles.button,
          tone === "primary" ? styles.buttonPrimary : null,
          tone === "secondary" ? styles.buttonSecondary : null,
          tone === "ghost" ? styles.buttonGhost : null,
          hovered ? styles.buttonHover : null,
          state.pressed ? styles.buttonPressed : null,
          compact ? styles.buttonCompact : null,
          full ? styles.buttonFull : null,
        ];
      }}
    >
      <Ionicons name={icon} size={compact ? 15 : 17} color={tone === "primary" ? "#08101c" : "#f8fafc"} />
      <Text style={[styles.buttonText, tone === "primary" ? styles.buttonTextPrimary : null]}>{label}</Text>
    </Pressable>
  );
}

function PipelinePanel({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.pipelinePanel, compact ? styles.pipelinePanelCompact : null]}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>AI Company Pipeline</Text>
        <Text style={styles.panelStatus}>Da ideia ao negócio publicado</Text>
      </View>
      <View style={styles.pipelineRows}>
        {PIPELINE_STEPS.map((item, index) => (
          <View key={item.title} style={styles.pipelineItemWrap}>
            <Pressable
              style={(state) => [
                styles.pipelineItem,
                Boolean((state as any).hovered) ? styles.pipelineItemHover : null,
              ]}
            >
              <View style={styles.pipelineIcon}>
                <Ionicons name={item.icon as never} size={18} color={index === PIPELINE_STEPS.length - 1 ? "#08101c" : "#67e8f9"} />
              </View>
              <Text style={styles.pipelineText}>{item.title}</Text>
            </Pressable>
            {index < PIPELINE_STEPS.length - 1 ? (
              <View style={styles.pipelineArrow}>
                <Ionicons name="arrow-down" size={16} color="#64748b" />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function FeatureCard({
  item,
  width,
}: {
  item: {
    title: string;
    description: string;
    icon: string;
  };
  width: DimensionValue;
}) {
  return (
    <Pressable
      style={(state) => [
        styles.featureCard,
        { width },
        Boolean((state as any).hovered) ? styles.elevatedCard : null,
      ]}
    >
      <View style={styles.featureIcon}>
        <Ionicons name={item.icon as never} size={24} color="#facc15" />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDescription}>{item.description}</Text>
    </Pressable>
  );
}

const webMotion = {
  transitionProperty: "transform, box-shadow, background-color, border-color, opacity",
  transitionDuration: "180ms",
  transitionTimingFunction: "ease",
} as any;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  pageContent: {
    minHeight: "100%",
  },
  gradientLayer: {
    minHeight: "100%",
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  shell: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    gap: 34,
  },
  hero: {
    minHeight: 700,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(2, 6, 23, 0.42)",
    padding: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 28,
    overflow: "hidden",
  },
  heroCompact: {
    minHeight: 0,
    padding: 24,
    flexDirection: "column",
    alignItems: "stretch",
  },
  heroCopy: {
    flex: 1,
    maxWidth: 720,
    gap: 24,
  },
  eyebrowPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.24)",
  },
  eyebrowText: {
    color: "#fde68a",
    fontSize: 13,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 64,
    lineHeight: 70,
    fontWeight: "900",
    maxWidth: 820,
  },
  heroTitleCompact: {
    fontSize: 38,
    lineHeight: 45,
  },
  heroSubtitle: {
    color: "#cbd5e1",
    fontSize: 19,
    lineHeight: 31,
    maxWidth: 760,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  stack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  pipelinePanel: {
    width: 390,
    maxWidth: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.24)",
    backgroundColor: "rgba(15, 23, 42, 0.84)",
    padding: 22,
    gap: 18,
    overflow: "hidden",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.22,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 },
  },
  pipelinePanelCompact: {
    width: "100%",
  },
  glowOne: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(103, 232, 249, 0.13)",
  },
  glowTwo: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  panelHeader: {
    gap: 6,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  panelStatus: {
    color: "#67e8f9",
    fontSize: 13,
    fontWeight: "800",
  },
  pipelineRows: {
    gap: 5,
  },
  pipelineItemWrap: {
    gap: 4,
  },
  pipelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    ...webMotion,
  },
  pipelineItemHover: {
    transform: [{ translateX: 4 }],
    borderColor: "rgba(103, 232, 249, 0.32)",
    backgroundColor: "rgba(103, 232, 249, 0.1)",
  },
  pipelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(103, 232, 249, 0.12)",
  },
  pipelineText: {
    color: "#e2e8f0",
    fontWeight: "900",
  },
  pipelineArrow: {
    alignItems: "center",
    marginVertical: -2,
  },
  button: {
    minHeight: 48,
    minWidth: 160,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    ...webMotion,
  },
  buttonHover: {
    transform: [{ translateY: -2 }, { scale: 1.01 }],
    shadowColor: "#67e8f9",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  buttonPressed: {
    transform: [{ translateY: 0 }, { scale: 0.99 }],
  },
  buttonCompact: {
    minWidth: 0,
    flex: 1,
  },
  buttonFull: {
    width: "100%",
  },
  buttonPrimary: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderColor: "rgba(226, 232, 240, 0.18)",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: "rgba(226, 232, 240, 0.14)",
  },
  buttonText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  buttonTextPrimary: {
    color: "#08101c",
  },
  section: {
    paddingVertical: 28,
    gap: 22,
  },
  sectionHeader: {
    gap: 8,
    maxWidth: 760,
  },
  sectionActions: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 16,
    lineHeight: 25,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureCard: {
    minHeight: 214,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    padding: 20,
    gap: 14,
    ...webMotion,
  },
  elevatedCard: {
    transform: [{ translateY: -5 }],
    borderColor: "rgba(103, 232, 249, 0.28)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.18)",
  },
  featureTitle: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "900",
  },
  featureDescription: {
    color: "#a8b4c7",
    fontSize: 14,
    lineHeight: 22,
  },
  creationCard: {
    minHeight: 118,
    borderRadius: 8,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.16)",
    backgroundColor: "rgba(8, 47, 73, 0.28)",
  },
  creationTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  nicheGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nichePill: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.055)",
  },
  nicheText: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "900",
  },
  stepsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  stepCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 8,
    padding: 18,
    gap: 14,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
  },
  stepNumber: {
    color: "#67e8f9",
    fontSize: 13,
    fontWeight: "900",
  },
  stepTitle: {
    color: "#f8fafc",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "900",
  },
  trustBand: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    padding: 24,
  },
  trustText: {
    color: "#e2e8f0",
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "800",
    maxWidth: 940,
  },
  finalCta: {
    borderRadius: 8,
    padding: 28,
    marginBottom: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
  },
  finalTitle: {
    color: "#f8fafc",
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "900",
    maxWidth: 760,
  },
});
