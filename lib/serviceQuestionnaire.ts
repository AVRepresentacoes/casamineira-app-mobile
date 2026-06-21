export type QuestionKind = "text" | "select" | "yesno" | "number";

export type ServiceQuestion = {
  key: string;
  label: string;
  kind: QuestionKind;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

export type QuestionSet = {
  title: string;
  subtitle: string;
  questions: ServiceQuestion[];
};

const SET_ASKS_LOCAL: Record<SetKey, boolean> = {
  cell_repair: false,
  ac: false,
  appliance: false,
  tech_repair: true,
  hydraulic: false,
  electrical: false,
  construction: false,
  finishings: false,
  events: false,
  domestic: false,
  lessons: true,
  beauty: true,
  technology: true,
  consulting: false,
  health: false,
  auto: false,
  real_estate: false,
  business: false,
  generic: false,
};

type SetKey =
  | "cell_repair"
  | "ac"
  | "appliance"
  | "tech_repair"
  | "hydraulic"
  | "electrical"
  | "construction"
  | "finishings"
  | "events"
  | "domestic"
  | "lessons"
  | "beauty"
  | "technology"
  | "consulting"
  | "health"
  | "auto"
  | "real_estate"
  | "business"
  | "generic";

const SETS: Record<SetKey, QuestionSet> = {
  cell_repair: {
    title: "Diagnóstico do celular",
    subtitle: "Perguntas técnicas para orçamento assertivo.",
    questions: [
      { key: "marca", label: "Marca", kind: "select", required: true, options: ["Apple", "Samsung", "Motorola", "Xiaomi", "Outro"] },
      { key: "modelo", label: "Modelo", kind: "text", required: true, placeholder: "Ex: iPhone 13" },
      { key: "problema", label: "Problema principal", kind: "select", required: true, options: ["Tela", "Bateria", "Conector", "Não liga", "Outro"] },
      { key: "liga", label: "O aparelho liga?", kind: "yesno", required: true, options: ["Sim", "Não"] },
      { key: "urgencia", label: "Urgência", kind: "select", options: ["Hoje", "48h", "Esta semana"] },
    ],
  },
  ac: {
    title: "Dados do ar-condicionado",
    subtitle: "Esses dados ajudam no diagnóstico e tempo de execução.",
    questions: [
      { key: "tipo_servico", label: "Tipo de serviço", kind: "select", required: true, options: ["Instalação", "Manutenção", "Limpeza", "Reparo"] },
      { key: "btus", label: "BTUs", kind: "number", placeholder: "Ex: 12000" },
      { key: "marca_modelo", label: "Marca/Modelo", kind: "text", placeholder: "Ex: LG Dual Inverter" },
      { key: "sintoma", label: "Sintoma", kind: "text", required: true, placeholder: "Ex: não gela" },
    ],
  },
  appliance: {
    title: "Dados do eletrodoméstico",
    subtitle: "Detalhes do equipamento para estimativa precisa.",
    questions: [
      { key: "equipamento", label: "Equipamento", kind: "text", required: true, placeholder: "Ex: geladeira, máquina" },
      { key: "marca", label: "Marca", kind: "text", placeholder: "Ex: Brastemp" },
      { key: "idade", label: "Tempo de uso (anos)", kind: "number", placeholder: "Ex: 4" },
      { key: "sintoma", label: "Sintoma principal", kind: "text", required: true, placeholder: "Ex: não resfria" },
    ],
  },
  tech_repair: {
    title: "Checklist técnico de equipamento",
    subtitle: "Ajuda a separar suporte remoto e visita técnica.",
    questions: [
      { key: "equipamento", label: "Equipamento", kind: "text", required: true, placeholder: "Ex: notebook, TV" },
      { key: "sistema", label: "Sistema/versão", kind: "text", placeholder: "Ex: Windows 11" },
      { key: "erro", label: "Erro ou comportamento", kind: "text", required: true, placeholder: "Ex: reinicia sozinho" },
      { key: "remoto_local", label: "Atendimento", kind: "select", options: ["Remoto", "Local", "Indiferente"] },
    ],
  },
  hydraulic: {
    title: "Escopo hidráulico",
    subtitle: "Informações para prever material e complexidade.",
    questions: [
      { key: "tipo", label: "Tipo de problema", kind: "select", required: true, options: ["Vazamento", "Entupimento", "Instalação", "Troca"] },
      { key: "ponto", label: "Local do problema", kind: "text", required: true, placeholder: "Ex: cozinha" },
      { key: "urgencia", label: "Nível de urgência", kind: "select", options: ["Alta", "Média", "Baixa"] },
      { key: "material", label: "Já possui material?", kind: "yesno", options: ["Sim", "Não"] },
    ],
  },
  electrical: {
    title: "Escopo elétrico",
    subtitle: "Informações para orçamento e segurança.",
    questions: [
      { key: "tipo", label: "Tipo de serviço", kind: "select", required: true, options: ["Instalação", "Reparo", "Troca de fiação", "Quadro elétrico"] },
      { key: "ambiente", label: "Ambiente", kind: "select", options: ["Residencial", "Comercial"] },
      { key: "queda_disjuntor", label: "Há queda de disjuntor?", kind: "yesno", options: ["Sim", "Não"] },
      { key: "detalhes", label: "Detalhes", kind: "text", placeholder: "Ex: cheiro de queimado" },
    ],
  },
  construction: {
    title: "Escopo de obra",
    subtitle: "Detalhes de área e prazo aumentam a qualidade das propostas.",
    questions: [
      { key: "tipo_local", label: "Tipo de local", kind: "select", options: ["Casa", "Apartamento", "Comércio"] },
      { key: "metragem", label: "Metragem aproximada (m²)", kind: "number", placeholder: "Ex: 25" },
      { key: "etapa", label: "Etapa", kind: "select", options: ["Início", "Parcial", "Finalização"] },
      { key: "prazo", label: "Prazo desejado", kind: "select", options: ["Urgente", "7 dias", "15+ dias"] },
    ],
  },
  finishings: {
    title: "Detalhes de acabamento",
    subtitle: "Defina material, área e padrão de acabamento.",
    questions: [
      { key: "tipo_servico", label: "Serviço", kind: "text", required: true, placeholder: "Ex: pintura, piso" },
      { key: "area", label: "Área aproximada", kind: "number", placeholder: "Ex: 30" },
      { key: "material", label: "Material já comprado?", kind: "yesno", options: ["Sim", "Não"] },
      { key: "acabamento", label: "Nível de acabamento", kind: "select", options: ["Padrão", "Premium"] },
    ],
  },
  events: {
    title: "Briefing do evento",
    subtitle: "Com esse briefing, os profissionais enviam proposta sob medida.",
    questions: [
      { key: "tipo_evento", label: "Tipo de evento", kind: "text", required: true, placeholder: "Ex: aniversário" },
      { key: "data", label: "Data prevista", kind: "text", required: true, placeholder: "Ex: 20/06" },
      { key: "convidados", label: "Qtd. convidados", kind: "number", placeholder: "Ex: 80" },
      { key: "duracao", label: "Duração estimada", kind: "text", placeholder: "Ex: 4h" },
    ],
  },
  domestic: {
    title: "Detalhes do serviço doméstico",
    subtitle: "Informações para estimar tempo e equipe necessária.",
    questions: [
      { key: "frequencia", label: "Frequência", kind: "select", options: ["Única", "Semanal", "Quinzenal", "Mensal"] },
      { key: "comodos", label: "Quantidade de cômodos", kind: "number", placeholder: "Ex: 5" },
      { key: "animais", label: "Possui animais no local?", kind: "yesno", options: ["Sim", "Não"] },
      { key: "horario", label: "Horário preferencial", kind: "text", placeholder: "Ex: manhã" },
    ],
  },
  lessons: {
    title: "Perfil da aula",
    subtitle: "Defina objetivo, nível e formato para match ideal.",
    questions: [
      { key: "objetivo", label: "Objetivo principal", kind: "text", required: true, placeholder: "Ex: conversação" },
      { key: "nivel", label: "Nível atual", kind: "select", options: ["Iniciante", "Intermediário", "Avançado"] },
      { key: "modalidade", label: "Modalidade", kind: "select", options: ["Online", "Presencial", "Indiferente"] },
      { key: "frequencia", label: "Frequência", kind: "select", options: ["1x semana", "2x semana", "3x+"] },
    ],
  },
  beauty: {
    title: "Preferências de beleza",
    subtitle: "Detalhes de estilo para entregar o resultado esperado.",
    questions: [
      { key: "tipo_servico", label: "Serviço desejado", kind: "text", required: true, placeholder: "Ex: maquiagem social" },
      { key: "data", label: "Data/horário", kind: "text", placeholder: "Ex: sábado 14h" },
      { key: "local", label: "Atendimento", kind: "select", options: ["No local", "No salão", "Indiferente"] },
      { key: "referencia", label: "Possui referência?", kind: "yesno", options: ["Sim", "Não"] },
    ],
  },
  technology: {
    title: "Escopo tecnológico",
    subtitle: "Coleta técnica para reduzir retrabalho e acelerar execução.",
    questions: [
      { key: "equipamento", label: "Equipamento principal", kind: "text", required: true, placeholder: "Ex: PC gamer" },
      { key: "objetivo", label: "Objetivo do serviço", kind: "text", required: true, placeholder: "Ex: montar do zero" },
      { key: "atendimento", label: "Atendimento", kind: "select", options: ["Remoto", "Local", "Indiferente"] },
      { key: "urgencia", label: "Urgência", kind: "select", options: ["Hoje", "48h", "Esta semana"] },
    ],
  },
  consulting: {
    title: "Briefing de consultoria",
    subtitle: "Contexto do cenário atual e meta esperada.",
    questions: [
      { key: "objetivo", label: "Objetivo principal", kind: "text", required: true, placeholder: "Ex: reduzir custos" },
      { key: "segmento", label: "Segmento", kind: "text", placeholder: "Ex: varejo" },
      { key: "porte", label: "Porte", kind: "select", options: ["Pessoa física", "MEI", "PME", "Empresa grande"] },
      { key: "prazo", label: "Prazo para resultado", kind: "select", options: ["Curto", "Médio", "Longo"] },
    ],
  },
  health: {
    title: "Informações de atendimento",
    subtitle: "Dados para direcionar o profissional mais adequado.",
    questions: [
      { key: "objetivo", label: "Objetivo do atendimento", kind: "text", required: true, placeholder: "Ex: reabilitação" },
      { key: "perfil_paciente", label: "Perfil do paciente", kind: "text", placeholder: "Ex: adulto, idoso" },
      { key: "frequencia", label: "Frequência desejada", kind: "select", options: ["1x semana", "2x semana", "3x+"] },
      { key: "prescricao", label: "Possui prescrição médica?", kind: "yesno", options: ["Sim", "Não"] },
    ],
  },
  auto: {
    title: "Checklist automotivo",
    subtitle: "Especifique veículo e problema para cotação rápida.",
    questions: [
      { key: "veiculo", label: "Veículo (marca/modelo/ano)", kind: "text", required: true, placeholder: "Ex: Gol 2018" },
      { key: "servico", label: "Serviço desejado", kind: "text", required: true, placeholder: "Ex: revisão" },
      { key: "sintoma", label: "Sintoma observado", kind: "text", placeholder: "Ex: barulho ao frear" },
      { key: "rodando", label: "O veículo está rodando?", kind: "yesno", options: ["Sim", "Não"] },
    ],
  },
  real_estate: {
    title: "Detalhes do imóvel",
    subtitle: "Informações para conectar com o profissional mais aderente.",
    questions: [
      { key: "tipo_imovel", label: "Tipo de imóvel", kind: "select", required: true, options: ["Casa", "Apartamento", "Comercial", "Terreno", "Outro"] },
      { key: "objetivo", label: "Objetivo", kind: "select", required: true, options: ["Compra", "Aluguel", "Avaliação", "Vistoria", "Regularização"] },
      { key: "metragem", label: "Metragem aproximada (m²)", kind: "number", placeholder: "Ex: 85" },
      { key: "prazo", label: "Prazo desejado", kind: "select", options: ["Urgente", "Até 7 dias", "Até 30 dias", "Sem pressa"] },
    ],
  },
  business: {
    title: "Escopo do negócio",
    subtitle: "Defina prioridade e objetivo para um orçamento assertivo.",
    questions: [
      { key: "area", label: "Área principal", kind: "select", required: true, options: ["Contábil/Fiscal", "Jurídico", "Marketing", "Vendas", "Processos", "Financeiro"] },
      { key: "tipo_empresa", label: "Tipo de empresa", kind: "select", options: ["MEI", "ME", "EPP", "LTDA", "Outro"] },
      { key: "objetivo", label: "Objetivo principal", kind: "text", required: true, placeholder: "Ex: abrir CNPJ e organizar fiscal" },
      { key: "atendimento", label: "Formato de atendimento", kind: "select", options: ["Remoto", "Presencial", "Híbrido"] },
    ],
  },
  generic: {
    title: "Informações do serviço",
    subtitle: "Esses dados ajudam os profissionais a enviarem proposta certeira.",
    questions: [
      { key: "escopo", label: "Escopo principal", kind: "text", required: true, placeholder: "Descreva em uma frase" },
      { key: "urgencia", label: "Urgência", kind: "select", options: ["Hoje", "Até 48h", "Nesta semana"] },
      { key: "horario", label: "Melhor horário", kind: "text", placeholder: "Ex: manhã" },
    ],
  },
};

const SERVICE_IDS_BY_SET: Record<SetKey, string[]> = {
  cell_repair: ["assistencia-7"],
  ac: ["assistencia-5"],
  appliance: ["assistencia-1", "assistencia-2", "assistencia-3", "assistencia-8", "assistencia-9", "assistencia-10"],
  tech_repair: ["assistencia-4", "assistencia-6"],
  hydraulic: ["reformas-2"],
  electrical: ["reformas-1", "automoveis-3"],
  construction: ["reformas-4", "reformas-7", "reformas-8", "reformas-9", "reformas-10", "reformas-13"],
  finishings: ["reformas-3", "reformas-5", "reformas-6", "reformas-11", "reformas-12", "reformas-14", "automoveis-2", "automoveis-8"],
  events: ["eventos-1", "eventos-2", "eventos-3", "eventos-4", "eventos-5", "eventos-6", "eventos-7", "eventos-8", "eventos-9", "eventos-10", "eventos-11"],
  domestic: ["domesticos-1", "domesticos-2", "domesticos-3", "domesticos-4", "domesticos-5", "domesticos-6", "domesticos-7", "domesticos-8", "domesticos-9", "domesticos-10"],
  lessons: ["aulas-1", "aulas-2", "aulas-3", "aulas-4", "aulas-5", "aulas-6", "aulas-7", "aulas-8", "aulas-9", "aulas-10"],
  beauty: ["beleza-1", "beleza-2", "beleza-3", "beleza-4", "beleza-5", "beleza-6", "beleza-7", "beleza-8", "beleza-9", "beleza-10"],
  technology: ["tecnologia-1", "tecnologia-2", "tecnologia-3", "tecnologia-4", "tecnologia-5", "tecnologia-6", "tecnologia-7", "tecnologia-8", "tecnologia-9", "tecnologia-10"],
  consulting: ["consultoria-1", "consultoria-2", "consultoria-3", "consultoria-4", "consultoria-5", "consultoria-6", "consultoria-7", "consultoria-8", "consultoria-9", "consultoria-10"],
  health: ["saude-1", "saude-2", "saude-3", "saude-4", "saude-5", "saude-6", "saude-7", "saude-8", "saude-9", "saude-10"],
  auto: ["automoveis-1", "automoveis-4", "automoveis-5", "automoveis-6", "automoveis-7", "automoveis-9", "automoveis-10"],
  real_estate: ["imoveis-1", "imoveis-2", "imoveis-3", "imoveis-4", "imoveis-5", "imoveis-6", "imoveis-7", "imoveis-8"],
  business: ["negocios-1", "negocios-2", "negocios-3", "negocios-4", "negocios-5", "negocios-6", "negocios-7", "negocios-8"],
  generic: [],
};

const SERVICE_SET_BY_ID = Object.entries(SERVICE_IDS_BY_SET).reduce<Record<string, SetKey>>(
  (acc, [setKey, ids]) => {
    ids.forEach((id) => {
      acc[id] = setKey as SetKey;
    });
    return acc;
  },
  {},
);

const DEFAULT_BY_SLUG: Record<string, SetKey> = {
  assistencia: "appliance",
  reformas: "construction",
  eventos: "events",
  domesticos: "domestic",
  aulas: "lessons",
  beleza: "beauty",
  tecnologia: "technology",
  consultoria: "consulting",
  saude: "health",
  automoveis: "auto",
  imoveis: "real_estate",
  negocios: "business",
};

export function getQuestionSet(slug: string, servico: string, servicoId?: string): QuestionSet {
  const id = String(servicoId || "").trim();
  if (id && SERVICE_SET_BY_ID[id]) {
    return SETS[SERVICE_SET_BY_ID[id]];
  }

  const s = normalize(servico);
  if (s.includes("celular") || s.includes("smartphone")) return SETS.cell_repair;
  if (s.includes("ar-condicionado") || s.includes("ar condicionado")) return SETS.ac;
  if (s.includes("eletricista") || s.includes("fiação") || s.includes("fiacao")) return SETS.electrical;
  if (s.includes("encanador") || s.includes("hidraul")) return SETS.hydraulic;

  return SETS[DEFAULT_BY_SLUG[slug] || "generic"];
}

export function shouldSkipLocalStep(slug: string, servico: string, servicoId?: string): boolean {
  const id = String(servicoId || "").trim();
  if (id && SERVICE_SET_BY_ID[id]) {
    return SET_ASKS_LOCAL[SERVICE_SET_BY_ID[id]];
  }

  const s = normalize(servico);
  if (s.includes("online") || s.includes("remoto") || s.includes("domiciliar")) {
    return true;
  }

  const setKey = DEFAULT_BY_SLUG[slug] || "generic";
  return SET_ASKS_LOCAL[setKey];
}

export function buildTechnicalSummary(answers: Record<string, string>) {
  const entries = Object.entries(answers).filter(([, v]) => String(v || "").trim().length > 0);
  if (entries.length === 0) return "";

  return entries.map(([k, v]) => `- ${humanize(k)}: ${v}`).join("\n");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function humanize(key: string) {
  return key
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
