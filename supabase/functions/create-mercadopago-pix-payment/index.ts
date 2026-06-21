// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = { pedidoId?: string };

function mapMpStatus(status: string): "pendente" | "aprovada" | "recusada" | "estornada" {
  if (status === "approved") return "aprovada";
  if (["rejected", "cancelled"].includes(status)) return "recusada";
  if (["refunded", "charged_back"].includes(status)) return "estornada";
  return "pendente";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
      .select("payment_id, status_pagamento, init_point")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    if (pagamentoAtual?.status_pagamento === "aprovada") {
      return new Response(
        JSON.stringify({
          payment_id: pagamentoAtual.payment_id,
          status_pagamento: "aprovada",
          qr_code: null,
          qr_code_base64: null,
          ticket_url: pagamentoAtual.init_point || null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let profissionalId = pedido?.profissional_id || pedido?.prestador_id || null;

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

    const payerEmail = user.email || `cliente-${user.id.slice(0, 8)}@casamineira.app`;

    const paymentPayload: any = {
      transaction_amount: Number(valorTotal.toFixed(2)),
      description: `Pagamento de serviço #${pedidoId}`,
      payment_method_id: "pix",
      notification_url: webhookUrl,
      external_reference: pedidoId,
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
      paymentPayload.application_fee = Number(Number(comissao.valor_comissao || 0).toFixed(2));
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `pix-${pedidoId}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const mpJson = await mpResponse.json();

    if (!mpResponse.ok) {
      console.log("[MP] erro create pix payment", mpJson);
      throw new Error(mpJson?.message || "Falha ao gerar pagamento PIX no Mercado Pago.");
    }

    const qrCode = mpJson?.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpJson?.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = mpJson?.point_of_interaction?.transaction_data?.ticket_url || null;
    const paymentId = String(mpJson?.id || "");
    const statusPagamento = mapMpStatus(String(mpJson?.status || ""));

    if (!paymentId || !qrCode || !qrCodeBase64) {
      throw new Error("Mercado Pago retornou payload PIX inválido.");
    }

    const { error: pagamentoError } = await supabaseAdmin.from("pagamentos").upsert(
      {
        tenant_id: pedido.tenant_id,
        pedido_id: pedidoId,
        profissional_id: profissionalId,
        valor_total: Number(comissao.valor_total),
        valor_comissao: Number(comissao.valor_comissao),
        valor_profissional: Number(comissao.valor_profissional),
        payment_id: paymentId,
        external_reference: pedidoId,
        init_point: ticketUrl,
        status_pagamento: statusPagamento,
        split_mode: splitMode,
        split_provider: splitMode ? "mercadopago" : null,
        split_destination_id: splitDestinationId,
      },
      { onConflict: "pedido_id" },
    );

    if (pagamentoError) {
      throw new Error(pagamentoError.message);
    }

    return new Response(
      JSON.stringify({
        payment_id: paymentId,
        status_pagamento: statusPagamento,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[create-mercadopago-pix-payment] erro:", error);

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
