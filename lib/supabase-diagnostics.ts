import { supabase } from "@/lib/supabase";
import { getSupabasePublicConfig, validateSupabasePublicConfig } from "@/lib/supabase-config";
import { observeAsync, recordObservation } from "@/lib/observability";

export type DiagnosticColor = "green" | "yellow" | "red";

export type DiagnosticItem = {
  key: string;
  label: string;
  status: DiagnosticColor;
  explanation: string;
  details?: Record<string, unknown>;
};

export type SupabaseSecurityCenterStatus = {
  generatedAt: string;
  items: DiagnosticItem[];
  raw?: Record<string, unknown> | null;
};

function colorFrom(value: unknown): DiagnosticColor {
  return value === "green" || value === "yellow" || value === "red" ? value : "yellow";
}

function item(key: string, label: string, status: DiagnosticColor, explanation: string, details?: Record<string, unknown>): DiagnosticItem {
  return { key, label, status, explanation, details };
}

function itemFromRaw(key: string, label: string, raw: unknown, fallback: string): DiagnosticItem {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return item(key, label, colorFrom(data.status), String(data.explanation || fallback), data);
}

export async function loadSupabaseSecurityCenterStatus(): Promise<SupabaseSecurityCenterStatus> {
  const config = getSupabasePublicConfig();
  const validation = validateSupabasePublicConfig(config);
  const generatedAt = new Date().toISOString();
  const localItems: DiagnosticItem[] = [
    item("variables", "Variáveis", validation.status as DiagnosticColor, validation.ok ? "Variáveis públicas do Supabase presentes." : validation.errors.join(" "), {
      source: config.source,
      warnings: validation.warnings,
      errors: validation.errors,
    }),
    item("keys", "Keys", validation.ok ? "green" : "red", "Service Role não é usada pelo cliente mobile/web. Anon key é pública por natureza.", {
      anonKeySource: config.source.anonKey,
    }),
  ];

  const { data, error } = await supabase.rpc("get_supabase_security_center_status");
  if (error || !data) {
    recordObservation({
      area: "supabase",
      operation: "security_center_rpc",
      status: "warn",
      metadata: { message: error?.message || "Sem dados" },
    });
    return {
      generatedAt,
      items: [
        item("connection", "Conexão", "red", error?.message || "RPC de diagnóstico indisponível."),
        ...localItems,
        item("database", "Banco", "yellow", "Não foi possível ler o diagnóstico SQL."),
        item("auth", "Auth", "yellow", "Sessão local existe, mas diagnóstico de auth depende da RPC."),
        item("storage", "Storage", "yellow", "Não foi possível validar buckets/policies via RPC."),
        item("realtime", "Realtime", "yellow", "Não foi possível validar publicação realtime via RPC."),
        item("cors", "CORS", "yellow", "Verifique EDGE_ALLOWED_ORIGINS nos Supabase Secrets."),
        item("edge_functions", "Edge Functions", "yellow", "Valide deploy e secrets pelo health endpoint."),
        item("buckets", "Buckets", "yellow", "Não foi possível listar buckets via RPC."),
        item("policies", "Policies", "yellow", "Não foi possível contar policies via RPC."),
        item("migrations", "Migrations", "yellow", "Não foi possível consultar schema_migrations via RPC."),
        item("triggers", "Triggers", "yellow", "Não foi possível contar triggers via RPC."),
        item("backups", "Backups", "yellow", "Backups/PITR dependem do painel Supabase."),
      ],
      raw: null,
    };
  }

  const raw = await observeAsync("supabase", "security_center_parse", async () => data as Record<string, unknown>);
  return {
    generatedAt: String(raw.generated_at || generatedAt),
    raw,
    items: [
      itemFromRaw("connection", "Conexão", raw.connection, "Conexão Supabase validada."),
      itemFromRaw("database", "Banco", raw.database, "Banco auditado."),
      itemFromRaw("auth", "Auth", raw.auth, "Auth auditado."),
      itemFromRaw("storage", "Storage", raw.storage, "Storage auditado."),
      itemFromRaw("realtime", "Realtime", raw.realtime, "Realtime auditado."),
      itemFromRaw("cors", "CORS", raw.cors, "CORS depende de EDGE_ALLOWED_ORIGINS."),
      itemFromRaw("edge_functions", "Edge Functions", raw.edge_functions, "Edge Functions dependem do health endpoint."),
      itemFromRaw("buckets", "Buckets", raw.buckets, "Buckets auditados."),
      itemFromRaw("policies", "Policies", raw.policies, "Policies auditadas."),
      ...localItems,
      itemFromRaw("migrations", "Migrations", raw.migrations, "Migrations auditadas."),
      itemFromRaw("triggers", "Triggers", raw.triggers, "Triggers auditados."),
      itemFromRaw("backups", "Backups", raw.backups, "Backups dependem do painel Supabase."),
    ],
  };
}
