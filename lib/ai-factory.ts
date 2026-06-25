import { supabase } from "@/lib/supabase";

export type AiFactoryRequest = {
  prompt: string;
  dryRun?: boolean;
};

export type AiFactoryResponse = {
  ok: boolean;
  runId: string | null;
  persistenceEnabled: boolean;
  dryRun: boolean;
  model: string | null;
  result: Record<string, unknown>;
};

export type AiFactoryRun = {
  id: string;
  tenant_id: string;
  user_id: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed";
  dry_run: boolean;
  model: string | null;
  briefing: Record<string, unknown>;
  result: Record<string, unknown>;
  usage: Record<string, unknown>;
  estimated_cost_brl: number;
  approval_status: "pending" | "approved" | "rejected";
  approval_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type AiFactoryAgentLog = {
  id: string;
  run_id: string;
  tenant_id: string;
  agent_id: string;
  agent_name: string;
  status: "planned" | "running" | "completed" | "failed" | "skipped";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  usage: Record<string, unknown>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

export type AiFactoryArtifact = {
  id: string;
  run_id: string;
  tenant_id: string;
  artifact_type: "client_json" | "provision_sql" | "manifest" | "checklist";
  file_path: string;
  content: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type AiFactoryAuditLog = {
  id: string;
  run_id: string | null;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  status: "success" | "denied" | "failed";
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function runAiFactory(request: AiFactoryRequest): Promise<AiFactoryResponse> {
  const prompt = request.prompt.trim();
  if (prompt.length < 10) {
    throw new Error("Descreva o aplicativo com pelo menos 10 caracteres.");
  }

  const { data, error } = await supabase.functions.invoke("ai-orchestrator", {
    body: {
      prompt,
      dryRun: request.dryRun ?? true,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Nao foi possivel executar a fabrica de IA.");
  }

  return data as AiFactoryResponse;
}

export async function listAiFactoryRuns() {
  const { data, error } = await supabase
    .from("ai_factory_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AiFactoryRun[];
}

export async function listAiFactoryAgentLogs(runId: string) {
  const { data, error } = await supabase
    .from("ai_factory_agent_logs")
    .select("*")
    .eq("run_id", runId)
    .order("started_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AiFactoryAgentLog[];
}

export async function updateAiFactoryRunApproval(
  runId: string,
  approvalStatus: "approved" | "rejected",
  notes?: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { error } = await supabase
    .from("ai_factory_runs")
    .update({
      approval_status: approvalStatus,
      approval_notes: notes?.trim() || null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAiFactoryArtifacts(runId: string) {
  const { data, error } = await supabase
    .from("ai_factory_artifacts")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AiFactoryArtifact[];
}

export async function generateAiFactoryArtifacts(runId: string) {
  const { data, error } = await supabase.functions.invoke("ai-factory-artifacts", {
    body: { runId },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Nao foi possivel gerar artefatos white-label.");
  }

  return (data.artifacts || []) as AiFactoryArtifact[];
}

export async function listAiFactoryAuditLogs(runId: string) {
  const { data, error } = await supabase
    .from("ai_factory_audit_logs")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AiFactoryAuditLog[];
}
