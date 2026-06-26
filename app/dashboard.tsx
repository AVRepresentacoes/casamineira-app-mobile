import { BrandLogo } from "@/components/brand/BrandLogo";
import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { listAiFactoryAgentLogs, listAiFactoryRuns, type AiFactoryRun } from "@/lib/ai-factory";
import { getPublicSaasPlans } from "@/lib/saas-growth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  const [runs, setRuns] = useState<AiFactoryRun[]>([]);
  const [plansCount, setPlansCount] = useState(0);
  const [agentsCount, setAgentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          const [runsData, plansData] = await Promise.all([
            listAiFactoryRuns().catch(() => []),
            getPublicSaasPlans().catch(() => []),
          ]);
          const latestRunId = runsData[0]?.id || null;
          const logs = latestRunId ? await listAiFactoryAgentLogs(latestRunId).catch(() => []) : [];
          if (!active) return;
          setRuns(runsData);
          setPlansCount(plansData.length);
          setAgentsCount(logs.length || 30);
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

  return (
    <SaasProductShell
      title="Dashboard SaaS"
      subtitle="Área principal da Casa Mineira SaaS para transformar ideias em empresas digitais com Business DNA™, templates, IA assistida, projetos e revisão humana."
    >
      {loading ? <ActivityIndicator color="#facc15" /> : null}

      <View style={styles.heroGrid}>
        <View style={styles.primaryPanel}>
          <BrandLogo size="small" showText={false} />
          <Text style={styles.panelEyebrow}>Próxima ação</Text>
          <Text style={styles.panelTitle}>Comece uma empresa digital no Business Studio™.</Text>
          <Text style={styles.panelBody}>
            Escolha um modelo, revise o Business DNA™, explore templates premium e avance para consultoria, arquitetura e revisão do projeto.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/apps/new")}>
            <Ionicons name="sparkles-outline" size={18} color="#08101c" />
            <Text style={styles.primaryButtonText}>Criar novo projeto</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Projetos IA legados" value={String(runs.length)} icon="apps-outline" />
          <StatCard label="Blueprints visuais" value="1" icon="map-outline" />
          <StatCard label="Agentes preparados" value={String(agentsCount || 30)} icon="git-network-outline" />
          <StatCard label="Planos ativos" value={String(plansCount)} icon="card-outline" />
        </View>
      </View>

      <View style={styles.sectionGrid}>
        <ActionCard title="Business Studio™" body="Inicie a criação visual de uma empresa digital." icon="construct-outline" onPress={() => router.push("/apps/new")} />
        <ActionCard title="Business DNA™" body="Escolha modelos inteligentes por nicho de negócio." icon="git-network-outline" onPress={() => router.push("/business-dna")} />
        <ActionCard title="Marketplace" body="Explore templates premium prontos para acelerar o projeto." icon="storefront-outline" onPress={() => router.push("/marketplace")} />
        <ActionCard title="AI Business Consultant™" body="Simule recomendações de DNA, templates e próximos passos." icon="chatbubbles-outline" onPress={() => router.push("/ai-business-consultant")} />
        <ActionCard title="Meus Projetos" body="Acesse o Business Project™ e seus módulos principais." icon="folder-open-outline" onPress={() => router.push("/projects")} />
        <ActionCard title="AI Solution Architect™" body="Monte o Project Blueprint™ visual antes da revisão." icon="map-outline" onPress={() => router.push("/ai-solution-architect")} />
        <ActionCard title="Project Review Center™" body="Revise arquitetura, checklist, custo, tempo e aprovação." icon="checkmark-done-outline" onPress={() => router.push("/project-review")} />
      </View>
    </SaasProductShell>
  );
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
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#facc15",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#08101c",
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
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: 300,
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
