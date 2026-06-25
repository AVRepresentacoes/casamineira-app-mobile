import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const TABS = [
  { key: "dashboard", label: "Dashboard operacional" },
  { key: "pedidos", label: "Pedidos e propostas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "marca", label: "Marca própria" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SHOWCASE: Record<
  TabKey,
  {
    title: string;
    body: string;
    stats: string[];
    kpis: { label: string; value: string }[];
    lanes: string[];
    panelLabel: string;
  }
> = {
  dashboard: {
    title: "Operação visível em um só lugar",
    body: "Centralize carteira, pedidos, profissionais e ritmo operacional com visão executiva clara para a gestão.",
    stats: ["84 pedidos no mês", "18 profissionais ativos", "126 clientes recorrentes"],
    kpis: [
      { label: "Pedidos ativos", value: "84" },
      { label: "Equipe online", value: "18" },
      { label: "SLA médio", value: "1h42" },
    ],
    lanes: ["Pedidos em triagem", "Equipes por disponibilidade", "Carteira por status"],
    panelLabel: "Painel central da operação",
  },
  pedidos: {
    title: "Fluxo comercial e atendimento sem improviso",
    body: "Pedidos, propostas e acompanhamento do status fluem em um processo mais profissional e previsível.",
    stats: ["Tempo de resposta reduzido", "Histórico centralizado", "Equipe alinhada por status"],
    kpis: [
      { label: "Propostas hoje", value: "27" },
      { label: "Conversão", value: "38%" },
      { label: "Resposta média", value: "12 min" },
    ],
    lanes: ["Entrada de pedido", "Propostas enviadas", "Aceite e execução"],
    panelLabel: "Pipeline de atendimento",
  },
  financeiro: {
    title: "Receita, repasses e controle financeiro",
    body: "Acompanhe repasses, carteira e indicadores financeiros com base operacional mais organizada.",
    stats: ["MRR estimado visível", "Repasses organizados", "Leitura por conta ativa"],
    kpis: [
      { label: "MRR estimado", value: "R$ 24,8k" },
      { label: "Repasses", value: "R$ 11,2k" },
      { label: "Inadimplência", value: "3,8%" },
    ],
    lanes: ["Receita por conta", "Repasse por profissional", "Status de cobrança"],
    panelLabel: "Controle financeiro e cobrança",
  },
  marca: {
    title: "Sua operação com marca própria",
    body: "Ative identidade visual, domínio e posicionamento premium sem abrir mão da governança central do SaaS.",
    stats: ["White-label por plano", "Branding por empresa", "Escala multi-tenant"],
    kpis: [
      { label: "Empresas white-label", value: "12" },
      { label: "Domínios ativos", value: "9" },
      { label: "Templates visuais", value: "4" },
    ],
    lanes: ["Branding da empresa", "Recursos por plano", "Governança multi-tenant"],
    panelLabel: "Camada de marca e diferenciação",
  },
};

export function SiteShowcase() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const content = SHOWCASE[tab];

  return (
    <View style={styles.wrap}>
      <View style={styles.tabRow}>
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <Pressable key={item.key} style={[styles.tab, active ? styles.tabActive : null]} onPress={() => setTab(item.key)}>
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <View style={styles.mockFrame}>
          <View style={styles.mockHeader}>
            <View style={styles.mockDots}>
              <View style={[styles.mockDot, { backgroundColor: "#fb7185" }]} />
              <View style={[styles.mockDot, { backgroundColor: "#facc15" }]} />
              <View style={[styles.mockDot, { backgroundColor: "#4ade80" }]} />
            </View>
            <Text style={styles.mockTitle}>{content.panelLabel}</Text>
          </View>
          <View style={styles.mockKpiRow}>
            {content.kpis.map((item) => (
              <View key={item.label} style={styles.mockKpiCard}>
                <Text style={styles.mockKpiValue}>{item.value}</Text>
                <Text style={styles.mockKpiLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.mockGrid}>
            <View style={styles.mockMain}>
              <View style={styles.mockStatLarge}>
                <View style={styles.mockChartHeader}>
                  <Text style={styles.mockChartLabel}>Visão consolidada</Text>
                  <Text style={styles.mockChartMeta}>Últimos 30 dias</Text>
                </View>
                <View style={styles.mockAreaChart}>
                  <View style={[styles.mockAreaBar, { height: 56 }]} />
                  <View style={[styles.mockAreaBar, { height: 88 }]} />
                  <View style={[styles.mockAreaBar, { height: 74 }]} />
                  <View style={[styles.mockAreaBar, { height: 106 }]} />
                  <View style={[styles.mockAreaBar, { height: 92 }]} />
                  <View style={[styles.mockAreaBar, { height: 120 }]} />
                </View>
              </View>
              <View style={styles.mockBars}>
                {content.lanes.map((lane, index) => (
                  <View key={lane} style={styles.mockLane}>
                    <Text style={styles.mockLaneLabel}>{lane}</Text>
                    <View style={[styles.mockBar, { width: `${88 - index * 16}%` }]} />
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.mockSide}>
              <View style={styles.mockCard}>
                <Text style={styles.mockCardTitle}>Prioridades</Text>
                <Text style={styles.mockCardBody}>Acompanhe gargalos, filas e ritmo da operação com leitura rápida.</Text>
              </View>
              <View style={styles.mockCard}>
                <Text style={styles.mockCardTitle}>Próxima ação</Text>
                <Text style={styles.mockCardBody}>Cada contexto mostra o próximo passo recomendado para a equipe.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.copyTitle}>{content.title}</Text>
          <Text style={styles.copyBody}>{content.body}</Text>
          <View style={styles.statList}>
            {content.stats.map((item) => (
              <View key={item} style={styles.statRow}>
                <View style={styles.statDot} />
                <Text style={styles.statText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.78)",
  },
  tabActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  tabText: {
    color: "#dbe7f4",
    fontWeight: "800",
    fontSize: 12,
  },
  tabTextActive: {
    color: "#08101c",
  },
  panel: {
    flexDirection: "row",
    gap: 20,
    alignItems: "stretch",
  },
  mockFrame: {
    flex: 1.3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.9)",
    padding: 20,
    gap: 18,
  },
  mockHeader: {
    gap: 10,
  },
  mockKpiRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  mockKpiCard: {
    minWidth: 150,
    flex: 1,
    borderRadius: 8,
    backgroundColor: "rgba(7, 10, 18, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    padding: 14,
    gap: 4,
  },
  mockKpiValue: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  mockKpiLabel: {
    color: "#9fb2ca",
    fontSize: 12,
    fontWeight: "700",
  },
  mockDots: {
    flexDirection: "row",
    gap: 6,
  },
  mockDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  mockTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  mockGrid: {
    flexDirection: "row",
    gap: 14,
  },
  mockMain: {
    flex: 1,
    gap: 14,
  },
  mockStatLarge: {
    minHeight: 184,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.28)",
    padding: 16,
    gap: 16,
  },
  mockChartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  mockChartLabel: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  mockChartMeta: {
    color: "#d7f3ff",
    fontSize: 12,
    fontWeight: "700",
  },
  mockAreaChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    flex: 1,
  },
  mockAreaBar: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "rgba(250, 204, 21, 0.88)",
  },
  mockBars: {
    borderRadius: 8,
    backgroundColor: "rgba(7, 10, 18, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    padding: 18,
    gap: 12,
  },
  mockLane: {
    gap: 8,
  },
  mockLaneLabel: {
    color: "#dbe7f4",
    fontSize: 12,
    fontWeight: "700",
  },
  mockBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.82)",
  },
  mockSide: {
    width: 180,
    gap: 14,
  },
  mockCard: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "rgba(7, 10, 18, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    padding: 16,
    gap: 10,
  },
  mockCardTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  mockCardBody: {
    color: "#96aac7",
    lineHeight: 20,
    fontSize: 13,
  },
  copy: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 24,
    gap: 16,
  },
  copyTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  copyBody: {
    color: "#96aac7",
    lineHeight: 24,
  },
  statList: {
    gap: 10,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22D3EE",
  },
  statText: {
    color: "#dbe7f4",
    lineHeight: 22,
    flex: 1,
  },
});
