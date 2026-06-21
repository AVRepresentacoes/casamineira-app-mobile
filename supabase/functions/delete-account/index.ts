// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  motivo?: string;
  nota_experiencia?: number | null;
  comentario?: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Credenciais do Supabase ausentes na function.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Token ausente." }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Usuário não autenticado." }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const motivo = String(body?.motivo || "").trim();
    const comentario = String(body?.comentario || "").trim() || null;
    const nota =
      body?.nota_experiencia == null || body?.nota_experiencia === ""
        ? null
        : Number(body.nota_experiencia);

    if (!motivo) {
      return jsonResponse({ error: "Motivo é obrigatório." }, 400);
    }

    if (nota != null && (!Number.isInteger(nota) || nota < 0 || nota > 10)) {
      return jsonResponse({ error: "A nota deve estar entre 0 e 10." }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: existingRequest } = await supabaseAdmin
      .from("account_deletion_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing", "completed"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRequest?.status === "completed") {
      return jsonResponse({ ok: true, alreadyDeleted: true });
    }

    if (existingRequest?.status === "pending" || existingRequest?.status === "processing") {
      return jsonResponse({ error: "Já existe uma solicitação de exclusão em andamento." }, 409);
    }

    const { data: tenantId } = await supabaseAuth.rpc("current_tenant_id");

    const requestPayload = {
      tenant_id: tenantId || null,
      user_id: user.id,
      user_email: user.email || null,
      motivo,
      nota_experiencia: nota,
      comentario,
      status: "processing",
      metadata: {
        provider: user.app_metadata?.provider || null,
        providers: user.app_metadata?.providers || [],
        requested_via: "mobile_app",
      },
    };

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from("account_deletion_requests")
      .insert(requestPayload)
      .select("id")
      .single();

    if (requestError || !requestRow) {
      throw new Error(requestError?.message || "Não foi possível registrar a exclusão.");
    }

    const deleteResult = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteResult.error) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "failed",
          processed_at: new Date().toISOString(),
          failure_reason: deleteResult.error.message,
        })
        .eq("id", requestRow.id);

      throw new Error(deleteResult.error.message);
    }

    const { error: finalizeError } = await supabaseAdmin
      .from("account_deletion_requests")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq("id", requestRow.id);

    if (finalizeError) {
      throw new Error(finalizeError.message);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.log("[delete-account] erro:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Erro interno.",
      },
      500,
    );
  }
});
