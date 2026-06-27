import { BrandLogo } from "@/components/brand/BrandLogo";
import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { listAiFactoryAgentLogs, listAiFactoryRuns, type AiFactoryRun } from "@/lib/ai-factory";
import { getPublicSaasPlans } from "@/lib/saas-growth";
import { BusinessProjectService } from "@/services/business-project";
import { ensureSaasOnboarding } from "@/services/onboarding";
import { businessProjectStatusLabels, getProjectProgress } from "@/src/business-project/mock";
import type { BusinessProject } from "@/src/business-project/types";
import { premiumTemplates } from "@/src/template-marketplace/catalog";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  // TODO(Enterprise 008): consumir useDigitalCompany() quando o provider for registrado no layout autenticado.
  const { empresa, assinaturaSaas, loadingEmpresa } = useEmpresa();
  const [runs, setRuns] = useState<AiFactoryRun[]>([]);
  const [plansCount, setPlansCount] = useState(0);
  const [agentsCount, setAgentsCount] = useState(0);
  const [project, setProject] = useState<BusinessProject | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          await ensureSaasOnboarding().catch((error) => {
            console.log("DASHBOARD ONBOARDING WARNING:", error);
          });
          const [runsData, plansData, currentProject] = await Promise.all([
            listAiFactoryRuns().catch(() => []),
            getPublicSaasPlans().catch(() => []),
            BusinessProjectService.getCurrent().catch(() => null),
          ]);
          const latestRunId = runsData[0]?.id || null;
          const logs = latestRunId ? await listAiFactoryAgentLogs(latestRunId).catch(() => []) : [];
          if (!active) return;
          setRuns(runsData);
          setPlansCount(plansData.length);
          setAgentsCount(logs.length || 30);
          setProject(currentProject);
        } finally {
          if (active) setLoading(false);
        }
      }

      void load();
      return () => {
        active = false;
      };
    }, []),
  );

  const latestRun = runs[0] || null;
  const progress = project ? getProjectProgress(project) : 0;
  const activeModules = project?.modules.filter((module) => module.status === "Ativo").length || 0;
  const readyDeploys = project?.builds.filter((build) => build.status === "Pronto").length || 0;
  const recommendedTemplates = useMemo(() => premiumTemplates.filter((template) => template.isBestSeller).slice(0, 3), []);
  const loadingState = loading || loadingEmpresa;

  const companyName = empresa?.nome_exibicao || empresa?.nome || project?.companyName || "Casa Mineira SaaS";
  const planLabel = assinaturaSaas?.plano_nome || project?.plan || "Starter";
  const companyStatus = empresa?.ativa ? "Ativa" : "Aguardando validação";
  const ownerLabel = empresa?.role ? empresa.role.toUpperCase() : "OWNER";
  const tenantLabel = empresa?.tenant_slug || empresa?.slug || project?.tenantLabel || "tenant padrão";
  const projectStatus = project ? businessProjectStatusLabels[project.status] : "Sem projeto carregado";
  const aiUsage = formatUsage(latestRun);
  const aiCost = formatCurrency(latestRun?.estimated_cost_brl || 0);

  return (
    <SaasProductShell
      title="Business Operating Center™"
      subtitle="Centro de operações da empresa digital: empresa, projeto, IA, publicações, marketplace, analytics, receita e próximas decisões em um só lugar."
    >
      {loadingState ? <ActivityIndicator color="#facc15" /> : null}

      <View style={styles.heroGrid}>
        <View style={styles.primaryPanel}>
          <BrandLogo size="small" showText={false} />
          <Text style={styles.panelEyebrow}>Centro de operação</Text>
          <Text style={styles.panelTitle}>Controle sua empresa digital a partir do Business Project™.</Text>
          <Text style={styles.panelBody}>
            Acompanhe tenant, plano, projeto atual, IA trabalhando, publicações e próximas ações sem sair do painel principal.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/business-studio")}>
              <Ionicons name="sparkles-outline" size={18} color="#08101c" />
              <Text style={styles.primaryButtonText}>Abrir Business Studio</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.push("/projects")}>
              <Ionicons name="folder-open-outline" size={18} color="#f8fafc" />
              <Text style={styles.secondaryButtonText}>Ver Business Project</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Projetos" value={project ? "1" : "0"} icon="briefcase-outline" />
          <StatCard label="Módulos ativos" value={String(activeModules)} icon="cube-outline" />
          <StatCard label="Agentes preparados" value={String(agentsCount || 30)} icon="git-network-outline" />
          <StatCard label="Planos disponíveis" value={String(plansCount)} icon="card-outline" />
        </View>
      </View>

      <View style={styles.operatingGrid}>
        <InfoPanel title="Empresa Atual" icon="business-outline">
          <DataRow label="Nome" value={companyName} />
          <DataRow label="Plano" value={planLabel} />
          <DataRow label="Status" value={companyStatus} />
          <DataRow label="Owner" value={ownerLabel} />
          <DataRow label="Tenant" value={tenantLabel} />
        </InfoPanel>

        <InfoPanel title="Business Project Atual" icon="layers-outline">
          <DataRow label="Nome" value={project?.name || "Projeto inicial"} />
          <DataRow label="Business DNA" value={project?.businessDnaName || "Serviços Locais DNA™"} />
          <DataRow label="Template" value={project?.templateName || "Template em definição"} />
          <DataRow label="Status" value={projectStatus} />
          <ProgressBar label="Progresso" value={progress} />
        </InfoPanel>

        <InfoPanel title="IA Trabalhando" icon="sparkles-outline">
          <DataRow label="AI Copilot" value="Pronto para orientar próximas ações" />
          <DataRow label="AI Workforce" value={`${agentsCount || 30} agentes preparados`} />
          <DataRow label="Última execução" value={latestRun ? latestRun.status : "Sem execução recente"} />
          <DataRow label="Próxima ação" value={project?.executiveSummary.nextDecision || "Escolher Business DNA™"} />
        </InfoPanel>

        <InfoPanel title="Publicações" icon="rocket-outline">
          <PublicationItem label="Android" status={getBuildStatus(project, "Android")} />
          <PublicationItem label="iOS" status={getBuildStatus(project, "iOS")} />
          <PublicationItem label="Website" status={getBuildStatus(project, "Web")} />
          <PublicationItem label="Admin" status={getAdminStatus(project)} />
        </InfoPanel>

        <InfoPanel title="Marketplace" icon="storefront-outline">
          <DataRow label="Templates adquiridos" value={project?.templateName ? "1" : "0"} />
          <DataRow label="Template atual" value={project?.templateName || "Não selecionado"} />
          <View style={styles.templateStack}>
            {recommendedTemplates.map((template) => (
              <View key={template.id} style={styles.templatePill}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>{template.badge}</Text>
              </View>
            ))}
          </View>
        </InfoPanel>

        <InfoPanel title="Analytics" icon="analytics-outline">
          <View style={styles.metricGrid}>
            <MiniMetric label="Projetos" value={project ? "1" : "0"} />
            <MiniMetric label="Usuários" value={String(project?.team.length || 1)} />
            <MiniMetric label="Aplicativos" value={String(project?.builds.length || 0)} />
            <MiniMetric label="Deploys" value={String(readyDeploys)} />
          </View>
        </InfoPanel>

        <InfoPanel title="Receita" icon="cash-outline">
          <DataRow label="Plano" value={planLabel} />
          <DataRow label="Status assinatura" value={assinaturaSaas?.assinatura_status || "Trial / pendente"} />
          <DataRow label="Uso IA" value={aiUsage} />
          <DataRow label="Custo IA" value={aiCost} />
        </InfoPanel>

        <InfoPanel title="Próximas Ações" icon="flag-outline">
          <View style={styles.nextActions}>
            {(project?.nextTasks || defaultNextTasks).slice(0, 3).map((task) => (
              <Pressable key={task.id} style={styles.nextActionCard} onPress={() => router.push("/project-review")}>
                <Text style={styles.nextActionStatus}>{task.status}</Text>
                <Text style={styles.nextActionTitle}>{task.title}</Text>
                <Text style={styles.nextActionMeta}>{task.owner} · {task.dueLabel}</Text>
              </Pressable>
            ))}
          </View>
        </InfoPanel>
      </View>

      <View style={styles.sectionGrid}>
        <ActionCard title="Business Studio™" body="Editar o projeto empresarial atual." icon="construct-outline" onPress={() => router.push("/business-studio")} />
        <ActionCard title="Business DNA™" body="Revisar o modelo de negócio aplicado." icon="git-network-outline" onPress={() => router.push("/business-dna")} />
        <ActionCard title="Marketplace" body="Selecionar templates recomendados." icon="storefront-outline" onPress={() => router.push("/marketplace")} />
        <ActionCard title="AI Solution Architect™" body="Atualizar o Project Blueprint™." icon="map-outline" onPress={() => router.push("/ai-solution-architect")} />
        <ActionCard title="Project Review Center™" body="Aprovar arquitetura, custo e publicação." icon="checkmark-done-outline" onPress={() => router.push("/project-review")} />
      </View>
    </SaasProductShell>
  );
}

const defaultNextTasks = [
  { id: "next-dna", title: "Confirmar Business DNA™", owner: "Owner", dueLabel: "Hoje", status: "Pendente" },
  { id: "next-template", title: "Selecionar Template Premium", owner: "Casa Mineira SaaS", dueLabel: "Hoje", status: "Pendente" },
  { id: "next-review", title: "Aprovar Blueprint™", owner: "Equipe", dueLabel: "Próxima etapa", status: "Revisão" },
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatUsage(run: AiFactoryRun | null) {
  if (!run?.usage) return "0 tokens";
  const input = Number(run.usage.input_tokens || run.usage.prompt_tokens || 0);
  const output = Number(run.usage.output_tokens || run.usage.completion_tokens || 0);
  const total = Number(run.usage.total_tokens || input + output || 0);
  return `${total.toLocaleString("pt-BR")} tokens`;
}

function getBuildStatus(project: BusinessProject | null, channel: "Android" | "iOS" | "Web") {
  return project?.builds.find((build) => build.channel === channel)?.status || "Planejado";
}

function getAdminStatus(project: BusinessProject | null) {
  return project?.modules.find((module) => module.id === "panel")?.status || "Planejado";
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color="#22d3ee" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoPanel({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  return (
    <View style={styles.infoPanel}>
      <View style={styles.infoHeader}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={18} color="#facc15" />
        </View>
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={styles.dataValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(value, 100))}%` }]} />
      </View>
    </View>
  );
}

function PublicationItem({ label, status }: { label: string; status: string }) {
  return (
    <View style={styles.publicationItem}>
      <Text style={styles.publicationLabel}>{label}</Text>
      <Text style={styles.publicationStatus}>{status}</Text>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMetric}>
      <Text style={styles.miniMetricValue}>{value}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ title, body, icon, onPress }: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color="#08101c" />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  primaryPanel: {
    flex: 1.2,
    minWidth: 340,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.36)",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    padding: 24,
    gap: 14,
  },
  panelEyebrow: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  panelBody: {
    color: "#e2e8f0",
    lineHeight: 24,
    maxWidth: 720,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#facc15",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  secondaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 250, 252, 0.18)",
    backgroundColor: "rgba(248, 250, 252, 0.08)",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  statsGrid: {
    flex: 1,
    minWidth: 320,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 16,
    gap: 8,
  },
  statValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  operatingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoPanel: {
    flex: 1,
    minWidth: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.88)",
    padding: 18,
    gap: 12,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  dataLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  dataValue: {
    flex: 1,
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#22d3ee",
  },
  publicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  publicationLabel: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  publicationStatus: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "900",
  },
  templateStack: {
    gap: 8,
  },
  templatePill: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.2)",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    padding: 10,
    gap: 2,
  },
  templateName: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  templateMeta: {
    color: "#67e8f9",
    fontSize: 11,
    fontWeight: "800",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  miniMetric: {
    flex: 1,
    minWidth: 110,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    padding: 12,
    gap: 4,
  },
  miniMetricValue: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  miniMetricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
  },
  nextActions: {
    gap: 10,
  },
  nextActionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.22)",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    padding: 12,
    gap: 5,
  },
  nextActionStatus: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextActionTitle: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  nextActionMeta: {
    color: "#a8b5c7",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 20,
    gap: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#22d3ee",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  actionBody: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
});
