import type { BusinessProject, BusinessProjectModule, BusinessProjectModuleId, BusinessProjectStatus } from "./types";

export const businessProjectModules: BusinessProjectModule[] = [
  {
    id: "overview",
    title: "Visão Geral",
    description: "Resumo executivo, progresso, status e próximas decisões do projeto.",
    icon: "view-dashboard-outline",
    status: "Ativo",
    placeholderHighlights: ["Status do projeto", "Próximas tarefas", "Resumo executivo"],
  },
  {
    id: "business-dna",
    title: "Business DNA™",
    description: "Modelo de negócio, fluxos, módulos e regras base da empresa digital.",
    icon: "dna",
    status: "Ativo",
    placeholderHighlights: ["Nicho aplicado", "Módulos base", "Regras de negócio"],
  },
  {
    id: "app",
    title: "Aplicativo",
    description: "Experiência mobile planejada para clientes, equipe e operação.",
    icon: "cellphone",
    status: "Planejado",
    placeholderHighlights: ["Android", "iOS", "Fluxos principais"],
  },
  {
    id: "website",
    title: "Website",
    description: "Presença web, páginas públicas e estrutura comercial.",
    icon: "web",
    status: "Planejado",
    placeholderHighlights: ["Site institucional", "Landing pages", "SEO inicial"],
  },
  {
    id: "panel",
    title: "Painel",
    description: "Administração operacional, usuários, cadastros, indicadores e gestão.",
    icon: "monitor-dashboard",
    status: "Ativo",
    placeholderHighlights: ["Admin SaaS", "Operação", "Permissões futuras"],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Catálogo, ofertas, pedidos, fornecedores e regras comerciais.",
    icon: "storefront-outline",
    status: "Planejado",
    placeholderHighlights: ["Produtos", "Fornecedores", "Pedidos"],
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Crescimento, campanhas, conteúdo, SEO e páginas de venda.",
    icon: "bullhorn-outline",
    status: "Planejado",
    placeholderHighlights: ["Growth Center™", "Campanhas", "Conteúdo"],
  },
  {
    id: "publishing",
    title: "Publicação",
    description: "Checklist de Web, Android, iOS, assets, políticas e revisão humana.",
    icon: "rocket-launch-outline",
    status: "Pendente",
    placeholderHighlights: ["Web", "Android", "iOS"],
  },
  {
    id: "ai",
    title: "IA",
    description: "Área futura para recomendações, personalização e geração assistida.",
    icon: "creation",
    status: "Planejado",
    placeholderHighlights: ["Consultoria IA", "AI Builder™", "Aprovação humana"],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Indicadores de uso, crescimento, builds, funil e operação.",
    icon: "chart-line",
    status: "Pendente",
    placeholderHighlights: ["Métricas", "Funil", "Saúde do projeto"],
  },
  {
    id: "team",
    title: "Equipe",
    description: "Multiusuário, papéis, convites e responsabilidade por área.",
    icon: "account-group-outline",
    status: "Ativo",
    placeholderHighlights: ["Owner", "Admins", "Convidados"],
  },
  {
    id: "settings",
    title: "Configurações",
    description: "Ambiente, tenant, branding, versionamento e preferências do projeto.",
    icon: "cog-outline",
    status: "Planejado",
    placeholderHighlights: ["Multiempresa", "Multiambiente", "White Label"],
  },
];

export const businessProjectStatusLabels: Record<BusinessProjectStatus, string> = {
  draft: "Rascunho",
  planning: "Planejamento",
  in_progress: "Em construção",
  review: "Revisão",
  published: "Publicado",
};

export const businessProjects: BusinessProject[] = [
  {
    id: "bp-clinica-premium",
    name: "Clínica Prime Digital",
    slug: "clinica-prime-digital",
    businessDnaSlug: "clinica",
    businessDnaName: "Clínica DNA™",
    templateSlug: "clinica-premium",
    templateName: "Clínica Premium",
    plan: "Premium",
    status: "in_progress",
    createdAtLabel: "12 Jun 2026",
    updatedAtLabel: "Hoje",
    version: "v0.4.0",
    companyName: "Clínica Prime",
    tenantLabel: "tenant_clinica_prime",
    environment: "Staging",
    team: [
      { id: "tm-1", name: "Ana Martins", role: "Owner", status: "Ativo" },
      { id: "tm-2", name: "Equipe Casa Mineira", role: "Builder", status: "Ativo" },
      { id: "tm-3", name: "Consultor Growth", role: "Marketing", status: "Convidado" },
    ],
    modules: businessProjectModules,
    nextTasks: [
      { id: "task-1", title: "Validar agenda e especialidades", owner: "Ana Martins", dueLabel: "Hoje", status: "Em andamento" },
      { id: "task-2", title: "Revisar páginas de serviço", owner: "Equipe Casa Mineira", dueLabel: "Amanhã", status: "Pendente" },
      { id: "task-3", title: "Confirmar checklist LGPD", owner: "Builder", dueLabel: "2 dias", status: "Revisão" },
    ],
    timeline: [
      { id: "created", label: "Projeto criado", description: "Estrutura inicial registrada no Business Project™.", status: "done" },
      { id: "template", label: "Template escolhido", description: "Clínica Premium selecionado como ponto de partida.", status: "done" },
      { id: "dna", label: "Business DNA aplicado", description: "Clínica DNA™ conectado ao planejamento visual.", status: "done" },
      { id: "ai", label: "IA iniciada", description: "Consultoria IA preparada para próxima integração.", status: "current" },
      { id: "customization", label: "Personalização", description: "Ajuste de módulos, marca e conteúdo.", status: "next" },
      { id: "publishing", label: "Publicação", description: "Checklist Web, Android e iOS após aprovação humana.", status: "next" },
    ],
    builds: [
      { id: "build-web", channel: "Web", status: "Em andamento", version: "0.4.0" },
      { id: "build-android", channel: "Android", status: "Planejado", version: "0.3.0" },
      { id: "build-ios", channel: "iOS", status: "Planejado", version: "0.3.0" },
    ],
    executiveSummary: {
      health: "Projeto saudável, com base premium definida e escopo controlado.",
      goal: "Entregar uma clínica digital pronta para operar agenda, serviços e relacionamento.",
      risk: "Publicação depende de validação de conteúdo, políticas e aprovação humana.",
      nextDecision: "Confirmar módulos essenciais antes da personalização assistida.",
    },
  },
  {
    id: "bp-marketplace-local",
    name: "Marketplace Local Pro",
    slug: "marketplace-local-pro",
    businessDnaSlug: "servicos-locais",
    businessDnaName: "Serviços Locais DNA™",
    templateSlug: "servicos-locais",
    templateName: "Serviços Locais",
    plan: "Professional",
    status: "planning",
    createdAtLabel: "18 Jun 2026",
    updatedAtLabel: "Ontem",
    version: "v0.2.0",
    companyName: "Rede Local",
    tenantLabel: "tenant_rede_local",
    environment: "Sandbox",
    team: [
      { id: "tm-4", name: "Carlos Lima", role: "Owner", status: "Ativo" },
      { id: "tm-5", name: "Operação", role: "Admin", status: "Convidado" },
    ],
    modules: businessProjectModules,
    nextTasks: [
      { id: "task-4", title: "Definir categorias de serviços", owner: "Carlos Lima", dueLabel: "Hoje", status: "Pendente" },
      { id: "task-5", title: "Escolher regras de comissão", owner: "Operação", dueLabel: "3 dias", status: "Pendente" },
    ],
    timeline: [
      { id: "created", label: "Projeto criado", description: "Ideia registrada no Business Project™.", status: "done" },
      { id: "template", label: "Template escolhido", description: "Serviços Locais selecionado.", status: "current" },
      { id: "dna", label: "Business DNA aplicado", description: "Modelo de serviços será revisado.", status: "next" },
      { id: "ai", label: "IA iniciada", description: "Consultoria futura para categorias e módulos.", status: "next" },
      { id: "customization", label: "Personalização", description: "Fluxos e identidade serão definidos.", status: "next" },
      { id: "publishing", label: "Publicação", description: "Publicação ainda não planejada.", status: "next" },
    ],
    builds: [
      { id: "build-web", channel: "Web", status: "Planejado", version: "0.2.0" },
      { id: "build-android", channel: "Android", status: "Planejado", version: "0.1.0" },
    ],
    executiveSummary: {
      health: "Planejamento inicial com escopo aberto.",
      goal: "Criar um marketplace local com fornecedores, pedidos e painel de operação.",
      risk: "Regras comerciais e monetização ainda precisam ser decididas.",
      nextDecision: "Escolher categorias principais e modelo de comissão.",
    },
  },
];

export function findBusinessProjectById(id: string | string[] | undefined) {
  const normalized = Array.isArray(id) ? id[0] : id;
  return businessProjects.find((project) => project.id === normalized || project.slug === normalized) ?? businessProjects[0];
}

export function findBusinessProjectModule(id: string | string[] | undefined) {
  const normalized = Array.isArray(id) ? id[0] : id;
  return businessProjectModules.find((module) => module.id === normalized) ?? businessProjectModules[0];
}

export function getProjectProgress(project: BusinessProject) {
  const doneItems = project.timeline.filter((item) => item.status === "done").length;
  return Math.round((doneItems / project.timeline.length) * 100);
}

export const projectPreparedCapabilities = ["Multiempresa", "Multiambiente", "Multiusuário", "White Label", "Aprovação humana"];

export const projectModuleOrder: BusinessProjectModuleId[] = businessProjectModules.map((module) => module.id);
