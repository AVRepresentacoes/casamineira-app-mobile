// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";


type Body = { pedidoId?: string };

async function syncGasPedidoPix(params: {
  supabaseAdmin: any;
  pedidoId: string;
  paymentId: string;
  statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada";
}) {
  const { supabaseAdmin, pedidoId, paymentId, statusPagamento } = params;
  const normalizedStatus = statusPagamento === "aprovada" ? "paid" : statusPagamento === "recusada" ? "failed" : statusPagamento === "estornada" ? "refunded" : "pending";
  const pedidoStatus = statusPagamento === "aprovada" ? "pago" : statusPagamento === "recusada" ? "pagamento_recusado" : statusPagamento === "estornada" ? "estornado" : "aguardando_pagamento";

  const { error } = await supabaseAdmin
    .from("gas_pedidos")
    .update({
      status: pedidoStatus,
      status_pagamento: normalizedStatus,
      payment_id: paymentId,
      metodo_pagamento: "pix",
    })
    .eq("pedido_id", pedidoId);

  if (error) {
    throw new Error(error.message);
  }
}

function mapAsaasStatus(status: string): "pendente" | "aprovada" | "recusada" | "estornada" {
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(status)) return "aprovada";
  if (["REFUNDED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE", "AWAITING_CHARGEBACK_REVERSAL", "DUNNING_RECEIVED", "PARTIAL_REFUND_REQUESTED", "REFUND_REQUESTED"].includes(status)) return "estornada";
  if (["OVERDUE", "DELETED"].includes(status)) return "recusada";
  return "pendente";
}

async function asaasFetch(path: string, apiKey: string, init?: RequestInit) {
  return await fetch(`https://api.asaas.com/v3${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(init?.headers || {}),
    },
  });
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
    const asaasApiKey = String(Deno.env.get("ASAAS_API_KEY") || "").trim();

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Credenciais do Supabase ausentes na function.");
    }

    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY não configurado.");
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

    if (["finalizado", "cancelado"].includes(String(pedido.status || ""))) {
      return new Response(JSON.stringify({ error: "Pedido não está elegível para pagamento." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
        { onConflict: "pedido_id" },
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

    const customerLookupResp = await asaasFetch(
      `/customers?externalReference=${encodeURIComponent(user.id)}&limit=1`,
      asaasApiKey,
    );
    const customerLookupJson = await customerLookupResp.json();
    if (!customerLookupResp.ok) {
      throw new Error(customerLookupJson?.errors?.[0]?.description || "Falha ao consultar cliente no Asaas.");
    }

    let customerId = customerLookupJson?.data?.[0]?.id || null;

    if (!customerId) {
      const customerPayload = {
        name: (user.user_metadata?.name || user.email || "Cliente Casa Mineira").toString(),
        email: user.email || undefined,
        cpfCnpj: undefined,
        externalReference: user.id,
      };

      const customerResp = await asaasFetch("/customers", asaasApiKey, {
        method: "POST",
        body: JSON.stringify(customerPayload),
      });
      const customerJson = await customerResp.json();
      if (!customerResp.ok || !customerJson?.id) {
        throw new Error(customerJson?.errors?.[0]?.description || "Falha ao criar cliente no Asaas.");
      }
      customerId = customerJson.id;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateIso = dueDate.toISOString().slice(0, 10);

    const asaasPaymentResp = await asaasFetch("/payments", asaasApiKey, {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: Number(valorTotal.toFixed(2)),
        dueDate: dueDateIso,
        description: `Pagamento de serviço #${pedidoId}`,
        externalReference: pedidoId,
      }),
    });
    const asaasPaymentJson = await asaasPaymentResp.json();
    if (!asaasPaymentResp.ok || !asaasPaymentJson?.id) {
      throw new Error(asaasPaymentJson?.errors?.[0]?.description || "Falha ao gerar cobrança PIX no Asaas.");
    }

    const asaasPaymentId = String(asaasPaymentJson.id);
    const asaasStatus = String(asaasPaymentJson.status || "PENDING");
    const statusPagamento = mapAsaasStatus(asaasStatus);

    const qrResp = await asaasFetch(`/payments/${encodeURIComponent(asaasPaymentId)}/pixQrCode`, asaasApiKey);
    const qrJson = await qrResp.json();
    if (!qrResp.ok || !qrJson?.payload || !qrJson?.encodedImage) {
      throw new Error(qrJson?.errors?.[0]?.description || "Falha ao obter QR Code PIX no Asaas.");
    }

    const qrCode = String(qrJson.payload);
    const base64Raw = String(qrJson.encodedImage || "");
    const qrCodeBase64 = base64Raw.startsWith("data:image")
      ? base64Raw.split(",")[1] || ""
      : base64Raw;

    const { error: pagamentoError } = await supabaseAdmin.from("pagamentos").upsert(
      {
        tenant_id: pedido.tenant_id,
        pedido_id: pedidoId,
        profissional_id: profissionalId,
        valor_total: Number(comissao.valor_total),
        valor_comissao: Number(comissao.valor_comissao),
        valor_profissional: Number(comissao.valor_profissional),
        payment_id: asaasPaymentId,
        external_reference: pedidoId,
        init_point: null,
        status_pagamento: statusPagamento,
      },
      { onConflict: "pedido_id" },
    );

    if (pagamentoError) {
      throw new Error(pagamentoError.message);
    }

    await syncGasPedidoPix({
      supabaseAdmin,
      pedidoId,
      paymentId: asaasPaymentId,
      statusPagamento,
    });

    return new Response(
      JSON.stringify({
        payment_id: asaasPaymentId,
        status_pagamento: statusPagamento,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[create-asaas-pix-payment] erro:", error);

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
