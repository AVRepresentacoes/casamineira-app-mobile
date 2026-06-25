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
      <View style={styles.heroAccent} />
      <View style={styles.copy}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{badge}</Text>
          <Text style={styles.badgeMeta}>SaaS para servicos, vendas e operacao</Text>
        </View>
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
        <View style={styles.visualRail}>
          <Text style={styles.visualRailText}>Painel executivo</Text>
        </View>
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
          <View style={styles.visualLineHeader}>
            <Text style={styles.visualLineTitle}>Saúde da operação</Text>
            <Text style={styles.visualLineMeta}>Hoje</Text>
          </View>
          <View style={styles.visualMetricLine}>
            <Text style={styles.visualMetricLabel}>Atendimento</Text>
            <View style={styles.visualTrack}>
              <View style={[styles.visualBar, { width: "80%" }]} />
            </View>
          </View>
          <View style={styles.visualMetricLine}>
            <Text style={styles.visualMetricLabel}>Financeiro</Text>
            <View style={styles.visualTrack}>
              <View style={[styles.visualBarSecondary, { width: "58%" }]} />
            </View>
          </View>
          <View style={styles.visualMetricLine}>
            <Text style={styles.visualMetricLabel}>Agenda</Text>
            <View style={styles.visualTrack}>
              <View style={[styles.visualBar, { width: "92%" }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    gap: 26,
    alignItems: "flex-end",
    minHeight: 620,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "#0B0F1A",
    padding: 34,
  },
  heroAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 8,
    backgroundColor: "#FACC15",
  },
  copy: {
    flex: 1.05,
    gap: 18,
    paddingVertical: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    color: "#08101C",
    backgroundColor: "#FACC15",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  badgeMeta: {
    color: "#B6C3D5",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 58,
    lineHeight: 64,
    fontWeight: "900",
    maxWidth: 780,
  },
  subtitle: {
    color: "#B6C3D5",
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 720,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.13)",
    backgroundColor: "rgba(255, 255, 255, 0.045)",
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
    flex: 0.95,
    minWidth: 380,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    padding: 22,
    gap: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  visualRail: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.12)",
    paddingBottom: 12,
  },
  visualRailText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  visualTop: {
    flexDirection: "row",
    gap: 14,
  },
  visualHeroCard: {
    flex: 1.2,
    borderRadius: 8,
    backgroundColor: "rgba(34, 211, 238, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.22)",
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
    borderRadius: 8,
    backgroundColor: "rgba(7, 10, 18, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
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
    borderRadius: 8,
    backgroundColor: "rgba(7, 10, 18, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    padding: 18,
    gap: 12,
  },
  visualLineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  visualLineTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
  },
  visualLineMeta: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  visualMetricLine: {
    gap: 7,
  },
  visualMetricLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "800",
  },
  visualTrack: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  visualBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FACC15",
  },
  visualBarSecondary: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#22D3EE",
  },
});
