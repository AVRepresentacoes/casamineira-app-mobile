// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";


function mapMpStatus(status: string): "pendente" | "aprovada" | "recusada" | "estornada" {
  if (status === "approved") return "aprovada";
  if (["rejected", "cancelled"].includes(status)) return "recusada";
  if (["refunded", "charged_back"].includes(status)) return "estornada";
  return "pendente";
}

function mapComissaoStatus(statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada") {
  if (statusPagamento === "aprovada") return "pago";
  if (statusPagamento === "recusada") return "recusado";
  if (statusPagamento === "estornada") return "estornado";
  return "aguardar_pagamento";
}

function mapGasPaymentStatus(statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada") {
  if (statusPagamento === "aprovada") return "paid";
  if (statusPagamento === "recusada") return "failed";
  if (statusPagamento === "estornada") return "refunded";
  return "pending";
}

function mapGasOrderStatus(statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada") {
  if (statusPagamento === "aprovada") return "pago";
  if (statusPagamento === "recusada") return "pagamento_recusado";
  if (statusPagamento === "estornada") return "estornado";
  return "aguardando_pagamento";
}

type MercadoPagoProduct = "servicos" | "hospedagens";

function parseProductReference(rawReference: string, metadata: any): {
  product: MercadoPagoProduct;
  entityId: string;
  legacy: boolean;
} | null {
  const reference = String(rawReference || "").trim();
  if (reference.startsWith("caminho_hospedagem:")) {
    const entityId = reference.replace("caminho_hospedagem:", "").trim();
    return entityId ? { product: "hospedagens", entityId, legacy: false } : null;
  }

  if (reference.startsWith("casa_mineira_servicos:")) {
    const entityId = reference.replace("casa_mineira_servicos:", "").trim();
    return entityId ? { product: "servicos", entityId, legacy: false } : null;
  }

  const metadataProduct = String(metadata?.product_id || metadata?.produto || "").trim();
  const metadataPedidoId = String(metadata?.pedido_id || "").trim();
  if (metadataProduct === "casa_mineira_servicos" && metadataPedidoId) {
    return { product: "servicos", entityId: metadataPedidoId, legacy: false };
  }

  if (reference && !reference.includes(":")) {
    return { product: "servicos", entityId: reference, legacy: true };
  }

  return null;
}

async function syncGasPedidoStatus(params: {
  supabaseAdmin: any;
  pedidoId: string;
  paymentId?: string | null;
  preferenceId?: string | null;
  metodoPagamento?: string | null;
  statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada";
}) {
  const { supabaseAdmin, pedidoId, paymentId, preferenceId, metodoPagamento, statusPagamento } = params;
  await supabaseAdmin
    .from("gas_pedidos")
    .update({
      status: mapGasOrderStatus(statusPagamento),
      status_pagamento: mapGasPaymentStatus(statusPagamento),
      payment_id: paymentId || null,
      preference_id: preferenceId || null,
      metodo_pagamento: metodoPagamento || null,
    })
    .eq("pedido_id", pedidoId);
}

async function syncHospedagemReservaStatus(params: {
  supabaseAdmin: any;
  reservaId: string;
  paymentId?: string | null;
  tenantId?: string | null;
  statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada";
}) {
  const { supabaseAdmin, reservaId, paymentId, tenantId, statusPagamento } = params;

  const { data: reserva, error: reservaError } = await supabaseAdmin
    .from("caminho_hospedagem_reservas")
    .select("id,tenant_id,provider_payment_id,status_pagamento,status")
    .eq("id", reservaId)
    .maybeSingle();

  if (reservaError || !reserva) {
    console.log("[hospedagens.webhook] erro_supabase", {
      reserva_id: reservaId,
      payment_id: paymentId || null,
      message: reservaError?.message || "Reserva de hospedagem nao encontrada.",
    });
    throw new Error(reservaError?.message || "Reserva de hospedagem não encontrada.");
  }

  if (tenantId && String(reserva.tenant_id) !== String(tenantId)) {
    console.log("[hospedagens.webhook] webhook_ignorado", {
      reserva_id: reservaId,
      payment_id: paymentId || null,
      reason: "tenant_mismatch",
      tenant_id_pagamento: tenantId,
      tenant_id_reserva: reserva.tenant_id,
    });
    throw new Error("Tenant da reserva não confere com o pagamento.");
  }

  const currentPaymentId = String(reserva.provider_payment_id || "");
  if (currentPaymentId && paymentId && currentPaymentId !== String(paymentId)) {
    console.log("[hospedagens.webhook] webhook_ignorado", {
      reserva_id: reservaId,
      payment_id: paymentId,
      reason: "payment_id_mismatch",
      current_payment_id: currentPaymentId,
    });
    throw new Error("Pagamento Mercado Pago não confere com a reserva.");
  }

  const jaAprovada = String(reserva.status_pagamento || "") === "aprovada";
  if (jaAprovada && statusPagamento !== "aprovada" && statusPagamento !== "estornada") {
    console.log("[hospedagens.webhook] webhook_ignorado", {
      reserva_id: reservaId,
      payment_id: paymentId || currentPaymentId || null,
      reason: "downgrade_pos_confirmacao",
      incoming_status: statusPagamento,
    });
    return;
  }

  const statusReserva =
    statusPagamento === "aprovada"
      ? "confirmada"
      : statusPagamento === "recusada"
      ? "aguardando_pagamento"
      : statusPagamento === "estornada"
      ? "cancelada_cliente"
      : "aguardando_pagamento";

  const { error } = await supabaseAdmin
    .from("caminho_hospedagem_reservas")
    .update({
      provider: "mercadopago",
      provider_payment_id: paymentId || currentPaymentId || null,
      status_pagamento: statusPagamento,
      status: statusReserva,
      ...(statusPagamento === "estornada" ? { cancelado_por: "sistema" } : {}),
    })
    .eq("id", reservaId);

  if (error) {
    console.log("[hospedagens.webhook] erro_supabase", {
      reserva_id: reservaId,
      payment_id: paymentId || currentPaymentId || null,
      status_pagamento: statusPagamento,
      message: error.message,
    });
    throw new Error(error.message);
  }

  console.log("[hospedagens.webhook] pagamento_confirmado", {
    reserva_id: reservaId,
    payment_id: paymentId || currentPaymentId || null,
    status_pagamento: statusPagamento,
    status: statusReserva,
  });
}

async function baixarEstoquePedido(params: { supabaseAdmin: any; pedidoId: string; tenantId: string | null }) {
  const { supabaseAdmin, pedidoId, tenantId } = params;
  const { data: itens, error: itensError } = await supabaseAdmin
    .from("pedido_produtos_itens")
    .select("produto_id, fornecedor_id, quantidade, titulo")
    .eq("pedido_id", pedidoId)
    .eq("tenant_id", tenantId);

  if (itensError) {
    throw new Error(itensError.message);
  }

  for (const item of itens || []) {
    const quantidade = Math.max(1, Number(item.quantidade || 1));
    const { data: produtoAtual, error: stockError } = await supabaseAdmin
      .from("produtos_fornecedor")
      .select("estoque")
      .eq("id", item.produto_id)
      .eq("fornecedor_id", item.fornecedor_id)
      .maybeSingle();

    const estoqueAtual = Number(produtoAtual?.estoque || 0);
    if (stockError || !Number.isFinite(estoqueAtual) || estoqueAtual < quantidade) {
      throw new Error(`Falha ao validar estoque do item ${item.titulo || item.produto_id}.`);
    }

    const { error: updateFinalError } = await supabaseAdmin
      .from("produtos_fornecedor")
      .update({ estoque: Math.max(0, estoqueAtual - quantidade) })
      .eq("id", item.produto_id)
      .eq("fornecedor_id", item.fornecedor_id);

    if (updateFinalError) {
      throw new Error(updateFinalError.message);
    }
  }
}

async function creditarCarteiraProfissional(params: {
  supabaseAdmin: any;
  tenantId: string | null;
  profissionalId: string;
  pedidoId: string;
  valorProfissional: number;
  providerMeta?: any;
}) {
  const { supabaseAdmin, tenantId, profissionalId, pedidoId, valorProfissional, providerMeta } = params;
  const valor = Number(valorProfissional || 0);
  if (!Number.isFinite(valor) || valor <= 0) return;

  const { data: walletRows } = await supabaseAdmin
    .from("wallets")
    .select("id, saldo")
    .eq("user_id", profissionalId)
    .order("created_at", { ascending: true })
    .limit(1);

  let wallet = Array.isArray(walletRows) ? walletRows[0] : null;

  if (!wallet) {
    const { data: novaWallet, error: novaWalletError } = await supabaseAdmin
      .from("wallets")
      .insert({
        tenant_id: tenantId,
        user_id: profissionalId,
        saldo: 0,
        bloqueado: 0,
      })
      .select("id, saldo")
      .single();

    if (novaWalletError) {
      throw new Error(novaWalletError.message);
    }

    wallet = novaWallet;
  }

  if (!wallet?.id) return;

  const { error: txInsertError } = await supabaseAdmin.from("wallet_transactions").insert({
    tenant_id: tenantId,
    user_id: profissionalId,
    tipo: "credito_pagamento",
    valor,
    descricao: `Crédito de pagamento aprovado do pedido ${pedidoId}`,
    status: "confirmado",
    referencia_tipo: "pagamento_aprovado",
    referencia_id: pedidoId,
    metadata: providerMeta || {},
  });

  if (txInsertError) {
    if (String(txInsertError.code) === "23505") {
      return;
    }
    throw new Error(txInsertError.message);
  }

  const saldoAtual = Number(wallet.saldo || 0);
  const { error: walletUpdateError } = await supabaseAdmin
    .from("wallets")
    .update({ saldo: Number((saldoAtual + valor).toFixed(2)) })
    .eq("id", wallet.id);

  if (walletUpdateError) {
    throw new Error(walletUpdateError.message);
  }
}

async function hmacSha256Hex(secret: string, input: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function validarAssinaturaMercadoPago(req: Request, paymentId: string) {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) return true;

  const signatureHeader = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.trim().split("="))
      .filter((pair) => pair.length === 2),
  ) as Record<string, string>;

  const ts = parts.ts || "";
  const v1 = parts.v1 || "";
  if (!ts || !v1) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const local = await hmacSha256Hex(secret, manifest);
  return local.toLowerCase() === v1.toLowerCase();
}

async function getMercadoPagoTokenCandidates(params: {
  supabaseAdmin: any;
  platformToken: string;
  notificationUserId?: string | null;
}) {
  const { supabaseAdmin, platformToken, notificationUserId } = params;
  const candidates: Array<{ label: string; token: string }> = [];

  const normalizedUserId = String(notificationUserId || "").trim();
  if (normalizedUserId) {
    const { data: sellerAccounts } = await supabaseAdmin
      .from("profissional_gateway_accounts")
      .select("access_token, mp_access_token, provider_user_id, mp_user_id")
      .eq("provider", "mercadopago")
      .eq("status", "active")
      .or(`provider_user_id.eq.${normalizedUserId},mp_user_id.eq.${normalizedUserId}`);

    for (const account of sellerAccounts || []) {
      const sellerToken = String(account.access_token || account.mp_access_token || "").trim();
      if (sellerToken && !candidates.some((candidate) => candidate.token === sellerToken)) {
        candidates.push({ label: `seller:${normalizedUserId}`, token: sellerToken });
      }
    }
  }

  if (!candidates.some((candidate) => candidate.token === platformToken)) {
    candidates.push({ label: "platform", token: platformToken });
  }

  return candidates;
}

async function fetchMercadoPagoPayment(params: {
  paymentId: string;
  tokenCandidates: Array<{ label: string; token: string }>;
}) {
  const { paymentId, tokenCandidates } = params;
  let lastErrorPayload: any = null;

  for (const candidate of tokenCandidates) {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${candidate.token}`,
      },
    });

    const mpPayment = await mpResponse.json().catch(() => ({}));

    if (mpResponse.ok) {
      return { payment: mpPayment, tokenLabel: candidate.label };
    }

    lastErrorPayload = mpPayment;
    console.log("[hospedagens.webhook] retry_token_candidate_failed", {
      token_label: candidate.label,
      payment_id: paymentId,
      status: mpResponse.status,
      error: mpPayment,
    });
  }

  throw new Error(lastErrorPayload?.message || "Não foi possível validar pagamento no Mercado Pago.");
}

Deno.serve(async (req) => {
  const corsHeaders = createCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const forcedProduct = "hospedagens" as MercadoPagoProduct;
    const mercadoPagoToken = String(
      Deno.env.get("HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN") ||
        Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ||
        Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ||
        "",
    ).trim();

    if (!supabaseUrl || !supabaseServiceRoleKey || !mercadoPagoToken) {
      throw new Error("Configuração ausente no webhook.");
    }

    const url = new URL(req.url);
    const bodyText = await req.text().catch(() => "");
    let body: any = null;

    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = null;
      }
    }

    const paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body?.data?.id?.toString?.() ||
      (typeof body?.resource === "string" ? body.resource.split("/").pop() : null) ||
      null;

    if (!paymentId) {
      console.log("[hospedagens.webhook] webhook_ignorado", {
        reason: "payment_id_ausente",
        body_type: body?.type || body?.topic || null,
      });
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assinaturaValida = await validarAssinaturaMercadoPago(req, paymentId);
    if (!assinaturaValida) {
      console.log("[hospedagens.webhook] webhook_ignorado", {
        payment_id: paymentId,
        reason: "assinatura_invalida",
      });
      return new Response(JSON.stringify({ error: "Assinatura do webhook inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const tokenCandidates = await getMercadoPagoTokenCandidates({
      supabaseAdmin,
      platformToken: mercadoPagoToken,
      notificationUserId: body?.user_id,
    });
    const { payment: mpPayment, tokenLabel } = await fetchMercadoPagoPayment({
      paymentId,
      tokenCandidates,
    });
    console.log("[mercadopago.webhook] webhook_recebido", {
      payment_id: paymentId,
      token_label: tokenLabel,
      external_reference: mpPayment?.external_reference || null,
      product_hint: forcedProduct || null,
      status: mpPayment?.status || null,
    });

    const mpStatus = String(mpPayment?.status || "");
    const statusPagamento = mapMpStatus(mpStatus);
    const rawReference =
      String(mpPayment?.external_reference || "") || String(mpPayment?.metadata?.pedido_id || "");
    const routedReference = parseProductReference(rawReference, mpPayment?.metadata || {});

    if (!routedReference) {
      throw new Error("Pagamento sem external_reference/pedido_id.");
    }

    if (forcedProduct && routedReference.product !== forcedProduct) {
      console.log("[mercadopago.webhook] webhook_ignorado", {
        payment_id: paymentId,
        expected_product: forcedProduct,
        actual_product: routedReference.product,
        external_reference: rawReference,
        reason: "produto_incompativel_com_endpoint",
      });
      return new Response(JSON.stringify({ ok: true, ignored: true, reason: "produto_incompativel_com_endpoint" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (routedReference.product === "hospedagens") {
      const reservaId = routedReference.entityId;

      await syncHospedagemReservaStatus({
        supabaseAdmin,
        reservaId,
        paymentId,
        tenantId: mpPayment?.metadata?.tenant_id ? String(mpPayment.metadata.tenant_id) : null,
        statusPagamento,
      });

      console.log("[hospedagens.webhook] reserva_hospedagem_processada", {
        reserva_id: reservaId,
        payment_id: paymentId,
        status_pagamento: statusPagamento,
      });

      console.log("[hospedagens.metrics] pagamento_processado", {
        reserva_id: reservaId,
        payment_id: paymentId,
        status_pagamento: statusPagamento,
        external_reference: rawReference,
      });

      return new Response(JSON.stringify({ ok: true, produto: "hospedagens_caminhos_da_fe" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pedidoId = routedReference.entityId;
    console.log("[servicos.webhook] pedido_processamento_iniciado", {
      pedido_id: pedidoId,
      payment_id: paymentId,
      status_pagamento: statusPagamento,
      external_reference: rawReference,
      legacy_reference: routedReference.legacy,
    });

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .select("id, tenant_id, profissional_id, prestador_id, proposta_aceita_id, valor_final")
      .eq("id", pedidoId)
      .maybeSingle();

    if (pedidoError || !pedido) {
      throw new Error(pedidoError?.message || "Pedido não encontrado para conciliação do pagamento.");
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
      throw new Error("Profissional não encontrado para o pedido pago.");
    }

    const { data: comissao } = await supabaseAdmin
      .from("comissoes")
      .select("valor_total, valor_comissao, valor_profissional")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    const valorTotal = Number(
      comissao?.valor_total ??
        pedido?.valor_final ??
        mpPayment?.transaction_amount ??
        0,
    );
    const subscriptionProfile = await resolveProfessionalCommissionProfile(supabaseAdmin, profissionalId);
    const valorComissao = Number(
      comissao?.valor_comissao ?? valorTotal * subscriptionProfile.commissionRate,
    );
    const valorProfissional = Number(
      comissao?.valor_profissional ?? valorTotal - valorComissao,
    );

    const { data: pagamentoAnterior } = await supabaseAdmin
      .from("pagamentos")
      .select("status_pagamento")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    const jaAprovadoAntes = String(pagamentoAnterior?.status_pagamento || "").toLowerCase() === "aprovada";

    const { error: upsertPagamentoError } = await supabaseAdmin
      .from("pagamentos")
      .upsert(
        {
          tenant_id: pedido.tenant_id,
          pedido_id: pedidoId,
          profissional_id: profissionalId,
          valor_total: Number(valorTotal.toFixed(2)),
          valor_comissao: Number(valorComissao.toFixed(2)),
          valor_profissional: Number(valorProfissional.toFixed(2)),
          payment_id: paymentId,
          external_reference: rawReference,
          preference_id: String(mpPayment?.order?.id || mpPayment?.metadata?.preference_id || ""),
          status_pagamento: statusPagamento,
        },
        { onConflict: "pedido_id" },
      );

    if (upsertPagamentoError) {
      throw new Error(upsertPagamentoError.message);
    }

    const { data: pagamentoAtual } = await supabaseAdmin
      .from("pagamentos")
      .select("split_mode")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    const splitModeAtivo =
      Boolean(pagamentoAtual?.split_mode) ||
      String(mpPayment?.metadata?.split_mode || "").toLowerCase() === "true";

    const novoStatusComissao = mapComissaoStatus(statusPagamento);

    const { error: comissaoError } = await supabaseAdmin
      .from("comissoes")
      .update({ status_pagamento: novoStatusComissao })
      .eq("pedido_id", pedidoId)
      .eq("tenant_id", pedido.tenant_id);

    if (comissaoError) {
      throw new Error(comissaoError.message);
    }

    await syncGasPedidoStatus({
      supabaseAdmin,
      pedidoId,
      paymentId,
      preferenceId: String(mpPayment?.order?.id || mpPayment?.metadata?.preference_id || ""),
      metodoPagamento: "mercadopago",
      statusPagamento,
    });

    if (statusPagamento === "aprovada" && !jaAprovadoAntes) {
      await baixarEstoquePedido({
        supabaseAdmin,
        pedidoId,
        tenantId: pedido.tenant_id || null,
      });

      if (!splitModeAtivo) {
        await creditarCarteiraProfissional({
          supabaseAdmin,
          tenantId: pedido.tenant_id || null,
          profissionalId,
          pedidoId,
          valorProfissional,
          providerMeta: { provider: "mercadopago", payment_id: paymentId },
        });
      }

      const { error: pedidoError } = await supabaseAdmin
        .from("pedidos")
        .update({
          status: "em_execucao",
          status_logistica: "novo",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId)
        .eq("tenant_id", pedido.tenant_id);

      if (pedidoError) {
        throw new Error(pedidoError.message);
      }
    }

    console.log("[servicos.metrics] pagamento_processado", {
      pedido_id: pedidoId,
      payment_id: paymentId,
      status_pagamento: statusPagamento,
      external_reference: rawReference,
      legacy_reference: routedReference.legacy,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("[hospedagens.webhook] erro_webhook", {
      message: error instanceof Error ? error.message : String(error),
    });

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
