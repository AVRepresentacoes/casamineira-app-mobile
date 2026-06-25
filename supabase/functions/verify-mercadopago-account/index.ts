// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";


type Body = {
  accessToken?: string;
};

Deno.serve(async (req) => {
  const corsHeaders = createCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Credenciais Supabase ausentes.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token ausente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const accessToken = String(body?.accessToken || "").trim();

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access Token é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpResp = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const mpJson = await mpResp.json().catch(() => ({}));

    if (!mpResp.ok) {
      const detalhe =
        mpJson?.message ||
        mpJson?.error_description ||
        mpJson?.cause?.[0]?.description ||
        "Token inválido no Mercado Pago.";

      return new Response(
        JSON.stringify({
          valid: false,
          error: detalhe,
          status: mpResp.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        provider_user_id: String(mpJson?.id || ""),
        nickname: String(mpJson?.nickname || ""),
        email: String(mpJson?.email || ""),
        site_status: String(mpJson?.site_status || ""),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.log("[verify-mercadopago-account] erro:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
