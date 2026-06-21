import { SiteButton } from "@/components/site/SiteButton";
import { StyleSheet, Text, View } from "react-native";

export function SiteHero({
  badge,
  title,
  subtitle,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  badge: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.copy}>
        <Text style={styles.badge}>{badge}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.actions}>
          <SiteButton label={primaryLabel} onPress={onPrimary} />
          <SiteButton label={secondaryLabel} onPress={onSecondary} tone="secondary" />
        </View>
        <View style={styles.proofRow}>
          <View style={styles.proofPill}>
            <Text style={styles.proofPillValue}>+ previsibilidade</Text>
            <Text style={styles.proofPillLabel}>Pedidos, propostas e status no mesmo fluxo</Text>
          </View>
          <View style={styles.proofPill}>
            <Text style={styles.proofPillValue}>+ gestão</Text>
            <Text style={styles.proofPillLabel}>Equipe, carteira e financeiro com leitura unificada</Text>
          </View>
        </View>
      </View>

      <View style={styles.visual}>
        <View style={styles.visualTop}>
          <View style={styles.visualHeroCard}>
            <Text style={styles.visualHeroLabel}>Operação sob controle</Text>
            <Text style={styles.visualHeroValue}>84 pedidos</Text>
            <Text style={styles.visualHeroMeta}>Atendimento, equipe, clientes e financeiro organizados no mesmo ambiente.</Text>
          </View>
          <View style={styles.visualSide}>
            <View style={styles.visualMiniCard}>
              <Text style={styles.visualMiniTitle}>Resposta comercial</Text>
              <Text style={styles.visualMiniValue}>+37%</Text>
            </View>
            <View style={styles.visualMiniCard}>
              <Text style={styles.visualMiniTitle}>Carteira ativa</Text>
              <Text style={styles.visualMiniValue}>126 clientes</Text>
            </View>
          </View>
        </View>
        <View style={styles.visualBottom}>
          <View style={[styles.visualBar, { width: "80%" }]} />
          <View style={[styles.visualBar, { width: "58%" }]} />
          <View style={[styles.visualBar, { width: "92%" }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: 22,
    alignItems: "stretch",
  },
  copy: {
    flex: 1,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 28,
    gap: 16,
  },
  badge: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "900",
    maxWidth: 700,
  },
  subtitle: {
    color: "#90a7c4",
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 740,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  proofRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 2,
  },
  proofPill: {
    minWidth: 220,
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    padding: 14,
    gap: 4,
  },
  proofPillValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  proofPillLabel: {
    color: "#96aac7",
    lineHeight: 20,
    fontSize: 12,
  },
  visual: {
    flex: 1,
    minWidth: 380,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 22,
    gap: 16,
  },
  visualTop: {
    flexDirection: "row",
    gap: 14,
  },
  visualHeroCard: {
    flex: 1.2,
    borderRadius: 28,
    backgroundColor: "rgba(56, 189, 248, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.24)",
    padding: 20,
    gap: 10,
  },
  visualHeroLabel: {
    color: "#dff6ff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  visualHeroValue: {
    color: "#f8fafc",
    fontSize: 36,
    fontWeight: "900",
  },
  visualHeroMeta: {
    color: "#d7e8f7",
    lineHeight: 22,
  },
  visualSide: {
    width: 170,
    gap: 14,
  },
  visualMiniCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    padding: 16,
    gap: 8,
  },
  visualMiniTitle: {
    color: "#8fb0d6",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  visualMiniValue: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  visualBottom: {
    borderRadius: 28,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    padding: 18,
    gap: 14,
  },
  visualBar: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.88)",
  },
});
