import { SiteCta } from "@/components/site/SiteCta";
import { SiteDecisionBoard } from "@/components/site/SiteDecisionBoard";
import { SiteFeatureCard } from "@/components/site/SiteFeatureCard";
import { SiteSection } from "@/components/site/SiteSection";
import { SiteShell } from "@/components/site/SiteShell";
import { SiteShowcase } from "@/components/site/SiteShowcase";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function DemoPage() {
  const router = useRouter();

  return (
    <SiteShell>
      <SiteDecisionBoard
        onPrimary={() => router.push("/teste-gratis")}
        onSecondary={() => router.push("/pricing")}
      />

      <SiteSection
        eyebrow="Demonstração"
        title="Veja a plataforma em camadas: operação, gestão comercial, financeiro e marca própria."
        description="Veja como sua empresa pode operar com mais clareza, responder melhor ao cliente e crescer com uma base sólida de gestão."
      >
        <SiteShowcase />
      </SiteSection>

      <SiteSection
        eyebrow="O que você ganha"
        title="Entenda o valor do produto antes mesmo de ativar a empresa."
        description="Cada bloco abaixo mostra um ganho concreto: mais ordem na rotina, mais previsibilidade comercial, mais leitura de gestão e mais força de marca."
      >
        <View style={styles.featureGrid}>
          <SiteFeatureCard
            icon="grid-outline"
            title="Visão operacional consolidada"
            description="Pedidos, profissionais, clientes, status e ritmo diário aparecem em uma leitura mais executiva para reduzir improviso."
          />
          <SiteFeatureCard
            icon="document-text-outline"
            title="Fluxo comercial estruturado"
            description="A empresa entende como o pedido entra, como a proposta avança e como o atendimento segue até execução."
          />
          <SiteFeatureCard
            icon="cash-outline"
            title="Camada financeira visível"
            description="Receita, repasses e leitura por conta ativa aparecem com clareza para apoiar decisões de gestão."
          />
          <SiteFeatureCard
            icon="color-wand-outline"
            title="Marca própria e governança"
            description="Marca própria, branding e diferenciação por plano fortalecem percepção de valor e posicionamento da empresa."
          />
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Jornada de uso"
        title="Como a empresa percebe valor ao entrar no sistema."
        description="Do primeiro acesso até a operação madura, o produto cria ordem, velocidade de resposta e segurança para escalar."
      >
        <View style={styles.journeyGrid}>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyStep}>01</Text>
            <Text style={styles.journeyTitle}>Organiza a base operacional</Text>
            <Text style={styles.journeyBody}>Clientes, profissionais, pedidos e papéis passam a existir em um fluxo único, com menos ruído e menos perda de contexto.</Text>
          </View>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyStep}>02</Text>
            <Text style={styles.journeyTitle}>Profissionaliza atendimento e proposta</Text>
            <Text style={styles.journeyBody}>A equipe responde com mais padrão, o histórico fica centralizado e a empresa ganha previsibilidade comercial.</Text>
          </View>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyStep}>03</Text>
            <Text style={styles.journeyTitle}>Lê operação e financeiro com clareza</Text>
            <Text style={styles.journeyBody}>A gestão deixa de depender de planilhas dispersas e passa a operar com visão mais objetiva de volume, carteira e receita.</Text>
          </View>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyStep}>04</Text>
            <Text style={styles.journeyTitle}>Evolui para marca própria e escala</Text>
            <Text style={styles.journeyBody}>Conforme o plano cresce, entram branding, recursos premium e camada SaaS para consolidar posicionamento e governança.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Antes e depois"
        title="O que muda na prática quando a operação sai do improviso."
        description="Compare o cenário mais comum de empresas de serviço com a rotina que você pode construir ao centralizar operação, atendimento e gestão."
      >
        <View style={styles.contrastGrid}>
          <View style={styles.contrastCardMuted}>
            <Text style={styles.contrastEyebrowMuted}>Antes</Text>
            <Text style={styles.contrastTitle}>Operação fragmentada</Text>
            <Text style={styles.contrastBodyMuted}>Pedidos chegam por canais soltos, a equipe responde sem padrão e a gestão perde leitura de volume, carteira e prioridade.</Text>
            <View style={styles.contrastList}>
              <Text style={styles.contrastItemMuted}>Planilhas paralelas e histórico incompleto</Text>
              <Text style={styles.contrastItemMuted}>Financeiro sem leitura integrada</Text>
              <Text style={styles.contrastItemMuted}>Baixa previsibilidade comercial</Text>
            </View>
          </View>

          <View style={styles.contrastCard}>
            <Text style={styles.contrastEyebrow}>Depois</Text>
            <Text style={styles.contrastTitle}>Operação governada e visível</Text>
            <Text style={styles.contrastBody}>A empresa passa a operar com fluxo único, contexto centralizado, acompanhamento de equipe e leitura executiva para evoluir com mais segurança.</Text>
            <View style={styles.contrastList}>
              <Text style={styles.contrastItem}>Entrada, proposta, execução e pós-venda no mesmo ambiente</Text>
              <Text style={styles.contrastItem}>Indicadores operacionais e financeiros no mesmo painel</Text>
              <Text style={styles.contrastItem}>Marca própria e governança por plano quando a operação amadurece</Text>
            </View>
          </View>
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Leitura executiva"
        title="O que um decisor consegue validar nessa demonstração."
        description="Se você precisa confiança para decidir, estes são os pontos que mais pesam na avaliação de uma plataforma desse nível."
      >
        <View style={styles.executiveWrap}>
          <View style={styles.executiveCard}>
            <Text style={styles.executiveTitle}>Para quem está avaliando o produto</Text>
            <Text style={styles.executiveBody}>Entenda rapidamente se a plataforma resolve organização, atendimento, leitura operacional e diferenciação comercial.</Text>
          </View>
          <View style={styles.executiveCard}>
            <Text style={styles.executiveTitle}>Para quem vai implantar</Text>
            <Text style={styles.executiveBody}>Comece rápido, crie a empresa, ative o teste e leve o time para um fluxo mais organizado desde o primeiro acesso.</Text>
          </View>
          <View style={styles.executiveCard}>
            <Text style={styles.executiveTitle}>Para quem pensa em escala</Text>
            <Text style={styles.executiveBody}>Expanda com planos, trial, marca própria e governança central sem trocar de base quando a operação crescer.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteSection
        eyebrow="Ângulos de decisão"
        title="Três razões para avançar agora."
        description="Se sua empresa precisa mais organização, mais controle e mais potência comercial, estes são os argumentos que pesam na decisão."
      >
        <View style={styles.decisionGrid}>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Organização</Text>
            <Text style={styles.decisionTitle}>Sai do improviso e entra em um processo profissional.</Text>
            <Text style={styles.decisionBody}>Sua empresa ganha clareza operacional logo no início e passa a trabalhar com mais ordem, menos ruído e mais consistência.</Text>
          </View>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Controle</Text>
            <Text style={styles.decisionTitle}>Lê volume, equipe, carteira e cobrança em uma visão integrada.</Text>
            <Text style={styles.decisionBody}>Isso reduz risco de gestão e aumenta confiança para escalar atendimento, equipe e receita com mais disciplina.</Text>
          </View>
          <View style={styles.decisionCard}>
            <Text style={styles.decisionValue}>Escala</Text>
            <Text style={styles.decisionTitle}>Evolui para SaaS com marca própria sem trocar de base.</Text>
            <Text style={styles.decisionBody}>Cresça com multi-tenant, planos, trial e diferenciação por empresa sem reconstruir processo nem tecnologia.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteCta
        title="Gostou da demonstração? Leve isso para um ambiente real agora."
        body="Se esse nível de organização faz sentido para sua empresa, o próximo passo é ativar o teste, configurar a operação e validar tudo com a sua rotina real."
        primaryLabel="Iniciar teste grátis"
        secondaryLabel="Ver planos"
        onPrimary={() => router.push("/teste-gratis")}
        onSecondary={() => router.push("/pricing")}
      />
    </SiteShell>
  );
}

const styles = StyleSheet.create({
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  journeyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  journeyCard: {
    minWidth: 260,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.8)",
    padding: 22,
    gap: 12,
  },
  journeyStep: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  journeyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  journeyBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
  executiveWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  executiveCard: {
    minWidth: 280,
    flex: 1,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(250, 204, 21, 0.07)",
    padding: 24,
    gap: 10,
  },
  executiveTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  executiveBody: {
    color: "#e2e8f0",
    lineHeight: 24,
  },
  contrastGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  contrastCardMuted: {
    minWidth: 280,
    flex: 1,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.72)",
    padding: 24,
    gap: 12,
  },
  contrastCard: {
    minWidth: 320,
    flex: 1.15,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.28)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    padding: 24,
    gap: 12,
  },
  contrastEyebrowMuted: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  contrastEyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  contrastTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  contrastBodyMuted: {
    color: "#96aac7",
    lineHeight: 24,
  },
  contrastBody: {
    color: "#f8fafc",
    lineHeight: 24,
  },
  contrastList: {
    gap: 8,
    paddingTop: 4,
  },
  contrastItemMuted: {
    color: "#94a3b8",
    lineHeight: 22,
  },
  contrastItem: {
    color: "#e2e8f0",
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
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(9, 15, 31, 0.84)",
    padding: 24,
    gap: 12,
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
