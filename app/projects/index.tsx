import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { BusinessProjectService } from "@/services/business-project";
import { businessProjectStatusLabels, getProjectProgress } from "@/src/business-project/mock";
import type { BusinessProject } from "@/src/business-project/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

function ProjectCard({ project }: { project: BusinessProject }) {
  const router = useRouter();
  const progress = getProjectProgress(project);

  return (
    <Pressable style={styles.projectCard} onPress={() => router.push(`/projects/${project.slug}` as never)}>
      <View style={styles.projectTop}>
        <View style={styles.projectIcon}>
          <MaterialCommunityIcons name="domain" size={28} color="#67e8f9" />
        </View>
        <View style={styles.projectStatus}>
          <Text style={styles.projectStatusText}>{businessProjectStatusLabels[project.status]}</Text>
        </View>
      </View>

      <Text style={styles.projectName}>{project.name}</Text>
      <Text style={styles.projectDescription}>{project.businessDnaName} com base no template {project.templateName}.</Text>

      <View style={styles.projectMetaGrid}>
        <Meta label="Plano" value={project.plan} />
        <Meta label="Ambiente" value={project.environment} />
        <Meta label="Versão" value={project.version} />
        <Meta label="Equipe" value={`${project.team.length} pessoas`} />
      </View>

      <View style={styles.progressArea}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.projectFooter}>
        <Text style={styles.projectDate}>Criado em {project.createdAtLabel}</Text>
        <Text style={styles.projectDate}>Atualizado {project.updatedAtLabel}</Text>
      </View>
    </Pressable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export default function BusinessProjectsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 860;
  const [projects, setProjects] = useState<BusinessProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        const data = await BusinessProjectService.listCurrent();
        if (active) setProjects(data);
      } catch (error) {
        console.log("BUSINESS PROJECTS LOAD ERROR:", error);
        if (active) setProjects([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SaasProductShell
      title="Meus Projetos"
      subtitle="Business Project™ centraliza cada empresa digital, conectando Business DNA™, template, plano, equipe, ambientes e módulos."
    >
      <View style={[styles.hero, compact ? styles.heroCompact : null]}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Business Project™ Core</Text>
          <Text style={styles.heroTitle}>Cada empresa digital começa como um projeto central.</Text>
          <Text style={styles.heroText}>
            Acompanhe status, módulos, timeline, builds e decisões executivas sem conectar backend nesta sprint.
          </Text>
        </View>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/apps/new" as never)}>
            <MaterialCommunityIcons name="plus" size={19} color="#07111f" />
            <Text style={styles.primaryButtonText}>Novo Projeto</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/ai-solution-architect" as never)}>
            <MaterialCommunityIcons name="map-outline" size={19} color="#dbeafe" />
            <Text style={styles.secondaryButtonText}>Criar Blueprint™</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Projetos" value={`${projects.length}`} icon="folder-multiple-outline" />
        <SummaryCard label="Ambientes" value="3" icon="server-outline" />
        <SummaryCard label="Módulos" value="12" icon="view-grid-outline" />
        <SummaryCard label="Modelo" value="Multiempresa" icon="account-supervisor-outline" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Portfólio</Text>
          <Text style={styles.sectionTitle}>Projetos ativos</Text>
        </View>
        <Text style={styles.sectionMeta}>Business Project atual</Text>
      </View>

      {loading ? <ActivityIndicator color="#67e8f9" /> : null}

      <View style={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </View>
    </SaasProductShell>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <View style={styles.summaryCard}>
      <MaterialCommunityIcons name={icon} size={22} color="#67e8f9" />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    maxWidth: 820,
  },
  heroText: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 820,
  },
  heroActions: {
    justifyContent: "center",
    gap: 10,
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 16,
    gap: 7,
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: 25,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  sectionMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  projectCard: {
    flex: 1,
    minWidth: 310,
    maxWidth: 640,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 18,
    gap: 14,
  },
  projectTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.24)",
    backgroundColor: "rgba(8, 145, 178, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  projectStatus: {
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  projectStatusText: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
  },
  projectName: {
    color: "#f8fafc",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  projectDescription: {
    color: "#b6c3d5",
    fontSize: 14,
    lineHeight: 22,
  },
  projectMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaBox: {
    flex: 1,
    minWidth: 130,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 12,
    gap: 4,
  },
  metaLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metaValue: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  progressArea: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
  },
  progressValue: {
    color: "#facc15",
    fontSize: 12,
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
  projectFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.08)",
    paddingTop: 12,
  },
  projectDate: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
});
