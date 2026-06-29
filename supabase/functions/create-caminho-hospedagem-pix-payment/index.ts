// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";


function json(body: Record<string, unknown>, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapMpStatus(status: string): "pendente" | "aprovada" | "recusada" | "estornada" {
  if (status === "approved") return "aprovada";
  if (["rejected", "cancelled"].includes(status)) return "recusada";
  if (["refunded", "charged_back"].includes(status)) return "estornada";
  return "pendente";
}

serve(async (req) => {
  const corsHeaders = createCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const provider = String(Deno.env.get("HOSPEDAGENS_PAYMENT_PROVIDER") || Deno.env.get("PAYMENT_PROVIDER") || "mercadopago")
      .trim()
      .toLowerCase();

    if (!supabaseUrl || !supabaseAnonKey || !serviceRole) {
      return json({ error: "Configuração Supabase ausente." }, 500, corsHeaders);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return json({ error: "Usuário não autenticado." }, 401, corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const reservaId = String(body?.reservaId || "").trim();
    const metodo = String(body?.metodo || "pix").trim().toLowerCase();

    if (!reservaId) {
      return json({ error: "reservaId é obrigatório." }, 400, corsHeaders);
    }

    if (!["pix", "cartao"].includes(metodo)) {
      return json({ error: "Método de pagamento inválido." }, 400, corsHeaders);
    }

    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from("caminho_hospedagem_reservas")
      .select("*")
      .eq("id", reservaId)
      .eq("cliente_id", user.id)
      .maybeSingle();

    if (reservaError || !reserva) {
      return json({ error: reservaError?.message || "Reserva não encontrada." }, 404, corsHeaders);
    }

    if (reserva.status_pagamento === "aprovada") {
      return json({
        checkoutConfigured: true,
        provider: reserva.provider || provider,
        reservaId,
        valorSinal: Number(reserva.sinal || 0),
        payment_id: reserva.provider_payment_id || null,
        status_pagamento: "aprovada",
        message: "Sinal desta reserva já está aprovado.",
      }, 200, corsHeaders);
    }

    const valorSinal = Number(reserva.sinal || 0);
    if (!Number.isFinite(valorSinal) || valorSinal <= 0) {
      return json({ error: "Valor do sinal inválido." }, 400, corsHeaders);
    }

    if (provider === "asaas") {
      const asaasApiKey = String(Deno.env.get("ASAAS_API_KEY") || "").trim();
      if (!asaasApiKey) {
        return json({
          checkoutConfigured: false,
          provider,
          reservaId,
          valorSinal,
          message: metodo === "cartao"
            ? "Cartão Asaas pronto. Configure ASAAS_API_KEY para ativar cobrança real."
            : "PIX Asaas pronto. Configure ASAAS_API_KEY para ativar cobrança real.",
        }, 200, corsHeaders);
      }

      return json({
        checkoutConfigured: false,
        provider,
        reservaId,
        valorSinal,
        message: "Credencial Asaas encontrada. Implementação final do endpoint de cobrança deve ser ativada antes da produção.",
      }, 200, corsHeaders);
    }

    const mercadoPagoToken = String(
      Deno.env.get("HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN") ||
        Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ||
        Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ||
        "",
    ).trim();

    if (!mercadoPagoToken) {
      return json({
        checkoutConfigured: false,
        provider: "mercadopago",
        reservaId,
        valorSinal,
        message: metodo === "cartao"
          ? "Cartão Mercado Pago pronto. Configure MERCADO_PAGO_ACCESS_TOKEN para ativar cobrança real."
          : "PIX Mercado Pago pronto. Configure MERCADO_PAGO_ACCESS_TOKEN para ativar cobrança real.",
      }, 200, corsHeaders);
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;
    const payerEmail = user.email || `cliente-${user.id.slice(0, 8)}@hospedagenscaminhosdafe.app`;
    const externalReference = `caminho_hospedagem:${reservaId}`;
    const basePayload: any = {
      transaction_amount: Number(valorSinal.toFixed(2)),
      description: `Sinal de reserva - ${reserva.hospedagem_nome}`,
      notification_url: webhookUrl,
      external_reference: externalReference,
      metadata: {
        reserva_id: reservaId,
        tenant_id: reserva.tenant_id,
        quarto_id: reserva.quarto_id,
        produto: "hospedagens_caminhos_da_fe",
        hospedagem_slug: reserva.hospedagem_slug,
        metodo,
      },
      payer: { email: payerEmail },
    };

    if (metodo === "pix") {
      const paymentPayload = { ...basePayload, payment_method_id: "pix" };
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `caminho-pix-${reservaId}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      const mpJson = await mpResponse.json();
      if (!mpResponse.ok) {
        console.log("[Hospedagens MP] erro pix", mpJson);
        return json({ error: mpJson?.message || "Falha ao gerar pagamento PIX no Mercado Pago." }, 500, corsHeaders);
      }

      const qrCode = mpJson?.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = mpJson?.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = mpJson?.point_of_interaction?.transaction_data?.ticket_url || null;
      const paymentId = String(mpJson?.id || "");
      const statusPagamento = mapMpStatus(String(mpJson?.status || ""));

      if (!paymentId || !qrCode || !qrCodeBase64) {
        return json({ error: "Mercado Pago retornou payload PIX inválido." }, 500, corsHeaders);
      }

      await supabaseAdmin
        .from("caminho_hospedagem_reservas")
        .update({
          provider: "mercadopago",
          provider_payment_id: paymentId,
          status_pagamento: statusPagamento,
          status: statusPagamento === "aprovada" ? "confirmada" : "aguardando_pagamento",
        })
        .eq("id", reservaId);

      return json({
        checkoutConfigured: true,
        provider: "mercadopago",
        reservaId,
        valorSinal,
        payment_id: paymentId,
        status_pagamento: statusPagamento,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
      }, 200, corsHeaders);
    }

    const token = String(body?.token || "").trim();
    const paymentMethodId = String(body?.payment_method_id || "").trim();
    const issuerId = String(body?.issuer_id || "").trim();
    const identificationType = String(body?.identification_type || "CPF").trim().toUpperCase();
    const identificationNumber = String(body?.identification_number || "").replace(/\D/g, "");
    const installments = Number(body?.installments || 1);

    if (!token || !paymentMethodId) {
      return json({ error: "Token e bandeira do cartão são obrigatórios." }, 400, corsHeaders);
    }

    if (!identificationNumber) {
      return json({ error: "CPF/CNPJ do pagador é obrigatório." }, 400, corsHeaders);
    }

    if (!Number.isFinite(installments) || installments < 1 || installments > 12) {
      return json({ error: "Quantidade de parcelas inválida." }, 400, corsHeaders);
    }

    const cardPayload: any = {
      ...basePayload,
      token,
      installments: Math.floor(installments),
      payment_method_id: paymentMethodId,
      payer: {
        email: payerEmail,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
    };

    if (issuerId) cardPayload.issuer_id = issuerId;

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mercadoPagoToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `caminho-card-${reservaId}-${token.slice(0, 16)}`,
      },
      body: JSON.stringify(cardPayload),
    });

    const mpJson = await mpResponse.json();
    if (!mpResponse.ok) {
      console.log("[Hospedagens MP] erro cartao", mpJson);
      return json(
        { error: mpJson?.message || mpJson?.cause?.[0]?.description || "Falha no pagamento com cartão." },
        500,
        corsHeaders
      );
    }

    const paymentId = String(mpJson?.id || "");
    const statusPagamento = mapMpStatus(String(mpJson?.status || ""));
    const statusDetail = String(mpJson?.status_detail || "");

    if (!paymentId) {
      return json({ error: "Mercado Pago retornou payload de cartão inválido." }, 500, corsHeaders);
    }

    await supabaseAdmin
      .from("caminho_hospedagem_reservas")
      .update({
        provider: "mercadopago",
        provider_payment_id: paymentId,
        status_pagamento: statusPagamento,
        status: statusPagamento === "aprovada" ? "confirmada" : "aguardando_pagamento",
      })
      .eq("id", reservaId);

    return json({
      checkoutConfigured: true,
      provider: "mercadopago",
      reservaId,
      valorSinal,
      payment_id: paymentId,
      status_pagamento: statusPagamento,
      status_detail: statusDetail || null,
      transaction_amount: Number(mpJson?.transaction_amount || valorSinal),
    }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado." }, 500, corsHeaders);
  }
});
