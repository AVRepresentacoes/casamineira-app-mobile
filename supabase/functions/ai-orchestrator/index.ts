// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";


const AGENTS = [
  ["01-briefing", "Briefing Agent"],
  ["02-market-research", "Market Research Agent"],
  ["03-business-strategy", "Business Strategy Agent"],
  ["04-product-manager", "Product Manager Agent"],
  ["05-ux-research", "UX Research Agent"],
  ["06-ui-designer", "UI Designer Agent"],
  ["07-branding", "Branding Agent"],
  ["08-copywriter", "Copywriter Agent"],
  ["09-react-native", "React Native Agent"],
  ["10-nextjs", "Next.js Agent"],
  ["11-backend", "Backend Agent"],
  ["12-database", "Database Agent"],
  ["13-supabase", "Supabase Agent"],
  ["14-api-integration", "API Integration Agent"],
  ["15-payment", "Payment Agent"],
  ["16-whatsapp-automation", "WhatsApp Automation Agent"],
  ["17-n8n-automation", "n8n Automation Agent"],
  ["18-qa-tester", "QA Tester Agent"],
  ["19-security", "Security Agent"],
  ["20-devops", "DevOps Agent"],
  ["21-google-play", "Google Play Agent"],
  ["22-app-store", "App Store Agent"],
  ["23-legal", "Legal Agent"],
  ["24-seo", "SEO Agent"],
  ["25-social-media", "Social Media Agent"],
  ["26-paid-traffic", "Paid Traffic Agent"],
  ["27-video-content", "Video Content Agent"],
  ["28-customer-support", "Customer Support Agent"],
  ["29-financial-pricing", "Financial Pricing Agent"],
  ["30-growth-analytics", "Growth Analytics Agent"],
];

const resultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["briefing", "appGeneration", "marketing", "automation", "pricing", "agentSummaries", "approvalRequired"],
  properties: {
    briefing: {
      type: "object",
      additionalProperties: false,
      required: ["appName", "segment", "targetAudience", "features", "colors", "differentiators", "urgency", "estimatedBudget"],
      properties: {
        appName: { type: "string" },
        segment: { type: "string" },
        targetAudience: { type: "string" },
        features: { type: "array", items: { type: "string" } },
        colors: { type: "array", items: { type: "string" } },
        differentiators: { type: "array", items: { type: "string" } },
        urgency: { type: "string", enum: ["baixa", "media", "alta"] },
        estimatedBudget: {
          type: "object",
          additionalProperties: false,
          required: ["min", "max", "currency"],
          properties: {
            min: { type: "number" },
            max: { type: "number" },
            currency: { type: "string", enum: ["BRL"] },
          },
        },
      },
    },
    appGeneration: {
      type: "object",
      additionalProperties: false,
      required: ["template", "roadmap", "architecture", "database", "integrations", "buildChecklist"],
      properties: {
        template: { type: "string" },
        roadmap: { type: "array", items: { type: "string" } },
        architecture: { type: "array", items: { type: "string" } },
        database: { type: "array", items: { type: "string" } },
        integrations: { type: "array", items: { type: "string" } },
        buildChecklist: { type: "array", items: { type: "string" } },
      },
    },
    marketing: {
      type: "object",
      additionalProperties: false,
      required: ["positioning", "landingPageSections", "socialPosts", "paidCampaigns", "seoKeywords"],
      properties: {
        positioning: { type: "string" },
        landingPageSections: { type: "array", items: { type: "string" } },
        socialPosts: { type: "array", items: { type: "string" } },
        paidCampaigns: { type: "array", items: { type: "string" } },
        seoKeywords: { type: "array", items: { type: "string" } },
      },
    },
    automation: {
      type: "object",
      additionalProperties: false,
      required: ["whatsappFlows", "n8nFlows", "supportFaq"],
      properties: {
        whatsappFlows: { type: "array", items: { type: "string" } },
        n8nFlows: { type: "array", items: { type: "string" } },
        supportFaq: { type: "array", items: { type: "string" } },
      },
    },
    pricing: {
      type: "object",
      additionalProperties: false,
      required: ["setupPrice", "monthlyPrice", "aiCostReserve", "marginPercent", "currency"],
      properties: {
        setupPrice: { type: "number" },
        monthlyPrice: { type: "number" },
        aiCostReserve: { type: "number" },
        marginPercent: { type: "number" },
        currency: { type: "string", enum: ["BRL"] },
      },
    },
    agentSummaries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["agentId", "agentName", "summary", "status"],
        properties: {
          agentId: { type: "string" },
          agentName: { type: "string" },
          summary: { type: "string" },
          status: { type: "string", enum: ["completed", "skipped"] },
        },
      },
    },
    approvalRequired: { type: "boolean" },
  },
};

function jsonResponse(body: Record<string, unknown>, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function numericEnv(name: string, fallback: number) {
  const value = Number(Deno.env.get(name) || "");
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function requestMetadata(req: Request) {
  return {
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || null,
    user_agent: req.headers.get("user-agent") || null,
  };
}

function estimateCostBrl(usage: Record<string, unknown>) {
  const inputTokens = Number(usage?.input_tokens || usage?.prompt_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || usage?.completion_tokens || 0);
  const inputPer1k = Number(Deno.env.get("AI_FACTORY_INPUT_COST_BRL_PER_1K") || "0.02");
  const outputPer1k = Number(Deno.env.get("AI_FACTORY_OUTPUT_COST_BRL_PER_1K") || "0.08");
  return Number(((inputTokens / 1000) * inputPer1k + (outputTokens / 1000) * outputPer1k).toFixed(4));
}

function inferSegment(prompt: string) {
  const value = prompt.toLowerCase();
  if (value.includes("barbearia")) return "barbearia";
  if (value.includes("hotel") || value.includes("pousada") || value.includes("hospedagem")) return "hospedagem";
  if (value.includes("delivery") || value.includes("restaurante")) return "delivery";
  if (value.includes("curso") || value.includes("aula")) return "educacao";
  if (value.includes("loja") || value.includes("ecommerce") || value.includes("e-commerce")) return "ecommerce";
  return "servicos";
}

function buildDryRunPlan(prompt: string) {
  const segment = inferSegment(prompt);
  const features = ["briefing estruturado", "template sugerido", "painel administrativo", "automacoes"];
  if (prompt.toLowerCase().includes("pix")) features.push("pagamento Pix");
  if (prompt.toLowerCase().includes("whatsapp")) features.push("WhatsApp automatico");
  if (prompt.toLowerCase().includes("instagram")) features.push("posts para Instagram");

  return {
    briefing: {
      appName: `App ${segment}`,
      segment,
      targetAudience: "Clientes finais e equipe administrativa do negocio",
      features,
      colors: ["#0f172a", "#facc15", "#ffffff"],
      differentiators: ["atendimento rapido", "operacao digital", "experiencia white-label"],
      urgency: prompt.toLowerCase().includes("urgente") ? "alta" : "media",
      estimatedBudget: { min: 2500, max: 12000, currency: "BRL" },
    },
    appGeneration: {
      template: segment === "barbearia" ? "schedulingApp" : "servicesApp",
      roadmap: ["MVP aprovado", "Templates preparados", "Backend planejado", "Build somente apos aprovacao"],
      architecture: ["Expo/React Native", "Supabase Edge Functions", "Supabase Postgres com RLS"],
      database: ["tenants", "clientes", "servicos", "agendamentos/pedidos", "pagamentos"],
      integrations: ["OpenAI backend-only", "Supabase", "Pagamentos", "WhatsApp"],
      buildChecklist: ["Validar env", "Gerar cliente white-label", "Rodar typecheck", "Executar build aprovado"],
    },
    marketing: {
      positioning: `Aplicativo white-label para ${segment} com foco em conveniencia e recorrencia.`,
      landingPageSections: ["Hero", "Beneficios", "Como funciona", "Planos", "Contato"],
      socialPosts: ["Oferta de lancamento", "Depoimento", "Antes e depois", "Bastidores"],
      paidCampaigns: ["Meta Ads local", "Google Search local", "Remarketing"],
      seoKeywords: [`app para ${segment}`, `${segment} online`, `${segment} com agendamento`],
    },
    automation: {
      whatsappFlows: ["boas-vindas", "orcamento", "lembrete", "cobranca", "suporte"],
      n8nFlows: ["lead para CRM", "pagamento aprovado", "pedido criado", "follow-up"],
      supportFaq: ["precos", "prazos", "pagamentos", "cancelamento", "suporte humano"],
    },
    pricing: {
      setupPrice: 6500,
      monthlyPrice: 497,
      aiCostReserve: 150,
      marginPercent: 55,
      currency: "BRL",
    },
    agentSummaries: AGENTS.map(([agentId, agentName]) => ({
      agentId,
      agentName,
      summary: `${agentName} planejado em dry-run para ${segment}.`,
      status: "completed",
    })),
    approvalRequired: true,
  };
}

function extractOutputText(responseJson: Record<string, unknown>) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;

  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }

  return "";
}

function validateFactoryResult(result: Record<string, unknown>) {
  const required = ["briefing", "appGeneration", "marketing", "automation", "pricing", "agentSummaries"];
  for (const key of required) {
    if (!result || typeof result !== "object" || !(key in result)) {
      throw new Error(`Resposta de IA invalida: campo ausente ${key}.`);
    }
  }
  if (!Array.isArray(result.agentSummaries)) {
    throw new Error("Resposta de IA invalida: agentSummaries deve ser uma lista.");
  }
  return result;
}

async function callOpenAi(prompt: string, model: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "system",
          content:
            "Voce e a fabrica de aplicativos da Casa Mineira SaaS. Responda apenas com JSON valido no schema solicitado. Todas as recomendacoes devem assumir que chaves privadas ficam no backend e builds exigem aprovacao humana.",
        },
        {
          role: "user",
          content: `Pedido do cliente:\n${prompt}\n\nMonte o plano completo usando os 30 agentes da arquitetura Casa Mineira.`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "casa_mineira_ai_factory_result",
          strict: true,
          schema: resultSchema,
        },
      },
    }),
  });

  const responseJson = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responseJson?.error?.message || `Falha OpenAI HTTP ${response.status}.`);
  }

  const outputText = extractOutputText(responseJson);
  if (!outputText) {
    throw new Error("OpenAI nao retornou texto estruturado.");
  }

  return {
    result: validateFactoryResult(JSON.parse(outputText)),
    usage: responseJson.usage || {},
    responseId: responseJson.id || null,
  };
}

async function insertRun(supabaseAdmin: unknown, payload: Record<string, unknown>) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("ai_factory_runs")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    console.log("[ai-orchestrator] persistencia insertRun:", error);
    return null;
  }
  return data?.id || null;
}

async function updateRun(supabaseAdmin: unknown, runId: string | null, payload: Record<string, unknown>) {
  if (!supabaseAdmin || !runId) return;
  const { error } = await supabaseAdmin.from("ai_factory_runs").update(payload).eq("id", runId);
  if (error) console.log("[ai-orchestrator] persistencia updateRun:", error);
}

async function insertAuditLog(
  supabaseAdmin: unknown,
  payload: {
    run_id?: string | null;
    tenant_id?: string | null;
    user_id?: string | null;
    action: string;
    status?: "success" | "denied" | "failed";
    ip_address?: string | null;
    user_agent?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.from("ai_factory_audit_logs").insert({
    run_id: payload.run_id || null,
    tenant_id: payload.tenant_id || null,
    user_id: payload.user_id || null,
    action: payload.action,
    status: payload.status || "success",
    ip_address: payload.ip_address || null,
    user_agent: payload.user_agent || null,
    metadata: payload.metadata || {},
  });
  if (error) console.log("[ai-orchestrator] persistencia insertAuditLog:", error);
}

async function assertTenantRunLimit(supabaseAdmin: unknown, tenantId: string | null, dryRun: boolean) {
  if (!supabaseAdmin || !tenantId || dryRun) return;

  const dailyLimit = numericEnv("AI_FACTORY_DAILY_RUN_LIMIT", 20);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("ai_factory_runs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("dry_run", false)
    .gte("created_at", since);

  if (error) {
    throw new Error(`Falha ao verificar limite diario: ${error.message}`);
  }

  if (Number(count || 0) >= dailyLimit) {
    throw new Error(`Limite diario de IA real atingido para este tenant (${dailyLimit}/24h).`);
  }
}

async function insertAgentLogs(supabaseAdmin: unknown, runId: string | null, tenantId: string | null, result: Record<string, unknown>) {
  if (!supabaseAdmin || !runId || !tenantId) return;
  const summaries = Array.isArray(result.agentSummaries) ? result.agentSummaries : [];
  const rows = summaries.map((item) => ({
    run_id: runId,
    tenant_id: tenantId,
    agent_id: item.agentId,
    agent_name: item.agentName,
    status: item.status || "completed",
    input: {},
    output: item,
    usage: {},
    completed_at: new Date().toISOString(),
  }));
  if (!rows.length) return;
  const { error } = await supabaseAdmin.from("ai_factory_agent_logs").insert(rows);
  if (error) console.log("[ai-orchestrator] persistencia insertAgentLogs:", error);
}

Deno.serve(async (req) => {
  const corsHeaders = createCorsHeaders(req);
  const json = (body: Record<string, unknown>, status = 200) => jsonResponse(body, status, corsHeaders);

  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  if (req.method !== "POST") {
    return json({ error: "Metodo nao permitido." }, 405);
  }

  let supabaseAdmin = null;
  let runId = null;
  let auditContext = {};

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("AI_MODEL") || "gpt-5.5";
    const envForcesDryRun = Deno.env.get("AI_FACTORY_DRY_RUN") !== "false";
    const maxPromptChars = numericEnv("AI_FACTORY_MAX_PROMPT_CHARS", 6000);
    const metadata = requestMetadata(req);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Credenciais Supabase ausentes na function.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Token ausente." }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    if (serviceRoleKey) {
      supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return json({ error: "Usuario nao autenticado." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || "").trim();
    if (prompt.length < 10) {
      return json({ error: "Descreva o aplicativo com pelo menos 10 caracteres." }, 400);
    }
    if (prompt.length > maxPromptChars) {
      await insertAuditLog(supabaseAdmin, {
        user_id: user.id,
        action: "run_denied_prompt_too_large",
        status: "denied",
        ...metadata,
        metadata: { promptLength: prompt.length, maxPromptChars },
      });
      return json({ error: `Prompt excede o limite de ${maxPromptChars} caracteres.` }, 413);
    }

    const requestedDryRun = body?.dryRun !== false;
    const dryRun = envForcesDryRun || requestedDryRun || !openAiKey;
    const { data: tenantId } = await supabaseAuth.rpc("current_tenant_id").catch(() => ({ data: null }));
    auditContext = { tenant_id: tenantId || null, user_id: user.id, ...metadata };

    await assertTenantRunLimit(supabaseAdmin, tenantId || null, dryRun);

    runId = await insertRun(supabaseAdmin, {
      tenant_id: tenantId || null,
      user_id: user.id,
      prompt,
      status: "running",
      dry_run: dryRun,
      model: dryRun ? null : model,
      approval_status: "pending",
      briefing: {},
      result: {},
    });
    auditContext = { ...auditContext, run_id: runId };

    await insertAuditLog(supabaseAdmin, {
      ...auditContext,
      action: dryRun ? "run_started_dry_run" : "run_started_openai",
      metadata: { model: dryRun ? null : model, promptLength: prompt.length },
    });

    const execution = dryRun
      ? {
          result: buildDryRunPlan(prompt),
          usage: {},
          responseId: null,
        }
      : await callOpenAi(prompt, model, openAiKey);

    await updateRun(supabaseAdmin, runId, {
      status: "completed",
      briefing: execution.result.briefing || {},
      result: {
        ...execution.result,
        openAiResponseId: execution.responseId,
        persistenceEnabled: Boolean(supabaseAdmin),
      },
      usage: execution.usage || {},
      estimated_cost_brl: estimateCostBrl(execution.usage || {}),
      approval_status: "pending",
      completed_at: new Date().toISOString(),
    });
    await insertAgentLogs(supabaseAdmin, runId, tenantId || null, execution.result);
    await insertAuditLog(supabaseAdmin, {
      ...auditContext,
      action: "run_completed",
      metadata: {
        dryRun,
        model: dryRun ? null : model,
        estimatedCostBrl: estimateCostBrl(execution.usage || {}),
      },
    });

    return json({
      ok: true,
      runId,
      persistenceEnabled: Boolean(supabaseAdmin && runId),
      dryRun,
      model: dryRun ? null : model,
      result: execution.result,
    });
  } catch (error) {
    console.log("[ai-orchestrator] erro:", error);
    await updateRun(supabaseAdmin, runId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Erro interno.",
      completed_at: new Date().toISOString(),
    });
    await insertAuditLog(supabaseAdmin, {
      ...auditContext,
      action: "run_failed",
      status: "failed",
      metadata: { error: error instanceof Error ? error.message : "Erro interno." },
    });
    return json({ error: error instanceof Error ? error.message : "Erro interno.", runId }, 500);
  }
});
