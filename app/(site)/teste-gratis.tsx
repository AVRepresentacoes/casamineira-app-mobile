import { SiteCta } from "@/components/site/SiteCta";
import { SiteSection } from "@/components/site/SiteSection";
import { SiteShell } from "@/components/site/SiteShell";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function TesteGratisPage() {
  const router = useRouter();

  return (
    <SiteShell>
      <SiteSection
        eyebrow="Onboarding comercial"
        title="Configure sua empresa, entre em teste e valide o produto com mais contexto."
        description="Coloque sua empresa para operar, teste os fluxos com seu cenário real e descubra com clareza qual plano acompanha melhor seu crescimento."
      >
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Inicie o onboarding</Text>
            <Text style={styles.cardBody}>Cadastre a empresa, escolha o ponto de partida e comece a validar a plataforma com agilidade.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Ative a operação</Text>
            <Text style={styles.cardBody}>Convide a equipe, ajuste a identidade da empresa e veja os fluxos funcionando com a sua rotina.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Evolua para o plano ideal</Text>
            <Text style={styles.cardBody}>Com uso real em mãos, avance para o plano que entrega o melhor equilíbrio entre controle, capacidade e escala.</Text>
          </View>
        </View>
      </SiteSection>

      <SiteCta
        title="Pronto para configurar sua empresa?"
        body="Comece agora o onboarding da empresa ou reveja demonstração e planos se quiser comparar antes de decidir."
        primaryLabel="Abrir onboarding da empresa"
        secondaryLabel="Ver demonstração"
        onPrimary={() => router.push("/(auth)/onboarding-empresa")}
        onSecondary={() => router.push("/demo")}
      />
    </SiteShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    minWidth: 280,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 22,
    gap: 12,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  cardBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
});
