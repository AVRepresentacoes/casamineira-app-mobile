import { SaasProductShell } from "@/components/saas/SaasProductShell";
import {
  architectBusinessDnaOptions,
  architectModuleOptions,
  architectSteps,
  architectTemplateOptions,
  mockBusinessBlueprint,
  placeholderIdea,
} from "@/src/solution-architect/mock";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

type StepId = (typeof architectSteps)[number]["id"];

export default function AiSolutionArchitectScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 980;
  const [activeStep, setActiveStep] = useState<StepId>("idea");
  const [idea, setIdea] = useState(placeholderIdea);
  const [selectedDna, setSelectedDna] = useState(architectBusinessDnaOptions[3]);
  const [selectedTemplate, setSelectedTemplate] = useState(architectTemplateOptions[3]);
  const [selectedModules, setSelectedModules] = useState(() => architectModuleOptions.filter((module) => module.selected).map((module) => module.id));

  const activeIndex = useMemo(() => architectSteps.findIndex((step) => step.id === activeStep), [activeStep]);
  const selectedModuleRecords = architectModuleOptions.filter((module) => selectedModules.includes(module.id));

  function toggleModule(moduleId: string) {
    setSelectedModules((current) => (current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]));
  }

  function goNext() {
    const next = architectSteps[Math.min(activeIndex + 1, architectSteps.length - 1)];
    setActiveStep(next.id);
  }

  return (
    <SaasProductShell
      title="AI Solution Architect™"
      subtitle="Transforme uma ideia em um Project Blueprint™ visual, revisável e preparado para integração futura com IA backend-only."
    >
      <View style={[styles.hero, compact ? styles.heroCompact : null]}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Project Blueprint™</Text>
          <Text style={styles.heroTitle}>Arquitetura de solução antes da geração.</Text>
          <Text style={styles.heroText}>
            Esta experiência organiza ideia, Business DNA™, template e módulos em um blueprint estratégico sem executar nenhum modelo de IA.
          </Text>
        </View>
        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color="#facc15" />
          <Text style={styles.heroCardTitle}>Sprint visual</Text>
          <Text style={styles.heroCardText}>Sem backend, sem prompts reais, sem chamadas externas.</Text>
        </View>
      </View>

      <View style={styles.stepper}>
        {architectSteps.map((step, index) => {
          const active = step.id === activeStep;
          const done = index < activeIndex;
          return (
            <Pressable key={step.id} style={[styles.stepChip, active ? styles.stepChipActive : null]} onPress={() => setActiveStep(step.id)}>
              <View style={[styles.stepNumber, active || done ? styles.stepNumberActive : null]}>
                <Text style={[styles.stepNumberText, active || done ? styles.stepNumberTextActive : null]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepChipText, active ? styles.stepChipTextActive : null]}>{step.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.layout, compact ? styles.layoutCompact : null]}>
        <View style={styles.mainColumn}>
          {activeStep === "idea" ? (
            <View style={styles.panel}>
              <StepHeader eyebrow="Passo 1" title="Qual é sua ideia?" />
              <TextInput value={idea} onChangeText={setIdea} multiline style={styles.ideaInput} placeholderTextColor="#64748b" />
              <Text style={styles.helperText}>Descreva público, problema, canal de venda, operação desejada e objetivos comerciais.</Text>
            </View>
          ) : null}

          {activeStep === "dna" ? (
            <View style={styles.panel}>
              <StepHeader eyebrow="Passo 2" title="Selecionar Business DNA™" />
              <View style={styles.optionGrid}>
                {architectBusinessDnaOptions.map((dna) => {
                  const active = selectedDna.slug === dna.slug;
                  return (
                    <Pressable key={dna.slug} style={[styles.optionCard, active ? styles.optionCardActive : null]} onPress={() => setSelectedDna(dna)}>
                      <MaterialCommunityIcons name="dna" size={25} color={active ? "#07111f" : "#67e8f9"} />
                      <Text style={[styles.optionTitle, active ? styles.optionTitleActive : null]}>{dna.name}</Text>
                      <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>{dna.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {activeStep === "template" ? (
            <View style={styles.panel}>
              <StepHeader eyebrow="Passo 3" title="Selecionar Template" />
              <View style={styles.optionGrid}>
                {architectTemplateOptions.map((template) => {
                  const active = selectedTemplate.slug === template.slug;
                  return (
                    <Pressable key={template.slug} style={[styles.optionCard, active ? styles.optionCardActive : null]} onPress={() => setSelectedTemplate(template)}>
                      <MaterialCommunityIcons name="shape-outline" size={25} color={active ? "#07111f" : "#facc15"} />
                      <Text style={[styles.optionTitle, active ? styles.optionTitleActive : null]}>{template.name}</Text>
                      <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>{template.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {activeStep === "modules" ? (
            <View style={styles.panel}>
              <StepHeader eyebrow="Passo 4" title="Escolher módulos desejados" />
              <View style={styles.moduleGrid}>
                {architectModuleOptions.map((module) => {
                  const active = selectedModules.includes(module.id);
                  return (
                    <Pressable key={module.id} style={[styles.moduleCard, active ? styles.moduleCardActive : null]} onPress={() => toggleModule(module.id)}>
                      <View style={[styles.moduleIcon, active ? styles.moduleIconActive : null]}>
                        <MaterialCommunityIcons name={module.icon} size={24} color={active ? "#07111f" : "#dbeafe"} />
                      </View>
                      <Text style={[styles.moduleTitle, active ? styles.moduleTitleActive : null]}>{module.name}</Text>
                      <Text style={styles.moduleCategory}>{module.category}</Text>
                      <Text style={[styles.moduleText, active ? styles.moduleTextActive : null]}>{module.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {activeStep === "blueprint" ? (
            <BlueprintView idea={idea} dnaName={selectedDna.name} templateName={selectedTemplate.name} modules={selectedModuleRecords} />
          ) : null}

          {activeStep === "blueprint" ? (
            <View style={styles.footerBar}>
              <View>
                <Text style={styles.footerTitle}>Blueprint™ pronto para revisão</Text>
                <Text style={styles.footerText}>Avance para validar escopo, custo, prazo e checklist.</Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={() => router.push("/project-review" as never)}>
                <Text style={styles.primaryButtonText}>Revisar Projeto</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#07111f" />
              </Pressable>
            </View>
          ) : null}

          {activeStep !== "blueprint" ? (
            <View style={styles.footerBar}>
              <View>
                <Text style={styles.footerTitle}>Fluxo visual preparado</Text>
                <Text style={styles.footerText}>Avance para gerar o Blueprint™ mockado.</Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={goNext}>
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#07111f" />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.sidePanel, compact ? styles.sidePanelCompact : null]}>
          <Text style={styles.sideEyebrow}>Resumo da arquitetura</Text>
          <Text style={styles.sideTitle}>Configuração atual</Text>
          <SummaryItem label="Ideia" value={idea} />
          <SummaryItem label="Business DNA™" value={selectedDna.name} />
          <SummaryItem label="Template" value={selectedTemplate.name} />
          <SummaryItem label="Módulos" value={`${selectedModules.length} selecionados`} />
          <View style={styles.sideNote}>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#facc15" />
            <Text style={styles.sideNoteText}>Preparado para IA backend-only, sem integração nesta sprint.</Text>
          </View>
        </View>
      </View>
    </SaasProductShell>
  );
}

function StepHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
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

function BlueprintView({ idea, dnaName, templateName, modules }: { idea: string; dnaName: string; templateName: string; modules: typeof architectModuleOptions }) {
  const blueprint = mockBusinessBlueprint;

  return (
    <View style={styles.blueprint}>
      <View style={styles.blueprintHero}>
        <Text style={styles.kicker}>Passo 5</Text>
        <Text style={styles.blueprintTitle}>Gerar Blueprint™</Text>
        <Text style={styles.blueprintText}>{blueprint.executiveSummary}</Text>
      </View>

      <View style={styles.blueprintGrid}>
        <BlueprintBlock title="Resumo Executivo" items={[blueprint.executiveSummary]} icon="file-document-outline" />
        <BlueprintBlock title="Business DNA" items={[dnaName]} icon="dna" />
        <BlueprintBlock title="Objetivo" items={[blueprint.objective]} icon="target" />
        <BlueprintBlock title="Plano recomendado" items={[blueprint.recommendedPlan]} icon="crown-outline" />
      </View>

      <View style={styles.panel}>
        <StepHeader eyebrow="Arquitetura" title={blueprint.architecture.pattern} />
        <View style={styles.architectureGrid}>
          <ArchitectureColumn title="Frontend" items={blueprint.architecture.frontend} />
          <ArchitectureColumn title="Backend" items={blueprint.architecture.backend} />
          <ArchitectureColumn title="Dados" items={blueprint.architecture.data} />
          <ArchitectureColumn title="Segurança" items={blueprint.architecture.security} />
          <ArchitectureColumn title="Publicação" items={blueprint.architecture.publishing} />
        </View>
      </View>

      <View style={styles.panel}>
        <StepHeader eyebrow="Módulos" title={`${modules.length} módulos selecionados`} />
        <View style={styles.compactGrid}>
          {modules.map((module) => (
            <View key={module.id} style={styles.compactCard}>
              <MaterialCommunityIcons name={module.icon} size={20} color="#67e8f9" />
              <Text style={styles.compactTitle}>{module.name}</Text>
              <Text style={styles.compactText}>{module.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.blueprintGrid}>
        <BlueprintBlock title="Integrações" items={blueprint.integrations} icon="transit-connection-variant" />
        <BlueprintBlock title="Recursos" items={blueprint.resources} icon="toolbox-outline" />
        <BlueprintBlock title="Builds previstos" items={blueprint.plannedBuilds} icon="hammer-wrench" />
        <BlueprintBlock title="Publicações previstas" items={blueprint.plannedPublications} icon="rocket-launch-outline" />
      </View>

      <View style={styles.panel}>
        <StepHeader eyebrow="Cronograma" title="Fases sugeridas" />
        {blueprint.schedule.map((item) => (
          <View key={item.phase} style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineTitle}>{item.phase}</Text>
              <Text style={styles.timelineText}>{item.deliverable}</Text>
            </View>
            <Text style={styles.timelineDuration}>{item.duration}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <StepHeader eyebrow="Equipe sugerida" title={`Template: ${templateName}`} />
        <Text style={styles.ideaPreview}>{idea}</Text>
        <View style={styles.compactGrid}>
          {blueprint.suggestedTeam.map((member) => (
            <View key={member.role} style={styles.compactCard}>
              <Text style={styles.compactTitle}>{member.role}</Text>
              <Text style={styles.compactText}>{member.responsibility}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function BlueprintBlock({ title, items, icon }: { title: string; items: string[]; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <View style={styles.blueprintBlock}>
      <MaterialCommunityIcons name={icon} size={22} color="#facc15" />
      <Text style={styles.blueprintBlockTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.blueprintBlockText}>{item}</Text>
      ))}
    </View>
  );
}

function ArchitectureColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.architectureColumn}>
      <Text style={styles.architectureTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.architectureItem}>
          <MaterialCommunityIcons name="check" size={13} color="#86efac" />
          <Text style={styles.architectureText}>{item}</Text>
        </View>
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
  heroCard: {
    width: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.24)",
    backgroundColor: "rgba(113, 63, 18, 0.16)",
    padding: 16,
    gap: 8,
  },
  heroCardTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  heroCardText: {
    color: "#fef3c7",
    fontSize: 12,
    lineHeight: 18,
  },
  stepper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.9)",
    padding: 12,
  },
  stepChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepChipActive: {
    backgroundColor: "rgba(103, 232, 249, 0.16)",
    borderColor: "rgba(103, 232, 249, 0.4)",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberActive: {
    backgroundColor: "#67e8f9",
  },
  stepNumberText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "900",
  },
  stepNumberTextActive: {
    color: "#07111f",
  },
  stepChipText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
  },
  stepChipTextActive: {
    color: "#e0f2fe",
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
    gap: 14,
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 5,
  },
  ideaInput: {
    minHeight: 210,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.14)",
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    color: "#f8fafc",
    padding: 15,
    fontSize: 15,
    lineHeight: 23,
  },
  helperText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 16,
    gap: 9,
  },
  optionCardActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  optionTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  optionTitleActive: {
    color: "#07111f",
  },
  optionText: {
    color: "#b6c3d5",
    fontSize: 13,
    lineHeight: 20,
  },
  optionTextActive: {
    color: "#1e293b",
    fontWeight: "700",
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
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 15,
    gap: 8,
  },
  moduleCardActive: {
    borderColor: "rgba(103, 232, 249, 0.42)",
    backgroundColor: "rgba(8, 145, 178, 0.16)",
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  moduleIconActive: {
    backgroundColor: "#67e8f9",
  },
  moduleTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  moduleTitleActive: {
    color: "#e0f2fe",
  },
  moduleCategory: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  moduleText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  moduleTextActive: {
    color: "#cbd5e1",
  },
  footerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 16,
  },
  footerTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 3,
  },
  primaryButton: {
    minHeight: 44,
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
  summaryItem: {
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.08)",
    paddingTop: 12,
    gap: 5,
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
  sideNote: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "rgba(113, 63, 18, 0.18)",
    padding: 12,
  },
  sideNoteText: {
    flex: 1,
    color: "#fde68a",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  blueprint: {
    gap: 16,
  },
  blueprintHero: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.18)",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    padding: 22,
    gap: 10,
  },
  blueprintTitle: {
    color: "#f8fafc",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
  },
  blueprintText: {
    color: "#b6c3d5",
    fontSize: 15,
    lineHeight: 24,
  },
  blueprintGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  blueprintBlock: {
    flex: 1,
    minWidth: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(10, 14, 26, 0.94)",
    padding: 16,
    gap: 8,
  },
  blueprintBlockTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  blueprintBlockText: {
    color: "#b6c3d5",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
  },
  architectureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  architectureColumn: {
    flex: 1,
    minWidth: 180,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 8,
  },
  architectureTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  architectureItem: {
    flexDirection: "row",
    gap: 7,
    alignItems: "flex-start",
  },
  architectureText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
  },
  compactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  compactCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 14,
    gap: 8,
  },
  compactTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  compactText: {
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
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#67e8f9",
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
  timelineDuration: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "900",
  },
  ideaPreview: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
});
