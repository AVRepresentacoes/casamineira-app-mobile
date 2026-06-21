import { SiteCta } from "@/components/site/SiteCta";
import { SiteSection } from "@/components/site/SiteSection";
import { SiteShell } from "@/components/site/SiteShell";
import { SAAS_SITE_TEXT } from "@/lib/saas-site-content";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ContatoPage() {
  const router = useRouter();

  return (
    <SiteShell>
      <SiteSection
        eyebrow="Contato comercial"
        title={SAAS_SITE_TEXT.contact.title}
        description={SAAS_SITE_TEXT.contact.body}
      >
        <View style={styles.grid}>
          {SAAS_SITE_TEXT.contact.channels.map((channel) => (
            <View key={channel} style={styles.card}>
              <Text style={styles.cardTitle}>{channel}</Text>
              <Text style={styles.cardBody}>Conversa objetiva para entender seu cenário, indicar o plano certo e acelerar sua entrada com segurança.</Text>
            </View>
          ))}
        </View>
      </SiteSection>

      <SiteCta
        title="Prefere seguir direto?"
        body="Se já faz sentido para o seu negócio, compare os planos ou inicie o teste grátis e veja a operação acontecer no seu contexto real."
        primaryLabel="Começar teste grátis"
        secondaryLabel="Ver planos"
        onPrimary={() => router.push("/teste-gratis")}
        onSecondary={() => router.push("/pricing")}
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
