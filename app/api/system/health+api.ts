import { createClient } from "@supabase/supabase-js";
import { recordObservation } from "@/lib/observability";

type HealthStatus = "green" | "yellow" | "red";

function getServerSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    appUrl: process.env.APP_URL || process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.EXPO_PUBLIC_APP_URL || "",
    edgeAllowedOrigins: process.env.EDGE_ALLOWED_ORIGINS || "",
  };
}

function section(status: HealthStatus, explanation: string, details?: Record<string, unknown>) {
  return { status, explanation, details: details || {} };
}

async function timed<T>(fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const result = await fn();
    return { ok: true, result, ms: Date.now() - start };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido", ms: Date.now() - start };
  }
}

export async function GET() {
  const env = getServerSupabaseEnv();
  const hasUrl = Boolean(env.url);
  const hasAnon = Boolean(env.anonKey);
  const hasServiceRole = Boolean(env.serviceRoleKey);
  const client = hasUrl && hasAnon ? createClient(env.url, env.anonKey, { auth: { persistSession: false } }) : null;
  const admin = hasUrl && hasServiceRole ? createClient(env.url, env.serviceRoleKey, { auth: { persistSession: false } }) : null;

  const dbCheck = client
    ? await timed(async () => await client.from("tenants").select("id", { count: "exact", head: true }).limit(1))
    : { ok: false, error: "SUPABASE_URL/SUPABASE_ANON_KEY ausentes.", ms: 0 };

  const storageCheck = client
    ? await timed(() => client.storage.from("imagens").list("", { limit: 1 }))
    : { ok: false, error: "Cliente Supabase indisponível.", ms: 0 };

  const authCheck = admin
    ? await timed(() => admin.auth.admin.listUsers({ page: 1, perPage: 1 }))
    : { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY ausente; auth admin não validado.", ms: 0 };

  const securityRpc = client
    ? await timed(async () => await client.rpc("get_supabase_security_center_status"))
    : { ok: false, error: "Cliente Supabase indisponível.", ms: 0 };

  const edgeFunctions = {
    configured: hasUrl,
    expected: [
      "delete-account",
      "create-marketplace-order",
      "create-mercadopago-pix-payment",
      "create-mercadopago-card-payment",
      "create-asaas-pix-payment",
      "mercadopago-webhook",
      "asaas-webhook",
      "ai-orchestrator",
      "ai-factory-artifacts",
    ],
  };

  const body = {
    ok: Boolean(hasUrl && hasAnon && dbCheck.ok),
    generatedAt: new Date().toISOString(),
    supabase: section(hasUrl && hasAnon ? "green" : "red", hasUrl && hasAnon ? "Configuração Supabase pública presente." : "SUPABASE_URL/SUPABASE_ANON_KEY ausentes."),
    banco: section(dbCheck.ok ? "green" : "red", dbCheck.ok ? "Consulta head em tenants executada." : String(dbCheck.error), { responseMs: dbCheck.ms }),
    storage: section(storageCheck.ok ? "green" : "yellow", storageCheck.ok ? "Bucket imagens respondeu." : String(storageCheck.error), { responseMs: storageCheck.ms }),
    realtime: section("yellow", "Realtime precisa ser validado com publicação e assinatura ativa no runtime do cliente."),
    auth: section(authCheck.ok ? "green" : "yellow", authCheck.ok ? "Auth admin respondeu via service role." : String(authCheck.error), { responseMs: authCheck.ms }),
    edgeFunctions: section(env.edgeAllowedOrigins ? "green" : "yellow", env.edgeAllowedOrigins ? "EDGE_ALLOWED_ORIGINS configurado." : "EDGE_ALLOWED_ORIGINS ausente; funções entram em modo compatível.", edgeFunctions),
    ia: section(process.env.OPENAI_API_KEY ? "green" : "yellow", process.env.OPENAI_API_KEY ? "OPENAI_API_KEY presente." : "OPENAI_API_KEY ausente ou IA em dry-run."),
    tokens: section(hasServiceRole ? "green" : "yellow", hasServiceRole ? "Service role presente somente no servidor." : "Service role ausente no ambiente do health check."),
    workers: section("yellow", "Não há worker dedicado declarado neste app; usar Edge Functions e GitHub Actions para rotinas."),
    queues: section("yellow", "Não há fila dedicada detectada; rotinas sensíveis devem usar tabela de jobs ou provedor externo."),
    securityCenter: section(securityRpc.ok ? "green" : "yellow", securityRpc.ok ? "RPC de Security Center respondeu." : String(securityRpc.error), { responseMs: securityRpc.ms }),
  };

  recordObservation({
    area: "health",
    operation: "api_system_health",
    status: body.ok ? "ok" : "warn",
    metadata: {
      databaseMs: dbCheck.ms,
      storageMs: storageCheck.ms,
      authMs: authCheck.ms,
      securityCenterMs: securityRpc.ms,
      ok: body.ok,
    },
  });

  return Response.json(body, {
    status: body.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
