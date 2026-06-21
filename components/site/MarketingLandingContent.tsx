import { SiteButton } from "@/components/site/SiteButton";
import { SiteCta } from "@/components/site/SiteCta";
import { SiteFaq } from "@/components/site/SiteFaq";
import { SiteFeatureCard } from "@/components/site/SiteFeatureCard";
import { SiteHero } from "@/components/site/SiteHero";
import { SitePricingCard } from "@/components/site/SitePricingCard";
import { SiteSection } from "@/components/site/SiteSection";
import { SiteShowcase } from "@/components/site/SiteShowcase";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";
import { SAAS_SITE_TEXT } from "@/lib/saas-site-content";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export function MarketingLandingContent({
  plans,
}: {
  plans: SaasPlanoComercial[];
}) {
  const router = useRouter();
  const featuredPlan = plans.find((plan) => plan.slug === "pro") || plans[1] || plans[0] || null;

  return (
    <>
      <SiteHero
        badge={SAAS_SITE_TEXT.hero.badge}
        title={SAAS_SITE_TEXT.hero.title}
        subtitle={SAAS_SITE_TEXT.hero.subtitle}
        primaryLabel={SAAS_SITE_TEXT.hero.primaryCta}
        secondaryLabel={SAAS_SITE_TEXT.hero.secondaryCta}
        onPrimary={() => router.push("/teste-gratis")}
        onSecondary={() => router.push("/demo")}
      />

      <View style={styles.proofStrip}>
        {SAAS_SITE_TEXT.proof.map((item) => (
          <View key={item} style={styles.proofCard}>
            <Text style={styles.proofText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.signalBand}>
        <View style={styles.signalCardPrimary}>
          <Text style={styles.signalLabel}>Escolha mais segura</Text>
          <Text style={styles.signalTitle}>Comece estruturando a operação e evolua com a empresa.</Text>
          <Text style={styles.signalBody}>A plataforma acompanha desde o caos inicial até uma operação madura com mais marca, mais gestão e mais escala.</Text>
        </View>
        <View style={styles.signalCard}>
          <Text style={styles.signalValue}>Starter</Text>
          <Text style={styles.signalBody}>Para sair do improviso e criar base operacional.</Text>
        </View>
        <View style={[styles.signalCard, styles.signalCardRecommended]}>
          <Text style={styles.signalValue}>Pro</Text>
          <Text style={styles.signalBody}>Para profissionalizar a gestão e crescer com equilíbrio.</Text>
        </View>
        <View style={styles.signalCard}>
          <Text style={styles.signalValue}>Enterprise</Text>
          <Text style={styles.signalBody}>Para marca própria e operação premium com mais sofisticação.</Text>
        </View>
      </View>

      <View style={styles.outcomeBoard}>
        <View style={styles.outcomeMain}>
          <Text style={styles.outcomeEyebrow}>Valor percebido rapidamente</Text>
          <Text style={styles.outcomeTitle}>Em poucos dias sua empresa já percebe mais ordem, mais velocidade e mais leitura de gestão.</Text>
          <Text style={styles.outcomeBody}>
            A plataforma entra para organizar a rotina, acelerar resposta ao cliente e dar visibilidade para a operação crescer sem perder controle.
          </Text>
          <View style={styles.outcomeActions}>
            <SiteButton label="Iniciar teste grátis" onPress={() => router.push("/teste-gratis")} />
            <SiteButton label="Ver planos" tone="secondary" onPress={() => router.push("/pricing")} />
          </View>
        </View>

        <View style={styles.outcomeStats}>
          <View style={styles.outcomeStatCard}>
            <Text style={styles.outcomeStatValue}>+ velocidade</Text>
            <Text style={styles.outcomeStatLabel}>Atendimento com histórico, status e fluxo mais organizado.</Text>
          </View>
          <View style={styles.outcomeStatCard}>
            <Text style={styles.outcomeStatValue}>+ controle</Text>
            <Text style={styles.outcomeStatLabel}>Equipe, pedidos, carteira e financeiro no mesmo contexto.</Text>
          </View>
          <View style={styles.outcomeStatCardFeatured}>
            <Text style={styles.outcomeStatValueFeatured}>{featuredPlan ? "Plano recomendado" : "Escala previsível"}</Text>
            <Text style={styles.outcomeStatLabelFeatured}>
              {featuredPlan
                ? "A maioria das empresas cresce com mais equilíbrio no plano Pro."
                : "Evolua de operação estruturada para marca própria com mais segurança."}
            </Text>
          </View>
        </View>
      </View>

      <SiteSection
        eyebrow="Decisão rápida"
        title="Se você precisa organizar a empresa sem travar a operação, este é o caminho."
        description="Antes de aprofundar em recurso por recurso, entenda os três motivos que mais aceleram a decisão de compra."
      >
        <View style={styles.decisionGrid}>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Atendimento</Text>
            <Text style={styles.decisionTitle}>Responda com mais padrão e menos improviso.</Text>
            <Text style={styles.decisionBody}>Pedidos, propostas e acompanhamento passam a seguir um fluxo que transmite mais confiança para o cliente.</Text>
          </View>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Gestão</Text>
            <Text style={styles.decisionTitle}>Veja a operação inteira sem depender de planilhas soltas.</Text>
            <Text style={styles.decisionBody}>Equipe, carteira, volume e financeiro ficam visíveis no mesmo ambiente para facilitar decisão e prioridade.</Text>
          </View>
          <View style={[styles.decisionCard, styles.decisionCardAccent]}>
            <Text style={styles.decisionValue}>Escala</Text>
            <Text style={styles.decisionTitle}>Comece organizado e evolua para uma camada mais premium.</Text>
            <Text style={styles.decisionBody}>A plataforma acompanha desde a estruturação inicial até a expansão com planos, trial e marca própria.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Planos"
        title="Planos para estruturar, profissionalizar e escalar sua operação."
        description="Escolha o plano que melhor acompanha o momento da sua empresa e avance com clareza para o próximo estágio."
      >
        <View style={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <SitePricingCard
              key={plan.id}
              plan={plan}
              highlighted={plan.slug === "pro" || index === 1}
              onPress={() => router.push("/teste-gratis")}
            />
          ))}
        </View>
        <View style={styles.centerAction}>
          <SiteButton label="Ver página de planos" tone="secondary" onPress={() => router.push("/pricing")} />
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Por que funciona"
        title="Tudo o que sua empresa precisa para sair do improviso e operar com padrão."
        description="Do primeiro atendimento ao financeiro, a plataforma organiza a rotina para sua empresa vender melhor, responder mais rápido e crescer com mais controle."
      >
        <View style={styles.featureGrid}>
          {SAAS_SITE_TEXT.features.map((item) => (
            <SiteFeatureCard key={item.title} icon={item.icon as any} title={item.title} description={item.description} />
          ))}
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Veja em ação"
        title="Mais clareza operacional, mais velocidade comercial e mais leitura de gestão."
        description="Visualize como o produto conecta atendimento, pedidos, equipe e financeiro para reduzir ruído e aumentar a capacidade de execução."
      >
        <SiteShowcase />
      </SiteSection>

      <SiteSection
        eyebrow="Resultados"
        title="Benefícios que o cliente percebe e a gestão sente no dia a dia."
        description="A plataforma melhora a experiência do cliente, fortalece o processo interno e prepara sua empresa para crescer com menos atrito."
      >
        <View style={styles.benefitGrid}>
          {SAAS_SITE_TEXT.benefits.map((item) => (
            <View key={item.title} style={styles.benefitCard}>
              <Text style={styles.benefitTitle}>{item.title}</Text>
              <Text style={styles.benefitBody}>{item.description}</Text>
            </View>
          ))}
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Perguntas frequentes"
        title="O que você precisa saber antes de começar."
        description="Veja respostas objetivas sobre teste grátis, marca própria, múltiplas empresas e ativação inicial da operação."
      >
        <SiteFaq items={SAAS_SITE_TEXT.faq} />
      </SiteSection>

      <SiteCta
        title="Pronto para ver sua empresa operando com mais controle?"
        body="Ative o teste grátis, configure a empresa e valide a plataforma com sua rotina real antes de escolher o plano definitivo."
        primaryLabel="Começar teste grátis"
        secondaryLabel="Ver a plataforma"
        onPrimary={() => router.push("/teste-gratis")}
        onSecondary={() => router.push("/demo")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  proofStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  proofCard: {
    minWidth: 260,
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.74)",
    padding: 18,
  },
  proofText: {
    color: "#dbe7f4",
    lineHeight: 22,
    fontWeight: "700",
  },
  signalBand: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  signalCardPrimary: {
    minWidth: 320,
    flex: 1.4,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.28)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    padding: 22,
    gap: 10,
  },
  signalCard: {
    minWidth: 220,
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.76)",
    padding: 20,
    gap: 10,
  },
  signalCardRecommended: {
    borderColor: "rgba(103, 232, 249, 0.28)",
    backgroundColor: "rgba(103, 232, 249, 0.08)",
  },
  signalLabel: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  signalTitle: {
    color: "#f8fafc",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },
  signalValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  signalBody: {
    color: "#96aac7",
    lineHeight: 22,
  },
  outcomeBoard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(8, 13, 24, 0.88)",
    padding: 26,
    flexDirection: "row",
    gap: 18,
  },
  outcomeMain: {
    flex: 1.2,
    gap: 14,
    maxWidth: 700,
  },
  outcomeEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  outcomeTitle: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
  },
  outcomeBody: {
    color: "#9db1ca",
    lineHeight: 25,
    fontSize: 15,
  },
  outcomeActions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4,
  },
  outcomeStats: {
    flex: 1,
    minWidth: 320,
    gap: 12,
  },
  outcomeStatCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    padding: 16,
    gap: 6,
  },
  outcomeStatCardFeatured: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.26)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    padding: 16,
    gap: 6,
  },
  outcomeStatValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  outcomeStatValueFeatured: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
  },
  outcomeStatLabel: {
    color: "#96aac7",
    lineHeight: 22,
  },
  outcomeStatLabelFeatured: {
    color: "#f8fafc",
    lineHeight: 22,
  },
  decisionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  decisionCard: {
    minWidth: 280,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.78)",
    padding: 24,
    gap: 12,
  },
  decisionCardAccent: {
    borderColor: "rgba(250, 204, 21, 0.26)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  decisionValue: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  decisionTitle: {
    color: "#f8fafc",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
  },
  decisionBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  benefitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  benefitCard: {
    minWidth: 280,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.78)",
    padding: 24,
    gap: 12,
  },
  benefitTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  benefitBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
  pricingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  centerAction: {
    alignItems: "center",
  },
});
