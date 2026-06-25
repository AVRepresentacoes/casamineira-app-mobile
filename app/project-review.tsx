import { SaasProductShell } from "@/components/saas/SaasProductShell";
import {
  editActions,
  futureReviewContract,
  projectReview,
  reviewChecklist,
  reviewIndicators,
  reviewTimeline,
} from "@/src/project-review/mock";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export default function ProjectReviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 980;
  const blueprint = projectReview.blueprint;

  return (
    <SaasProductShell
      title="Project Review"
      subtitle="Revise o Blueprint™, valide escopo, prazo, custo, arquitetura e aprove o projeto antes de qualquer materialização."
    >
      <View style={[styles.hero, compact ? styles.heroCompact : null]}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Project Review Center™</Text>
          <Text style={styles.heroTitle}>Aprovação humana antes da construção.</Text>
          <Text style={styles.heroText}>
            Central visual para revisar a empresa digital recomendada, editar decisões estratégicas e preparar integração futura com workflow de aprovação.
          </Text>
        </View>
        <View style={styles.approvalCard}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={26} color="#facc15" />
          <Text style={styles.approvalTitle}>Pronto para revisão</Text>
          <Text style={styles.approvalText}>Dados mockados, sem backend, sem IA e sem persistência.</Text>
        </View>
      </View>

      <View style={[styles.layout, compact ? styles.layoutCompact : null]}>
        <View style={styles.mainColumn}>
          <View style={styles.panel}>
            <SectionHeader eyebrow="Resumo Executivo" title={blueprint.title} />
            <Text style={styles.bodyText}>{blueprint.executiveSummary}</Text>
            <View style={styles.infoGrid}>
              <InfoCard label="Business DNA™" value={blueprint.businessDnaName} icon="dna" />
              <InfoCard label="Template" value={blueprint.templateName} icon="shape-outline" />
              <InfoCard label="Plano recomendado" value={blueprint.recommendedPlan} icon="crown-outline" />
              <InfoCard label="Ambiente" value={projectReview.environment} icon="server-outline" />
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader eyebrow="Arquitetura" title={blueprint.architecture.pattern} />
            <View style={styles.archGrid}>
              <ArchColumn title="Frontend" items={blueprint.architecture.frontend} />
              <ArchColumn title="Backend" items={blueprint.architecture.backend} />
              <ArchColumn title="Dados" items={blueprint.architecture.data} />
              <ArchColumn title="Segurança" items={blueprint.architecture.security} />
            </View>
          </View>

          <View style={styles.doubleGrid}>
            <View style={styles.panel}>
              <SectionHeader eyebrow="Banco sugerido" title={projectReview.databaseSuggestion.name} />
              <Text style={styles.bodyText}>{projectReview.databaseSuggestion.policy}</Text>
              <TagList items={projectReview.databaseSuggestion.tables} />
              <TagList items={projectReview.databaseSuggestion.buckets} />
            </View>

            <View style={styles.panel}>
              <SectionHeader eyebrow="Integrações e fluxos" title="Operação planejada" />
              <TagList items={blueprint.integrations} />
              <TagList items={projectReview.flows} />
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader eyebrow="Módulos" title="Escopo revisável" />
            <View style={styles.moduleGrid}>
              {blueprint.modules.map((module) => (
                <View key={module.id} style={styles.moduleCard}>
                  <MaterialCommunityIcons name={module.icon} size={21} color={module.selected ? "#67e8f9" : "#64748b"} />
                  <Text style={styles.moduleTitle}>{module.name}</Text>
                  <Text style={styles.moduleText}>{module.description}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader eyebrow="Timeline" title="Caminho de aprovação" />
            {reviewTimeline.map((item) => (
              <View key={item.id} style={styles.timelineRow}>
                <View style={[styles.timelineMarker, item.status === "done" ? styles.timelineDone : item.status === "current" ? styles.timelineCurrent : null]} />
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineText}>{item.description}</Text>
                </View>
                <Text style={styles.timelineStatus}>{item.status === "done" ? "Concluído" : item.status === "current" ? "Atual" : "Próximo"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.doubleGrid}>
            <View style={styles.panel}>
              <SectionHeader eyebrow="Checklist" title="Itens de validação" />
              <View style={styles.checkGrid}>
                {reviewChecklist.map((item) => (
                  <View key={item.id} style={styles.checkItem}>
                    <MaterialCommunityIcons name={item.checked ? "check-circle-outline" : "circle-outline"} size={18} color={item.checked ? "#86efac" : "#94a3b8"} />
                    <Text style={styles.checkText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <SectionHeader eyebrow="Editar Projeto" title="Ajustes antes da aprovação" />
              {editActions.map((action) => (
                <Pressable key={action.id} style={styles.editRow} onPress={() => router.push("/ai-solution-architect" as never)}>
                  <View>
                    <Text style={styles.editTitle}>{action.label}</Text>
                    <Text style={styles.editText}>{action.description}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#94a3b8" />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader eyebrow="Entrega" title="Prazo, custo e equipe" />
            <View style={styles.infoGrid}>
              <InfoCard label="Tempo estimado" value={projectReview.estimatedTime} icon="clock-outline" />
              <InfoCard label="Custo estimado" value={projectReview.estimatedCost} icon="cash-multiple" />
              <InfoCard label="Permissões" value={projectReview.permissions.join(", ")} icon="account-key-outline" />
              <InfoCard label="Recursos Premium" value={projectReview.premiumResources.join(", ")} icon="diamond-stone" />
            </View>
            <View style={styles.teamGrid}>
              {blueprint.suggestedTeam.map((member) => (
                <View key={member.role} style={styles.teamCard}>
                  <Text style={styles.teamRole}>{member.role}</Text>
                  <Text style={styles.teamText}>{member.responsibility}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionBar}>
            <Pressable style={styles.secondaryButton} onPress={() => router.push("/ai-solution-architect" as never)}>
              <MaterialCommunityIcons name="arrow-left" size={18} color="#dbeafe" />
              <Text style={styles.secondaryButtonText}>Voltar para edição</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/projects" as never)}>
              <MaterialCommunityIcons name="check-decagram-outline" size={19} color="#07111f" />
              <Text style={styles.primaryButtonText}>Aprovar Projeto</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.sidePanel, compact ? styles.sidePanelCompact : null]}>
          <Text style={styles.sideEyebrow}>Indicadores</Text>
          <Text style={styles.sideTitle}>Leitura executiva</Text>
          {reviewIndicators.map((indicator) => (
            <View key={indicator.label} style={styles.indicator}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                <Text style={styles.indicatorValue}>{indicator.value}%</Text>
              </View>
              <View style={styles.indicatorTrack}>
                <View style={[styles.indicatorFill, { width: `${indicator.value}%`, backgroundColor: indicator.tone }]} />
              </View>
            </View>
          ))}

          <View style={styles.contractBox}>
            <Text style={styles.contractTitle}>Preparado para integração</Text>
            {futureReviewContract.expectedOutputs.map((item) => (
              <View key={item} style={styles.contractRow}>
                <MaterialCommunityIcons name="api" size={15} color="#67e8f9" />
                <Text style={styles.contractText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SaasProductShell>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <View style={styles.infoCard}>
      <MaterialCommunityIcons name={icon} size={20} color="#facc15" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ArchColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.archColumn}>
      <Text style={styles.archTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.archItem}>
          <MaterialCommunityIcons name="check" size={13} color="#86efac" />
          <Text style={styles.archText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <View style={styles.tagList}>
      {items.map((item) => (
        <Text key={item} style={styles.tag}>{item}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 26,
  },
  heroCompact: {
    flexDirection: "column",
  },
  heroCopy: {
    flex: 1,
    gap: 10,
  },
  kicker: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
  },
  heroText: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 820,
  },
  approvalCard: {
    width: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.24)",
    backgroundColor: "rgba(113, 63, 18, 0.16)",
    padding: 16,
    gap: 8,
  },
  approvalTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  approvalText: {
    color: "#fef3c7",
    fontSize: 12,
    lineHeight: 18,
  },
  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  layoutCompact: {
    flexDirection: "column",
  },
  mainColumn: {
    flex: 1,
    width: "100%",
    gap: 16,
  },
  sidePanel: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 16,
  },
  sidePanelCompact: {
    maxWidth: "100%",
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 14,
  },
  sectionEyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  bodyText: {
    color: "#b6c3d5",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 7,
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#f8fafc",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
  },
  archGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  archColumn: {
    flex: 1,
    minWidth: 180,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 8,
  },
  archTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  archItem: {
    flexDirection: "row",
    gap: 7,
    alignItems: "flex-start",
  },
  archText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
  },
  doubleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moduleCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 8,
  },
  moduleTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  moduleText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.08)",
    paddingTop: 13,
  },
  timelineMarker: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#64748b",
  },
  timelineDone: {
    borderColor: "#86efac",
    backgroundColor: "rgba(134, 239, 172, 0.24)",
  },
  timelineCurrent: {
    borderColor: "#facc15",
    backgroundColor: "rgba(250, 204, 21, 0.22)",
  },
  timelineCopy: {
    flex: 1,
    gap: 3,
  },
  timelineTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  timelineText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  timelineStatus: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "900",
  },
  checkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  checkItem: {
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 11,
  },
  checkText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.08)",
    paddingTop: 12,
  },
  editTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  editText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  teamCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 6,
  },
  teamRole: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  teamText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 16,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: "#facc15",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#07111f",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(219, 234, 254, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: "900",
  },
  sideEyebrow: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sideTitle: {
    color: "#f8fafc",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },
  indicator: {
    gap: 8,
  },
  indicatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  indicatorLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "900",
  },
  indicatorValue: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  indicatorTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  indicatorFill: {
    height: "100%",
    borderRadius: 999,
  },
  contractBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(8, 145, 178, 0.1)",
    padding: 14,
    gap: 9,
  },
  contractTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  contractRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contractText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
  },
});
