import { mockBusinessBlueprint } from "@/src/solution-architect/mock";

export const projectReview = {
  blueprint: mockBusinessBlueprint,
  databaseSuggestion: {
    name: "Postgres multi-tenant com RLS",
    tables: ["tenants", "projects", "users", "modules", "orders", "audit_logs"],
    buckets: ["brand-assets", "project-media", "publication-assets"],
    policy: "RLS obrigatório, service role fora do frontend e logs sem dados sensíveis.",
  },
  flows: [
    "Onboarding SaaS",
    "Escolha de Business DNA™",
    "Seleção de Template",
    "Personalização assistida",
    "Revisão humana",
    "Publicação",
  ],
  permissions: ["Owner", "Admin", "Builder", "Marketing", "Viewer"],
  premiumResources: ["White Label", "Publishing Center™", "Growth Center™", "Data Plane dedicado futuro", "Monitoramento futuro"],
  environment: "Staging",
  estimatedTime: "14 a 24 dias",
  estimatedCost: "R$ 18.000 - R$ 36.000",
};

export const reviewTimeline = [
  { id: "blueprint", title: "Blueprint™ recebido", description: "Arquitetura visual pronta para revisão.", status: "done" },
  { id: "scope", title: "Escopo consolidado", description: "Business DNA™, template e módulos foram organizados.", status: "done" },
  { id: "review", title: "Revisão executiva", description: "Validar custo, prazo, riscos e qualidade.", status: "current" },
  { id: "approval", title: "Aprovação do projeto", description: "Liberação futura para materialização controlada.", status: "next" },
  { id: "build", title: "Build assistido", description: "Etapa futura após aprovação humana.", status: "next" },
  { id: "publish", title: "Publicação", description: "Web, Android e iOS com checklist.", status: "next" },
];

export const reviewChecklist = [
  { id: "business-dna", label: "Business DNA", checked: true },
  { id: "template", label: "Template", checked: true },
  { id: "modules", label: "Módulos", checked: true },
  { id: "database", label: "Banco", checked: false },
  { id: "publishing", label: "Publicação", checked: false },
  { id: "marketing", label: "Marketing", checked: true },
  { id: "website", label: "Website", checked: true },
  { id: "app", label: "Aplicativo", checked: true },
  { id: "panel", label: "Painel", checked: true },
];

export const editActions = [
  { id: "project", label: "Editar Projeto", description: "Ajustar escopo executivo e objetivo." },
  { id: "business-dna", label: "Editar Business DNA", description: "Trocar ou refinar o DNA escolhido." },
  { id: "modules", label: "Editar Módulos", description: "Revisar módulos ativos e opcionais." },
  { id: "plan", label: "Editar Plano", description: "Alterar plano recomendado ou pacote comercial." },
  { id: "branding", label: "Editar Branding", description: "Preparar marca, cores e identidade." },
  { id: "name", label: "Editar Nome", description: "Definir nome comercial da empresa digital." },
];

export const reviewIndicators = [
  { label: "Complexidade", value: 74, tone: "#facc15" },
  { label: "Escalabilidade", value: 86, tone: "#67e8f9" },
  { label: "Custo", value: 68, tone: "#fb7185" },
  { label: "Tempo", value: 72, tone: "#c084fc" },
  { label: "Qualidade", value: 91, tone: "#86efac" },
];

export const futureReviewContract = {
  expectedInputs: ["BusinessBlueprint", "tenant", "ambiente", "plano", "aprovações", "restrições comerciais"],
  expectedOutputs: ["review_status", "approval_record", "change_requests", "build_readiness", "publication_readiness"],
  boundaries: ["Sem IA no frontend", "Sem aprovação automática", "Sem escrita em banco nesta sprint"],
};
