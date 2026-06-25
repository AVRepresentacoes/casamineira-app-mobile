import { SaasProductShell } from "@/components/saas/SaasProductShell";
import {
  businessProjectStatusLabels,
  findBusinessProjectModule,
  getProjectProgress,
  projectPreparedCapabilities,
} from "@/src/business-project/mock";
import type { BusinessProject, BusinessProjectModuleId } from "@/src/business-project/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export function BusinessProjectWorkspace({
  project,
  moduleId = "overview",
}: {
  project: BusinessProject;
  moduleId?: BusinessProjectModuleId | string | string[];
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 980;
  const activeModule = findBusinessProjectModule(moduleId);
  const progress = getProjectProgress(project);
  const isOverview = activeModule.id === "overview";

  return (
    <SaasProductShell
      title={project.name}
      subtitle={`${project.businessDnaName} · ${project.templateName} · ${project.plan} · ${project.environment}`}
    >
      <View style={[styles.hero, compact ? styles.heroCompact : null]}>
        <View style={styles.heroMain}>
          <Text style={styles.kicker}>Business Project™</Text>
          <Text style={styles.heroTitle}>{project.name}</Text>
          <Text style={styles.heroText}>
            Centro de comando visual para operar uma empresa digital com Business DNA™, template, módulos, equipe e ambientes.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{businessProjectStatusLabels[project.status]}</Text>
            <Text style={styles.metaChip}>{project.version}</Text>
            <Text style={styles.metaChip}>{project.tenantLabel}</Text>
          </View>
        </View>
        <View style={[styles.progressCard, compact ? styles.progressCardCompact : null]}>
          <Text style={styles.progressLabel}>Progresso visual</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressHint}>Baseada na timeline mockada desta sprint.</Text>
        </View>
      </View>

      <View style={styles.moduleNav}>
        {project.modules.map((module) => {
          const active = activeModule.id === module.id;
          const href = module.id === "overview" ? `/projects/${project.slug}` : `/projects/${project.slug}/${module.id}`;
          return (
            <Pressable key={module.id} style={[styles.moduleTab, active ? styles.moduleTabActive : null]} onPress={() => router.push(href as never)}>
              <MaterialCommunityIcons name={module.icon} size={17} color={active ? "#07111f" : "#cbd5e1"} />
              <Text style={[styles.moduleTabText, active ? styles.moduleTabTextActive : null]}>{module.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.layout, compact ? styles.layoutCompact : null]}>
        <View style={styles.mainColumn}>
          {isOverview ? (
            <ProjectOverview project={project} />
          ) : (
            <ModulePlaceholder project={project} moduleId={activeModule.id} />
          )}
        </View>

        <View style={[styles.sidePanel, compact ? styles.sidePanelCompact : null]}>
          <Text style={styles.sideEyebrow}>Resumo Executivo</Text>
          <Text style={styles.sideTitle}>{project.companyName}</Text>
          <SummaryItem label="Saúde" value={project.executiveSummary.health} />
          <SummaryItem label="Objetivo" value={project.executiveSummary.goal} />
          <SummaryItem label="Risco" value={project.executiveSummary.risk} />
          <SummaryItem label="Próxima decisão" value={project.executiveSummary.nextDecision} />

          <View style={styles.capabilityBox}>
            <Text style={styles.capabilityTitle}>Preparado para</Text>
            {projectPreparedCapabilities.map((capability) => (
              <View key={capability} style={styles.capabilityRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color="#86efac" />
                <Text style={styles.capabilityText}>{capability}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SaasProductShell>
  );
}

function ProjectOverview({ project }: { project: BusinessProject }) {
  const activeModules = project.modules.filter((module) => module.status === "Ativo");

  return (
    <>
      <View style={styles.statsGrid}>
        <MetricCard label="Status" value={businessProjectStatusLabels[project.status]} icon="pulse" />
        <MetricCard label="Módulos ativos" value={`${activeModules.length}`} icon="view-grid-outline" />
        <MetricCard label="Builds" value={`${project.builds.length}`} icon="hammer-wrench" />
        <MetricCard label="Equipe" value={`${project.team.length}`} icon="account-group-outline" />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Dashboard do Projeto</Text>
            <Text style={styles.sectionTitle}>Operação central</Text>
          </View>
          <Text style={styles.panelBadge}>{project.environment}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoBlock label="Business DNA utilizado" value={project.businessDnaName} icon="dna" />
          <InfoBlock label="Template" value={project.templateName} icon="shape-outline" />
          <InfoBlock label="Plano contratado" value={project.plan} icon="crown-outline" />
          <InfoBlock label="Ambiente" value={project.environment} icon="server-outline" />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionEyebrow}>Próximas tarefas</Text>
        {project.nextTasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <View style={styles.taskDot} />
            <View style={styles.taskCopy}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskMeta}>{task.owner} · {task.dueLabel}</Text>
            </View>
            <Text style={styles.taskStatus}>{task.status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionEyebrow}>Builds</Text>
        <View style={styles.buildGrid}>
          {project.builds.map((build) => (
            <View key={build.id} style={styles.buildCard}>
              <Text style={styles.buildChannel}>{build.channel}</Text>
              <Text style={styles.buildStatus}>{build.status}</Text>
              <Text style={styles.buildVersion}>{build.version}</Text>
            </View>
          ))}
        </View>
      </View>

      <Timeline project={project} />
    </>
  );
}

function ModulePlaceholder({ project, moduleId }: { project: BusinessProject; moduleId: BusinessProjectModuleId }) {
  const module = findBusinessProjectModule(moduleId);

  return (
    <>
      <View style={styles.placeholderHero}>
        <View style={styles.placeholderIcon}>
          <MaterialCommunityIcons name={module.icon} size={34} color="#67e8f9" />
        </View>
        <Text style={styles.sectionEyebrow}>Módulo do Projeto</Text>
        <Text style={styles.placeholderTitle}>{module.title}</Text>
        <Text style={styles.placeholderText}>{module.description}</Text>
        <View style={styles.placeholderMeta}>
          <Text style={styles.metaChip}>{module.status}</Text>
          <Text style={styles.metaChip}>{project.name}</Text>
          <Text style={styles.metaChip}>Placeholder elegante</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionEyebrow}>Estrutura prevista</Text>
        <View style={styles.highlightGrid}>
          {module.placeholderHighlights.map((highlight) => (
            <View key={highlight} style={styles.highlightCard}>
              <MaterialCommunityIcons name="auto-fix" size={20} color="#facc15" />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionEyebrow}>Contrato futuro</Text>
        <Text style={styles.contractText}>
          Este módulo está preparado para receber dados por tenant, ambiente e usuário. Nenhuma lógica real foi conectada nesta sprint.
        </Text>
      </View>
    </>
  );
}

function Timeline({ project }: { project: BusinessProject }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionEyebrow}>Timeline</Text>
      {project.timeline.map((item) => (
        <View key={item.id} style={styles.timelineRow}>
          <View style={[styles.timelineMarker, item.status === "done" ? styles.timelineMarkerDone : item.status === "current" ? styles.timelineMarkerCurrent : null]} />
          <View style={styles.timelineCopy}>
            <Text style={styles.timelineTitle}>{item.label}</Text>
            <Text style={styles.timelineDescription}>{item.description}</Text>
          </View>
          <Text style={styles.timelineStatus}>{item.status === "done" ? "Concluído" : item.status === "current" ? "Atual" : "Próximo"}</Text>
        </View>
      ))}
    </View>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={22} color="#67e8f9" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <View style={styles.infoBlock}>
      <MaterialCommunityIcons name={icon} size={20} color="#facc15" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 24,
  },
  heroCompact: {
    flexDirection: "column",
  },
  heroMain: {
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
    maxWidth: 760,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
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
  progressCard: {
    width: 240,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(113, 63, 18, 0.16)",
    padding: 16,
    gap: 8,
  },
  progressCardCompact: {
    width: "100%",
  },
  progressLabel: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
  },
  progressValue: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#facc15",
  },
  progressHint: {
    color: "#fef3c7",
    fontSize: 11,
    lineHeight: 16,
  },
  moduleNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.9)",
    padding: 12,
  },
  moduleTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  moduleTabActive: {
    backgroundColor: "#67e8f9",
    borderColor: "#67e8f9",
  },
  moduleTabText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
  },
  moduleTabTextActive: {
    color: "#07111f",
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
    gap: 16,
  },
  sidePanel: {
    width: "100%",
    maxWidth: 370,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 14,
  },
  sidePanelCompact: {
    maxWidth: "100%",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 170,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 16,
    gap: 8,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 14,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  panelBadge: {
    color: "#07111f",
    backgroundColor: "#facc15",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    minWidth: 180,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 6,
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.08)",
    paddingTop: 12,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#67e8f9",
  },
  taskCopy: {
    flex: 1,
    gap: 3,
  },
  taskTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  taskMeta: {
    color: "#94a3b8",
    fontSize: 12,
  },
  taskStatus: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
  },
  buildGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  buildCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 6,
  },
  buildChannel: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  buildStatus: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  buildVersion: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
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
  timelineMarkerDone: {
    borderColor: "#86efac",
    backgroundColor: "rgba(134, 239, 172, 0.24)",
  },
  timelineMarkerCurrent: {
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
  timelineDescription: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  timelineStatus: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "900",
  },
  summaryItem: {
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.08)",
    paddingTop: 12,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#e5eefb",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  capabilityBox: {
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 9,
  },
  capabilityTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  capabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  capabilityText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
  },
  placeholderHero: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 22,
    gap: 12,
  },
  placeholderIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.24)",
    backgroundColor: "rgba(8, 145, 178, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  placeholderText: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 760,
  },
  placeholderMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  highlightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  highlightCard: {
    flex: 1,
    minWidth: 170,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 8,
  },
  highlightText: {
    color: "#f8fafc",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
  },
  contractText: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
});
