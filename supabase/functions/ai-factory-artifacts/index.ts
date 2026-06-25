// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";


function jsonResponse(body: Record<string, unknown>, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requestMetadata(req: Request) {
  return {
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || null,
    user_agent: req.headers.get("user-agent") || null,
  };
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
  if (error) console.log("[ai-factory-artifacts] persistencia insertAuditLog:", error);
}

function normalizeSlug(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactSlug(value: string) {
  return normalizeSlug(value).replace(/-/g, "");
}

function sqlLiteral(value: unknown) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function pickColors(briefing: Record<string, unknown>) {
  const colors = asList(briefing.colors);
  const primary = colors.find((item) => item.startsWith("#")) || "#facc15";
  const secondary = colors.find((item) => item.startsWith("#") && item !== primary) || "#020617";
  const accent = colors.find((item) => item.startsWith("#") && item !== primary && item !== secondary) || "#1e293b";

  return {
    primary,
    secondary,
    accent,
    splashBackground: secondary,
    adaptiveIconBackground: "#FFFFFF",
    notification: secondary,
  };
}

function createClientConfig(run: Record<string, unknown>) {
  const briefing = asRecord(run.briefing);
  const result = asRecord(run.result);
  const marketing = asRecord(result.marketing);
  const appName = String(briefing.appName || "App Casa Mineira");
  const slug = normalizeSlug(appName) || `app-${String(run.id).slice(0, 8)}`;
  const compact = compactSlug(slug) || "appcasamineira";
  const colors = pickColors(briefing);

  return {
    appName,
    appSlug: slug,
    appScheme: compact,
    androidPackage: `br.app.${compact}`,
    iosBundleId: `br.app.${compact}`,
    tenantSlug: slug,
    lockTenant: true,
    domain: "",
    supportWhatsapp: "",
    slogan: String(marketing.positioning || `Aplicativo white-label para ${String(briefing.segment || "servicos")}.`).slice(0, 160),
    colors,
    assets: {
      icon: "./assets/images/icons/icon.png",
      splash: "./assets/images/icons/icon.png",
      adaptiveIcon: "./assets/images/icons/icon.png",
      notificationIcon: "./assets/images/icons/icon-safe.png",
      logoUrl: "",
    },
    backend: {
      requireDedicatedSupabase: false,
      supabaseUrl: "",
      supabaseAnonKey: "",
      forbiddenSupabaseRefs: [],
    },
    store: {
      shortDescription: String(marketing.positioning || "Aplicativo white-label criado pela Casa Mineira.").slice(0, 80),
      privacyPolicyUrl: "",
    },
    aiFactory: {
      runId: run.id,
      generatedAt: new Date().toISOString(),
      source: "ai_factory_artifacts",
      approvalStatus: run.approval_status,
    },
  };
}

function generateProvisionSql(config: Record<string, unknown>) {
  const colors = asRecord(config.colors);
  const assets = asRecord(config.assets);
  const domain = config.domain || null;
  const whatsapp = config.supportWhatsapp || null;
  const slogan = config.slogan || "Plataforma local de servicos e marketplace.";

  return `-- Provisionamento white-label gerado pela fabrica IA: ${config.appName}
-- Revise antes de executar no SQL Editor do Supabase.

do $$
begin
  if not exists (
    select 1
    from public.tenants
    where slug = ${sqlLiteral(config.tenantSlug)}
  ) then
    perform public.saas_admin_create_empresa(
      ${sqlLiteral(config.appName)},
      ${sqlLiteral(config.tenantSlug)},
      null,
      ${sqlLiteral(domain)}
    );
  end if;
end $$;

update public.tenants
set
  public_signup_enabled = true,
  logo_url = coalesce(${sqlLiteral(assets.logoUrl)}, logo_url),
  cor_primaria = coalesce(${sqlLiteral(colors.primary)}, cor_primaria),
  cor_secundaria = coalesce(${sqlLiteral(colors.secondary)}, cor_secundaria)
where slug = ${sqlLiteral(config.tenantSlug)};

insert into public.app_branding (
  tenant_slug,
  app_name,
  slogan,
  primary_color,
  secondary_color,
  accent_color,
  logo_url,
  support_whatsapp,
  active
)
values (
  ${sqlLiteral(config.tenantSlug)},
  ${sqlLiteral(config.appName)},
  ${sqlLiteral(slogan)},
  ${sqlLiteral(colors.primary || "#facc15")},
  ${sqlLiteral(colors.secondary || "#020617")},
  ${sqlLiteral(colors.accent || "#1e293b")},
  ${sqlLiteral(assets.logoUrl || null)},
  ${sqlLiteral(whatsapp)},
  true
)
on conflict (tenant_slug) do update
set
  app_name = excluded.app_name,
  slogan = excluded.slogan,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  logo_url = excluded.logo_url,
  support_whatsapp = excluded.support_whatsapp,
  active = excluded.active;
`;
}

function buildArtifacts(run: Record<string, unknown>) {
  const config = createClientConfig(run);
  const slug = String(config.tenantSlug);
  const basePath = `clients/${slug}`;
  const clientJson = `${JSON.stringify(config, null, 2)}\n`;
  const provisionSql = generateProvisionSql(config);
  const manifest = {
    runId: run.id,
    slug,
    generatedAt: new Date().toISOString(),
    files: [`${basePath}/client.json`, `${basePath}/provision.sql`],
    nextCommands: [
      `npm run client:validate ${slug}`,
      `npm run client:sql ${slug}`,
      `npm run client:build:android ${slug}`,
    ],
    safety: "Builds e escrita em clients/ seguem bloqueados ate aprovacao humana operacional.",
  };

  return [
    {
      artifact_type: "client_json",
      file_path: `${basePath}/client.json`,
      content: clientJson,
      metadata: { slug, appName: config.appName },
    },
    {
      artifact_type: "provision_sql",
      file_path: `${basePath}/provision.sql`,
      content: provisionSql,
      metadata: { slug, appName: config.appName },
    },
    {
      artifact_type: "manifest",
      file_path: `${basePath}/ai-factory-manifest.json`,
      content: `${JSON.stringify(manifest, null, 2)}\n`,
      metadata: { slug, appName: config.appName },
    },
  ];
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const metadata = requestMetadata(req);

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Credenciais Supabase ausentes para gerar artefatos.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Token ausente." }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return json({ error: "Usuario nao autenticado." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const runId = String(body?.runId || "").trim();
    if (!runId) {
      return json({ error: "runId obrigatorio." }, 400);
    }

    const { data: isSuperAdmin } = await supabaseAuth.rpc("is_super_admin").catch(() => ({ data: false }));
    if (!isSuperAdmin) {
      await insertAuditLog(supabaseAdmin, {
        user_id: user.id,
        action: "artifacts_denied_not_super_admin",
        status: "denied",
        ...metadata,
        metadata: { runId },
      });
      return json({ error: "Apenas super admin pode gerar artefatos white-label." }, 403);
    }

    const { data: run, error: runError } = await supabaseAdmin
      .from("ai_factory_runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (runError || !run) {
      throw new Error(runError?.message || "Run nao encontrada.");
    }

    if (run.approval_status !== "approved") {
      await insertAuditLog(supabaseAdmin, {
        run_id: run.id,
        tenant_id: run.tenant_id,
        user_id: user.id,
        action: "artifacts_denied_not_approved",
        status: "denied",
        ...metadata,
        metadata: { approvalStatus: run.approval_status },
      });
      return json({ error: "A run precisa estar aprovada antes de gerar artefatos." }, 409);
    }

    if (run.status !== "completed") {
      await insertAuditLog(supabaseAdmin, {
        run_id: run.id,
        tenant_id: run.tenant_id,
        user_id: user.id,
        action: "artifacts_denied_not_completed",
        status: "denied",
        ...metadata,
        metadata: { runStatus: run.status },
      });
      return json({ error: "A run precisa estar concluida antes de gerar artefatos." }, 409);
    }

    const artifacts = buildArtifacts(run).map((artifact) => ({
      ...artifact,
      run_id: run.id,
      tenant_id: run.tenant_id,
      created_by: user.id,
    }));

    const { data, error } = await supabaseAdmin
      .from("ai_factory_artifacts")
      .upsert(artifacts, { onConflict: "run_id,file_path" })
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    await insertAuditLog(supabaseAdmin, {
      run_id: run.id,
      tenant_id: run.tenant_id,
      user_id: user.id,
      action: "artifacts_generated",
      ...metadata,
      metadata: {
        artifactCount: data?.length || 0,
        files: (data || []).map((artifact) => artifact.file_path),
      },
    });

    return json({
      ok: true,
      runId,
      artifacts: data || [],
    });
  } catch (error) {
    console.log("[ai-factory-artifacts] erro:", error);
    return json({ error: error instanceof Error ? error.message : "Erro interno." }, 500);
  }
});
