import { SiteCta } from "@/components/site/SiteCta";
import { SiteButton } from "@/components/site/SiteButton";
import { SitePricingCard } from "@/components/site/SitePricingCard";
import { SiteSection } from "@/components/site/SiteSection";
import { SiteShell } from "@/components/site/SiteShell";
import { getPublicSaasPlans } from "@/lib/saas-growth";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SaasPlanoComercial[]>([]);

  useEffect(() => {
    getPublicSaasPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  return (
    <SiteShell>
      <View style={styles.heroBoard}>
        <View style={styles.heroBackdropA} />
        <View style={styles.heroBackdropB} />

        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Pricing estratégico</Text>
          <Text style={styles.heroTitle}>Escolha o plano com a clareza de quem está comprando software sério.</Text>
          <Text style={styles.heroBody}>
            Escolha o estágio que melhor acompanha sua empresa: estruturar a base, ganhar governança para crescer ou posicionar a operação com marca própria e camada premium.
          </Text>

          <View style={styles.heroProofGrid}>
            <View style={styles.heroProofCard}>
              <Text style={styles.heroProofValue}>3</Text>
              <Text style={styles.heroProofLabel}>estágios claros de maturidade operacional</Text>
            </View>
            <View style={styles.heroProofCard}>
              <Text style={styles.heroProofValue}>1</Text>
              <Text style={styles.heroProofLabel}>plano recomendado para escalar com governança</Text>
            </View>
            <View style={styles.heroProofCard}>
              <Text style={styles.heroProofValue}>14 dias</Text>
              <Text style={styles.heroProofLabel}>para validar o produto no seu contexto real</Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <SiteButton label="Começar teste grátis" onPress={() => router.push("/teste-gratis")} />
            <SiteButton label="Ver demonstração" tone="secondary" onPress={() => router.push("/demo")} />
          </View>
        </View>

        <View style={styles.heroVisual}>
          <View style={styles.visualPanel}>
            <Text style={styles.visualTitle}>Como decidir o plano certo</Text>

            <View style={styles.visualRow}>
              <View style={styles.visualStageActive}>
                <Text style={styles.visualStageLabel}>Starter</Text>
                <Text style={styles.visualStageText}>Para estruturar a base e sair do caos operacional.</Text>
              </View>
              <View style={styles.visualStageRecommended}>
                <Text style={styles.visualStageLabel}>Pro</Text>
                <Text style={styles.visualStageText}>Melhor ponto de equilíbrio entre operação, controle e crescimento.</Text>
              </View>
              <View style={styles.visualStage}>
                <Text style={styles.visualStageLabel}>Enterprise</Text>
                <Text style={styles.visualStageText}>Quando marca própria e posicionamento premium viram prioridade.</Text>
              </View>
            </View>

            <View style={styles.visualChecklist}>
              <Text style={styles.visualChecklistTitle}>O que um decisor precisa enxergar</Text>
              <Text style={styles.visualChecklistItem}>Clareza de limite, capacidade e recursos por estágio</Text>
              <Text style={styles.visualChecklistItem}>Plano recomendado destacado para acelerar decisão</Text>
              <Text style={styles.visualChecklistItem}>White-label e governança apresentados como evolução natural</Text>
            </View>
          </View>
        </View>
      </View>

      <SiteSection
        eyebrow="Planos comerciais"
        title="Compare planos por estágio de operação, limite e capacidade de marca."
        description="Compare o que cada plano entrega e escolha a opção que melhor equilibra capacidade, visibilidade e diferenciação para o seu momento."
      >
        <View style={styles.grid}>
          {plans.map((plan, index) => (
            <SitePricingCard
              key={plan.id}
              plan={plan}
              highlighted={plan.slug === "pro" || index === 1}
              onPress={() => router.push("/teste-gratis")}
            />
          ))}
        </View>

        <View style={styles.compareRow}>
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>Ideal para quem está estruturando a operação</Text>
            <Text style={styles.compareBody}>Entre com base funcional, organize a rotina e substitua o improviso por um processo mais controlado.</Text>
          </View>
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>Ideal para quem quer profissionalizar e escalar</Text>
            <Text style={styles.compareBody}>Ganhe mais visibilidade, governança e capacidade para crescer com uma operação mais madura.</Text>
          </View>
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>Ideal para marca própria e operação madura</Text>
            <Text style={styles.compareBody}>Eleve o posicionamento da empresa com recursos premium, experiência de marca e mais sofisticação operacional.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Comparação executiva"
        title="O que muda de verdade quando a empresa sobe de estágio."
        description="Compare os ganhos de cada etapa e escolha o plano que melhor sustenta a maturidade da sua operação."
      >
        <View style={styles.matrix}>
          <View style={styles.matrixHeader}>
            <Text style={[styles.matrixCell, styles.matrixHeaderCell, styles.matrixHeaderLead]}>Capacidade</Text>
            <Text style={[styles.matrixCell, styles.matrixHeaderCell]}>Starter</Text>
            <Text style={[styles.matrixCell, styles.matrixHeaderCell, styles.matrixHeaderFeatured]}>Pro</Text>
            <Text style={[styles.matrixCell, styles.matrixHeaderCell]}>Enterprise</Text>
          </View>

          <View style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixLead]}>Momento ideal</Text>
            <Text style={styles.matrixCell}>Estruturar base</Text>
            <Text style={[styles.matrixCell, styles.matrixFeatured]}>Profissionalizar e escalar</Text>
            <Text style={styles.matrixCell}>Posicionar com marca própria</Text>
          </View>
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixLead]}>Visibilidade de gestão</Text>
            <Text style={styles.matrixCell}>Essencial</Text>
            <Text style={[styles.matrixCell, styles.matrixFeatured]}>Elevada</Text>
            <Text style={styles.matrixCell}>Máxima</Text>
          </View>
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixLead]}>Diferenciação comercial</Text>
            <Text style={styles.matrixCell}>Entrada organizada</Text>
            <Text style={[styles.matrixCell, styles.matrixFeatured]}>Operação mais madura</Text>
            <Text style={styles.matrixCell}>Camada premium de marca</Text>
          </View>
          <View style={styles.matrixRow}>
            <Text style={[styles.matrixCell, styles.matrixLead]}>White-label</Text>
            <Text style={styles.matrixCell}>Opcional/limitado</Text>
            <Text style={[styles.matrixCell, styles.matrixFeatured]}>Planejado para evolução</Text>
            <Text style={styles.matrixCell}>Prioridade estratégica</Text>
          </View>
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Decisão"
        title="Como escolher sem travar a compra."
        description="Use esta leitura para avançar com segurança no plano que melhor acompanha o momento e a ambição de crescimento da sua empresa."
      >
        <View style={styles.decisionGrid}>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Starter</Text>
            <Text style={styles.decisionTitle}>Entre com base funcional e organize a operação.</Text>
            <Text style={styles.decisionBody}>Ideal para validar processo, estruturar atendimento e parar de operar de forma dispersa.</Text>
          </View>
          <View style={[styles.decisionCard, styles.decisionCardRecommended]}>
            <Text style={styles.decisionValue}>Pro</Text>
            <Text style={styles.decisionTitle}>Escolha recomendada para profissionalizar e crescer.</Text>
            <Text style={styles.decisionBody}>É o melhor ponto de equilíbrio para empresas que querem mais governança, mais leitura e mais força comercial.</Text>
          </View>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Enterprise</Text>
            <Text style={styles.decisionTitle}>Escale com camada premium e marca própria forte.</Text>
            <Text style={styles.decisionBody}>Quando a prioridade já é posicionamento, diferenciação e operação madura com mais sofisticação.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteCta
        title="Escolha o plano e avance para o onboarding comercial."
        body="Se você já identificou o plano ideal, avance para o teste grátis. Se quiser ver mais contexto antes da decisão, reveja a demonstração."
        primaryLabel="Começar teste grátis"
        secondaryLabel="Ver demonstração"
        onPrimary={() => router.push("/teste-gratis")}
        onSecondary={() => router.push("/demo")}
      />
    </SiteShell>
  );
}

const styles = StyleSheet.create({
  heroBoard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(6, 10, 20, 0.92)",
    padding: 28,
    flexDirection: "row",
    gap: 24,
  },
  heroBackdropA: {
    position: "absolute",
    right: -80,
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  heroBackdropB: {
    position: "absolute",
    left: -50,
    bottom: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  heroCopy: {
    flex: 1.1,
    maxWidth: 560,
    gap: 18,
  },
  heroEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
  },
  heroBody: {
    color: "#9db1ca",
    fontSize: 16,
    lineHeight: 26,
  },
  heroProofGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroProofCard: {
    minWidth: 150,
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    padding: 14,
    gap: 6,
  },
  heroProofValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  heroProofLabel: {
    color: "#9db1ca",
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "700",
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroVisual: {
    flex: 1,
    minWidth: 420,
  },
  visualPanel: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(10, 16, 30, 0.86)",
    padding: 22,
    gap: 18,
  },
  visualTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  visualRow: {
    gap: 12,
  },
  visualStage: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    padding: 16,
    gap: 6,
  },
  visualStageActive: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.22)",
    backgroundColor: "rgba(103, 232, 249, 0.08)",
    padding: 16,
    gap: 6,
  },
  visualStageRecommended: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.3)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    padding: 16,
    gap: 6,
  },
  visualStageLabel: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  visualStageText: {
    color: "#9db1ca",
    lineHeight: 22,
  },
  visualChecklist: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.74)",
    padding: 16,
    gap: 10,
  },
  visualChecklistTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  visualChecklistItem: {
    color: "#dbe7f4",
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  compareRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  compareCard: {
    minWidth: 260,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.78)",
    padding: 22,
    gap: 12,
  },
  compareTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  compareBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
  matrix: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    overflow: "hidden",
  },
  matrixHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.86)",
  },
  matrixRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.12)",
  },
  matrixCell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#dbe7f4",
    lineHeight: 22,
  },
  matrixHeaderCell: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  matrixHeaderLead: {
    flex: 1.2,
  },
  matrixHeaderFeatured: {
    color: "#facc15",
  },
  matrixLead: {
    flex: 1.2,
    color: "#f8fafc",
    fontWeight: "800",
  },
  matrixFeatured: {
    color: "#facc15",
    fontWeight: "800",
  },
  decisionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  decisionCard: {
    minWidth: 280,
    flex: 1,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    padding: 24,
    gap: 12,
  },
  decisionCardRecommended: {
    borderColor: "rgba(250, 204, 21, 0.28)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  decisionValue: {
    color: "#67e8f9",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  decisionTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 28,
  },
  decisionBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
});
