import type { AiWorkforceAnalytics, AiWorker, WorkerStatus, WorkerTask } from "./types";

const statuses: WorkerStatus[] = ["Idle", "Thinking", "Working", "Review", "Waiting Approval", "Completed", "Warning", "Error"];

const workerSeed = [
  ["business-consultant", "BC", "Business Consultant", "Estratégia de negócio", "briefing e validação comercial", "account-tie-outline"],
  ["solution-architect", "SA", "Solution Architect", "Arquitetura de solução", "Project Blueprint™", "sitemap-outline"],
  ["ux-ui-designer", "UX", "UX/UI Designer", "Experiência premium", "fluxo e interface web", "palette-outline"],
  ["frontend-engineer", "FE", "Frontend Engineer", "React Native/Web", "componentes e telas", "monitor-dashboard"],
  ["backend-engineer", "BE", "Backend Engineer", "Serviços e APIs", "contratos backend futuros", "server-outline"],
  ["mobile-engineer", "ME", "Mobile Engineer", "Android e iOS", "publicação mobile", "cellphone"],
  ["database-engineer", "DB", "Database Engineer", "Modelagem de dados", "estrutura multi-tenant", "database-outline"],
  ["qa-engineer", "QA", "QA Engineer", "Qualidade e testes", "checklist de aceite", "check-decagram-outline"],
  ["devops-engineer", "DO", "DevOps Engineer", "Build e deploy", "esteira de publicação", "cloud-upload-outline"],
  ["security-engineer", "SE", "Security Engineer", "Segurança e LGPD", "revisão de riscos", "shield-check-outline"],
  ["marketing-strategist", "MS", "Marketing Strategist", "Go-to-market", "posicionamento comercial", "bullhorn-outline"],
  ["seo-specialist", "SEO", "SEO Specialist", "Busca e conteúdo", "estrutura SEO", "magnify"],
  ["copywriter", "CW", "Copywriter", "Narrativa de venda", "copy de páginas", "text-box-edit-outline"],
  ["analytics-specialist", "AS", "Analytics Specialist", "Métricas e funil", "painel de indicadores", "chart-line"],
  ["publishing-specialist", "PS", "Publishing Specialist", "Web, Android e iOS", "checklist de lojas", "rocket-launch-outline"],
  ["customer-success", "CS", "Customer Success", "Adoção e suporte", "playbook de onboarding", "handshake-outline"],
] as const;

export const aiWorkers: AiWorker[] = workerSeed.map(([id, avatar, name, specialty, nextTask, icon], index) => ({
  id,
  avatar,
  name,
  specialty,
  status: statuses[index % statuses.length],
  progress: [12, 28, 44, 61, 72, 86, 93, 100][index % 8],
  lastActivity: `Atualizou ${nextTask}`,
  nextTask: `Refinar ${nextTask}`,
  estimatedTime: `${index + 2}h`,
  icon,
  skills: [
    { id: `${id}-skill-1`, name: specialty, level: "Expert" },
    { id: `${id}-skill-2`, name: "Casa Mineira SaaS", level: "Advanced" },
    { id: `${id}-skill-3`, name: "Aprovação humana", level: "Core" },
  ],
  history: [
    { id: `${id}-history-1`, activity: `Analisou ${nextTask}`, timestampLabel: "Agora" },
    { id: `${id}-history-2`, activity: "Sincronizou com o Blueprint™", timestampLabel: "Hoje" },
  ],
}));

export const aiWorkerTasks: WorkerTask[] = [
  { id: "task-briefing", title: "Consolidar briefing comercial", column: "Backlog", priority: "Alta", ownerId: "business-consultant" },
  { id: "task-blueprint", title: "Revisar arquitetura alvo", column: "Em andamento", priority: "Alta", ownerId: "solution-architect" },
  { id: "task-design", title: "Preparar sistema visual premium", column: "Em andamento", priority: "Média", ownerId: "ux-ui-designer" },
  { id: "task-frontend", title: "Materializar componentes reutilizáveis", column: "Revisão", priority: "Alta", ownerId: "frontend-engineer" },
  { id: "task-security", title: "Validar princípios de segurança", column: "Revisão", priority: "Alta", ownerId: "security-engineer" },
  { id: "task-publishing", title: "Planejar publicação Web e mobile", column: "Backlog", priority: "Média", ownerId: "publishing-specialist" },
  { id: "task-copy", title: "Escrever mensagens comerciais", column: "Concluído", priority: "Baixa", ownerId: "copywriter" },
  { id: "task-analytics", title: "Definir indicadores do projeto", column: "Concluído", priority: "Média", ownerId: "analytics-specialist" },
];

export const aiWorkforceAnalytics: AiWorkforceAnalytics = {
  timeByAgent: aiWorkers.slice(0, 8).map((worker, index) => ({
    workerId: worker.id,
    label: worker.avatar,
    hours: [6, 9, 5, 11, 8, 4, 7, 3][index],
  })),
  productivity: 87,
  estimatedCost: "R$ 24.800",
  generatedSavings: "R$ 68.400",
};

export const workforceTimeline = [
  "Consultoria definiu escopo inicial",
  "Arquitetura gerou Blueprint™ visual",
  "UX preparou fluxo premium",
  "Frontend estruturou componentes",
  "QA iniciou checklist",
  "Publishing aguardando aprovação",
];
