// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";


type Body = { pedidoId?: string };

async function syncGasPedidoPreference(params: {
  supabaseAdmin: any;
  pedidoId: string;
  preferenceId: string;
}) {
  const { supabaseAdmin, pedidoId, preferenceId } = params;
  const { error } = await supabaseAdmin
    .from("gas_pedidos")
    .update({
      status: "aguardando_pagamento",
      status_pagamento: "pending",
      preference_id: preferenceId,
      metodo_pagamento: "mercadopago",
    })
    .eq("pedido_id", pedidoId);

  if (error) {
    throw new Error(error.message);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = createCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mercadoPagoToken = String(Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "").trim();
    const splitImmediateEnabled =
      String(Deno.env.get("MERCADO_PAGO_SPLIT_IMMEDIATE") || "false").toLowerCase() === "true";
    const splitRequiredEnabled =
      String(Deno.env.get("MERCADO_PAGO_SPLIT_REQUIRED") || "false").toLowerCase() === "true";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Credenciais do Supabase ausentes na function.");
    }

    if (!mercadoPagoToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
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
    const pedidoId = body?.pedidoId;

    if (!pedidoId) {
      return new Response(JSON.stringify({ error: "pedidoId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      throw new Error(pedidoError?.message || "Pedido não encontrado.");
    }

    if (["finalizado", "cancelado"].includes(String(pedido.status || ""))) {
      return new Response(JSON.stringify({ error: "Pedido não está elegível para pagamento." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pedido.cliente_id !== user.id) {
      return new Response(JSON.stringify({ error: "Sem permissão para este pedido." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pedido.proposta_aceita_id) {
      return new Response(JSON.stringify({ error: "Pedido sem proposta aceita." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pagamentoAtual } = await supabaseAdmin
      .from("pagamentos")
      .select("init_point, preference_id, status_pagamento")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    if (pagamentoAtual?.status_pagamento === "aprovada") {
      return new Response(
        JSON.stringify({
          init_point: pagamentoAtual.init_point,
          preference_id: pagamentoAtual.preference_id,
          status_pagamento: "aprovada",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let profissionalId =
      pedido?.profissional_id || pedido?.prestador_id || null;

    if (!profissionalId && pedido?.proposta_aceita_id) {
      const { data: propostaAceita } = await supabaseAdmin
        .from("propostas")
        .select("profissional_id")
        .eq("id", pedido.proposta_aceita_id)
        .maybeSingle();

      profissionalId = propostaAceita?.profissional_id || null;
    }

    if (!profissionalId) {
      throw new Error("Profissional do pedido não encontrado.");
    }

    const { data: propostaAceita, error: propostaAceitaError } = await supabaseAdmin
      .from("propostas")
      .select("id, profissional_id, valor")
      .eq("id", pedido.proposta_aceita_id)
      .maybeSingle();

    if (propostaAceitaError || !propostaAceita) {
      throw new Error("Comissão/proposta aceita não encontrada para o pedido.");
    }

    const valorBase = Number(propostaAceita.valor || pedido.valor_final || 0);
    if (!Number.isFinite(valorBase) || valorBase <= 0) {
      throw new Error("Valor inválido para pagamento.");
    }

    const subscriptionProfile = await resolveProfessionalCommissionProfile(
      supabaseAdmin,
      propostaAceita.profissional_id,
    );
    const percentual = subscriptionProfile.commissionRate;
    const valorComissao = Number((valorBase * percentual).toFixed(2));
    const valorProfissional = Number((valorBase - valorComissao).toFixed(2));

    const { data: comissao, error: comissaoUpsertError } = await supabaseAdmin
      .from("comissoes")
      .upsert(
        {
          tenant_id: pedido.tenant_id,
          pedido_id: pedidoId,
          profissional_id: propostaAceita.profissional_id,
          valor_total: valorBase,
          percentual,
          valor_comissao: valorComissao,
          valor_profissional: valorProfissional,
          status_pagamento: "aguardar_pagamento",
        },
        { onConflict: "pedido_id" }
      )
      .select("valor_total, valor_comissao, valor_profissional")
      .single();

    if (comissaoUpsertError || !comissao) {
      throw new Error(comissaoUpsertError?.message || "Falha ao preparar comissão para pagamento.");
    }

    const valorTotal = Number(comissao.valor_total || pedido.valor_final || 0);
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      throw new Error("Valor inválido para pagamento.");
    }

    let mpAccessToken = mercadoPagoToken;
    let splitMode = false;
    let splitDestinationId: string | null = null;

    const splitEnabled = splitImmediateEnabled || splitRequiredEnabled;

    if (splitEnabled) {
      const { data: gatewayAccount } = await supabaseAdmin
        .from("profissional_gateway_accounts")
        .select("access_token, provider_user_id, status")
        .eq("profissional_id", profissionalId)
        .eq("provider", "mercadopago")
        .eq("status", "active")
        .maybeSingle();

      if (!gatewayAccount?.access_token) {
        throw new Error(
          "Profissional sem conta Mercado Pago conectada para split imediato. Conecte a conta antes de cobrar."
        );
      }

      mpAccessToken = String(gatewayAccount.access_token).trim();
      splitMode = true;
      splitDestinationId = gatewayAccount.provider_user_id || null;
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;
    const appScheme = Deno.env.get("APP_SCHEME") || "casamineira://";

    const payerEmail = user.email || `cliente-${user.id.slice(0, 8)}@casamineira.app`;

    const preferencePayload = {
      items: [
        {
          title: "Pagamento de serviço no app",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(valorTotal.toFixed(2)),
        },
      ],
      external_reference: pedidoId,
      notification_url: webhookUrl,
      back_urls: {
        success: `${appScheme}pagamento/sucesso?pedido_id=${pedidoId}`,
        failure: `${appScheme}pagamento/falha?pedido_id=${pedidoId}`,
        pending: `${appScheme}pagamento/pendente?pedido_id=${pedidoId}`,
      },
      auto_return: "approved",
      metadata: {
        pedido_id: pedidoId,
        profissional_id: profissionalId,
        split_mode: splitMode,
        split_destination_id: splitDestinationId,
      },
      payer: {
        email: payerEmail,
      },
    };

    if (splitMode) {
      preferencePayload.marketplace_fee = Number(Number(comissao.valor_comissao || 0).toFixed(2));
    }

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpJson = await mpResponse.json();

    if (!mpResponse.ok) {
      console.log("[MP] erro create preference", mpJson);
      throw new Error(mpJson?.message || "Falha ao gerar pagamento no Mercado Pago.");
    }

    const initPoint = mpJson?.init_point || mpJson?.sandbox_init_point;
    const preferenceId = mpJson?.id;

    if (!initPoint || !preferenceId) {
      throw new Error("Mercado Pago retornou preference inválida.");
    }

    const { error: pagamentoError } = await supabaseAdmin.from("pagamentos").upsert(
      {
        tenant_id: pedido.tenant_id,
        pedido_id: pedidoId,
        profissional_id: profissionalId,
        valor_total: Number(comissao.valor_total),
        valor_comissao: Number(comissao.valor_comissao),
        valor_profissional: Number(comissao.valor_profissional),
        preference_id: preferenceId,
        external_reference: pedidoId,
        init_point: initPoint,
        status_pagamento: "pendente",
        split_mode: splitMode,
        split_provider: splitMode ? "mercadopago" : null,
        split_destination_id: splitDestinationId,
      },
      { onConflict: "pedido_id" },
    );

    if (pagamentoError) {
      throw new Error(pagamentoError.message);
    }

    await syncGasPedidoPreference({
      supabaseAdmin,
      pedidoId,
      preferenceId,
    });

    return new Response(
      JSON.stringify({
        init_point: initPoint,
        preference_id: preferenceId,
        status_pagamento: "pendente",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[create-mercadopago-preference] erro:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
