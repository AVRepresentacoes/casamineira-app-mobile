export type AiFactoryInput = {
  prompt: string;
  tenantId?: string | null;
  userId?: string | null;
  locale?: "pt-BR" | "en-US";
};

export type BriefingSchema = {
  appName: string;
  segment: string;
  targetAudience: string;
  features: string[];
  colors: string[];
  differentiators: string[];
  urgency: "baixa" | "media" | "alta";
  estimatedBudget: {
    min: number;
    max: number;
    currency: "BRL";
  };
  rawRequest: string;
};

export type AiFactoryContext = {
  requestId: string;
  generatedAt: string;
  dryRun: boolean;
  input: AiFactoryInput;
  briefing: BriefingSchema;
};

const FEATURE_KEYWORDS: [string, string][] = [
  ["agendamento", "agendamento"],
  ["pix", "pagamento Pix"],
  ["cartao", "pagamento com cartao"],
  ["cartão", "pagamento com cartao"],
  ["painel", "painel administrativo"],
  ["admin", "painel administrativo"],
  ["whatsapp", "automacao WhatsApp"],
  ["instagram", "conteudo Instagram"],
  ["delivery", "delivery"],
  ["marketplace", "marketplace"],
  ["assinatura", "assinaturas"],
];

export function createBriefingFromPrompt(input: AiFactoryInput): BriefingSchema {
  const prompt = String(input.prompt || "").trim();
  const lowerPrompt = prompt.toLowerCase();
  const features = FEATURE_KEYWORDS.filter(([keyword]) => lowerPrompt.includes(keyword)).map(([, feature]) => feature);
  const segment = inferSegment(lowerPrompt);

  return {
    appName: inferAppName(prompt, segment),
    segment,
    targetAudience: "Clientes finais e equipe administrativa do negocio",
    features: features.length ? [...new Set(features)] : ["cadastro de clientes", "painel administrativo", "notificacoes"],
    colors: inferColors(lowerPrompt),
    differentiators: ["atendimento rapido", "operacao digital", "experiencia white-label"],
    urgency: lowerPrompt.includes("urgente") || lowerPrompt.includes("rapido") ? "alta" : "media",
    estimatedBudget: {
      min: 2500,
      max: 12000,
      currency: "BRL",
    },
    rawRequest: prompt,
  };
}

function inferSegment(prompt: string) {
  if (prompt.includes("barbearia")) return "barbearia";
  if (prompt.includes("hotel") || prompt.includes("pousada") || prompt.includes("hospedagem")) return "hospedagem";
  if (prompt.includes("curso") || prompt.includes("aula")) return "educacao";
  if (prompt.includes("delivery") || prompt.includes("restaurante")) return "delivery";
  if (prompt.includes("loja") || prompt.includes("ecommerce") || prompt.includes("e-commerce")) return "ecommerce";
  return "servicos";
}

function inferAppName(prompt: string, segment: string) {
  const quoted = prompt.match(/[“"]([^”"]+)[”"]/);
  if (quoted?.[1]) return quoted[1].slice(0, 60);
  return `App ${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
}

function inferColors(prompt: string) {
  const colors = ["azul", "verde", "preto", "branco", "dourado", "vermelho"].filter((color) => prompt.includes(color));
  return colors.length ? colors : ["#0f172a", "#facc15", "#ffffff"];
}
