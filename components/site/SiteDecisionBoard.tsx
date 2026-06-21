import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SiteButton } from "@/components/site/SiteButton";

export function SiteDecisionBoard({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.backdropA} />
      <View style={styles.backdropB} />

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Demo guiada</Text>
        <Text style={styles.title}>Uma visão feita para convencer quem decide.</Text>
        <Text style={styles.body}>
          Veja sua operação como ela deve funcionar: atendimento organizado, funil previsível, leitura financeira clara e uma camada de marca própria pronta para diferenciar sua empresa.
        </Text>

        <View style={styles.proofGrid}>
          <View style={styles.proofCard}>
            <Text style={styles.proofValue}>-48%</Text>
            <Text style={styles.proofLabel}>ruído operacional estimado</Text>
          </View>
          <View style={styles.proofCard}>
            <Text style={styles.proofValue}>+31%</Text>
            <Text style={styles.proofLabel}>velocidade comercial percebida</Text>
          </View>
          <View style={styles.proofCard}>
            <Text style={styles.proofValue}>1 só</Text>
            <Text style={styles.proofLabel}>camada para operação, gestão e SaaS</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <SiteButton label="Iniciar teste grátis" onPress={onPrimary} />
          <SiteButton label="Ver planos" onPress={onSecondary} tone="secondary" />
        </View>
      </View>

      <View style={styles.visual}>
        <View style={styles.window}>
          <View style={styles.windowHeader}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: "#fb7185" }]} />
              <View style={[styles.dot, { backgroundColor: "#facc15" }]} />
              <View style={[styles.dot, { backgroundColor: "#4ade80" }]} />
            </View>
            <Text style={styles.windowTitle}>Command center da empresa</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCardPrimary}>
              <Text style={styles.kpiPrimaryValue}>R$ 24,8k</Text>
              <Text style={styles.kpiLabel}>MRR estimado</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>84</Text>
              <Text style={styles.kpiLabel}>Pedidos em andamento</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>18</Text>
              <Text style={styles.kpiLabel}>Profissionais ativos</Text>
            </View>
          </View>

          <View style={styles.canvas}>
            <View style={styles.graphCard}>
              <Text style={styles.graphTitle}>Tração operacional</Text>
              <View style={styles.barChart}>
                <View style={[styles.bar, { height: 78 }]} />
                <View style={[styles.bar, { height: 118 }]} />
                <View style={[styles.bar, { height: 96 }]} />
                <View style={[styles.bar, { height: 142 }]} />
                <View style={[styles.bar, { height: 126 }]} />
                <View style={[styles.bar, { height: 162 }]} />
              </View>
            </View>

            <View style={styles.sideColumn}>
              <View style={styles.listCard}>
                <Text style={styles.listTitle}>Alertas de gestão</Text>
                <View style={styles.listItem}>
                  <Ionicons name="sparkles-outline" size={16} color="#67e8f9" />
                  <Text style={styles.listText}>Pedidos aguardando proposta</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="cash-outline" size={16} color="#facc15" />
                  <Text style={styles.listText}>Cobrança com atenção</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="color-wand-outline" size={16} color="#4ade80" />
                  <Text style={styles.listText}>Empresas com marca própria</Text>
                </View>
              </View>

              <View style={styles.pipelineCard}>
                <Text style={styles.pipelineTitle}>Pipeline comercial</Text>
                <View style={styles.pipelineLane}>
                  <Text style={styles.pipelineLabel}>Entrada</Text>
                  <View style={[styles.pipelineBar, { width: "92%" }]} />
                </View>
                <View style={styles.pipelineLane}>
                  <Text style={styles.pipelineLabel}>Propostas</Text>
                  <View style={[styles.pipelineBar, { width: "74%" }]} />
                </View>
                <View style={styles.pipelineLane}>
                  <Text style={styles.pipelineLabel}>Fechamento</Text>
                  <View style={[styles.pipelineBar, { width: "58%" }]} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
  backdropA: {
    position: "absolute",
    right: -60,
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  backdropB: {
    position: "absolute",
    left: -40,
    bottom: -90,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  copy: {
    flex: 1,
    gap: 18,
    maxWidth: 520,
  },
  eyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "900",
  },
  body: {
    color: "#9db1ca",
    fontSize: 16,
    lineHeight: 26,
  },
  proofGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  proofCard: {
    minWidth: 140,
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    padding: 14,
    gap: 6,
  },
  proofValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  proofLabel: {
    color: "#9db1ca",
    lineHeight: 20,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 6,
  },
  visual: {
    flex: 1.2,
    minWidth: 520,
  },
  window: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(10, 16, 30, 0.88)",
    padding: 20,
    gap: 18,
    shadowColor: "#020617",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  windowHeader: {
    gap: 10,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  windowTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  kpiCardPrimary: {
    minWidth: 180,
    flex: 1.1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
    gap: 6,
  },
  kpiCard: {
    minWidth: 150,
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    gap: 6,
  },
  kpiPrimaryValue: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
  },
  kpiValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  kpiLabel: {
    color: "#9db1ca",
    fontSize: 12,
    fontWeight: "700",
  },
  canvas: {
    flexDirection: "row",
    gap: 14,
  },
  graphCard: {
    flex: 1.2,
    minHeight: 320,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.22)",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    padding: 18,
    gap: 18,
  },
  graphTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  barChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  bar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.9)",
  },
  sideColumn: {
    width: 240,
    gap: 14,
  },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    padding: 16,
    gap: 12,
  },
  listTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listText: {
    color: "#dbe7f4",
    lineHeight: 20,
    flex: 1,
    fontSize: 13,
  },
  pipelineCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    padding: 16,
    gap: 12,
  },
  pipelineTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  pipelineLane: {
    gap: 8,
  },
  pipelineLabel: {
    color: "#dbe7f4",
    fontSize: 12,
    fontWeight: "700",
  },
  pipelineBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(103, 232, 249, 0.9)",
  },
});
