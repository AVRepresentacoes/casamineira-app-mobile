import type { BusinessBlueprint, BusinessModule } from "./types";

export const architectSteps = [
  { id: "idea", label: "Ideia", title: "Qual é sua ideia?" },
  { id: "dna", label: "Business DNA™", title: "Selecionar Business DNA™" },
  { id: "template", label: "Template", title: "Selecionar Template" },
  { id: "modules", label: "Módulos", title: "Escolher módulos desejados" },
  { id: "blueprint", label: "Blueprint™", title: "Gerar Blueprint™" },
];

export const architectBusinessDnaOptions = [
  { slug: "clinica", name: "Clínica DNA™", description: "Agenda, pacientes, serviços, equipe e relacionamento." },
  { slug: "restaurante", name: "Restaurante DNA™", description: "Cardápio, pedidos, delivery, mesas e fidelidade." },
  { slug: "marketplace", name: "Marketplace DNA™", description: "Vendedores, catálogo, pedidos, comissões e operação." },
  { slug: "servicos-locais", name: "Serviços Locais DNA™", description: "Profissionais, solicitações, propostas e reputação." },
];

export const architectTemplateOptions = [
  { slug: "clinica-premium", name: "Clínica Premium", description: "Template premium para operação de saúde e agendamento." },
  { slug: "restaurante-delivery", name: "Restaurante Delivery", description: "Base para pedidos, cardápio e entrega." },
  { slug: "marketplace-completo", name: "Marketplace Completo", description: "Estrutura multiempresa para catálogo e transações." },
  { slug: "servicos-locais", name: "Serviços Locais", description: "Modelo para contratar e gerenciar serviços locais." },
];

export const architectModuleOptions: BusinessModule[] = [
  {
    id: "app",
    name: "Aplicativo",
    description: "Experiência mobile para clientes e operação.",
    icon: "cellphone",
    selected: true,
    category: "Produto",
  },
  {
    id: "website",
    name: "Website",
    description: "Presença web, páginas públicas e jornada comercial.",
    icon: "web",
    selected: true,
    category: "Produto",
  },
  {
    id: "panel",
    name: "Painel",
    description: "Administração, cadastros, operação e permissões futuras.",
    icon: "monitor-dashboard",
    selected: true,
    category: "Operação",
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Catálogo, fornecedores, pedidos e regras comerciais.",
    icon: "storefront-outline",
    selected: true,
    category: "Produto",
  },
  {
    id: "payments",
    name: "Pagamentos",
    description: "Estrutura futura para cobrança, assinatura e checkout.",
    icon: "credit-card-outline",
    selected: false,
    category: "Operação",
  },
  {
    id: "ai",
    name: "IA",
    description: "Recomendações, personalização assistida e aprovações.",
    icon: "creation",
    selected: true,
    category: "Inteligência",
  },
  {
    id: "blog",
    name: "Blog",
    description: "Conteúdo, SEO e autoridade de marca.",
    icon: "post-outline",
    selected: false,
    category: "Crescimento",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Campanhas, landing pages e Growth Center™.",
    icon: "bullhorn-outline",
    selected: true,
    category: "Crescimento",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Indicadores, funil, uso e evolução do negócio.",
    icon: "chart-line",
    selected: true,
    category: "Inteligência",
  },
  {
    id: "team",
    name: "Equipe",
    description: "Papéis, convites, responsabilidades e multiusuário.",
    icon: "account-group-outline",
    selected: true,
    category: "Operação",
  },
];

export const placeholderIdea =
  "Quero criar uma empresa digital para atender clientes locais, vender serviços online, operar por painel administrativo e publicar em Web, Android e iOS.";

export const mockBusinessBlueprint: BusinessBlueprint = {
  id: "blueprint-enterprise-digital",
  title: "Project Blueprint™ - Empresa Digital Completa",
  executiveSummary:
    "Blueprint visual para transformar a ideia em uma empresa digital com Business DNA™, template premium, módulos priorizados e aprovação humana antes de qualquer geração real.",
  idea: placeholderIdea,
  objective:
    "Criar uma operação digital vendável, escalável e preparada para publicação, usando templates como base e IA apenas como personalização futura.",
  businessDnaSlug: "servicos-locais",
  businessDnaName: "Serviços Locais DNA™",
  templateSlug: "servicos-locais",
  templateName: "Serviços Locais",
  architecture: {
    pattern: "Control Plane SaaS com possibilidade de Data Plane dedicado",
    frontend: ["React Native/Web", "Expo Router", "Dashboard web-first", "Componentes SaaS premium"],
    backend: ["Supabase protegido", "Edge Functions futuras", "IA backend-only", "Aprovação humana"],
    data: ["Tenant isolado", "RLS obrigatório", "Buckets por política", "Logs sem dados sensíveis"],
    security: ["Service role nunca no frontend", "Multiempresa", "Multiusuário", "LGPD"],
    publishing: ["Web", "Android", "iOS", "Checklist revisável"],
  },
  requirements: [
    {
      id: "req-1",
      title: "Operação multiempresa",
      description: "Preparar estrutura para separar empresas, ambientes e usuários.",
      priority: "Essencial",
    },
    {
      id: "req-2",
      title: "Templates antes de geração",
      description: "Usar modelos validados como base para reduzir custo, tempo e tokens.",
      priority: "Essencial",
    },
    {
      id: "req-3",
      title: "Publicação assistida",
      description: "Planejar Web, Android e iOS com revisão humana antes de publicar.",
      priority: "Importante",
    },
  ],
  modules: architectModuleOptions,
  integrations: ["Supabase", "Storage", "Expo/EAS", "n8n futuro", "WhatsApp futuro", "Billing futuro"],
  resources: ["Business Project™", "Business DNA™", "Marketplace de Templates", "AI Business Consultant™", "Publishing Center™"],
  schedule: [
    { phase: "Descoberta", duration: "1-2 dias", deliverable: "Blueprint validado" },
    { phase: "Base premium", duration: "2-4 dias", deliverable: "Template e módulos definidos" },
    { phase: "Personalização", duration: "5-10 dias", deliverable: "Primeira versão revisável" },
    { phase: "Publicação", duration: "3-7 dias", deliverable: "Web, Android e iOS preparados" },
  ],
  recommendedPlan: "Premium",
  suggestedTeam: [
    { role: "Product Owner", responsibility: "Validar escopo, prioridades e decisões de negócio." },
    { role: "Solution Architect", responsibility: "Definir arquitetura, módulos e integrações." },
    { role: "Builder", responsibility: "Materializar a experiência e preparar entregáveis." },
    { role: "Growth", responsibility: "Planejar páginas, campanhas e conteúdo." },
  ],
  plannedBuilds: ["Web Preview", "Android Staging", "iOS Staging"],
  plannedPublications: ["Web", "Google Play", "App Store"],
  futureIntegrationContract: {
    expectedInputs: ["Ideia", "Business DNA™", "Template", "Módulos", "Plano", "Restrições"],
    expectedOutputs: ["Blueprint™", "Arquitetura", "Cronograma", "Equipe", "Builds", "Publicações"],
    boundaries: ["Sem IA no frontend", "Sem geração automática sem aprovação", "Sem dados sensíveis em logs"],
  },
};
