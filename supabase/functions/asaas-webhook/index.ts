// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

function mapAsaasStatus(status: string): "pendente" | "aprovada" | "recusada" | "estornada" {
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(status)) return "aprovada";
  if (
    [
      "REFUNDED",
      "PARTIALLY_REFUNDED",
      "REFUND_REQUESTED",
      "PARTIAL_REFUND_REQUESTED",
      "CHARGEBACK_REQUESTED",
      "CHARGEBACK_DISPUTE",
      "AWAITING_CHARGEBACK_REVERSAL",
      "DUNNING_RECEIVED",
    ].includes(status)
  ) {
    return "estornada";
  }
  if (["OVERDUE", "DELETED"].includes(status)) return "recusada";
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

async function syncGasPedido(params: {
  supabaseAdmin: any;
  pedidoId: string;
  paymentId?: string | null;
  metodoPagamento?: string | null;
  statusPagamento: "pendente" | "aprovada" | "recusada" | "estornada";
}) {
  const { supabaseAdmin, pedidoId, paymentId, metodoPagamento, statusPagamento } = params;
  const { error } = await supabaseAdmin
    .from("gas_pedidos")
    .update({
      status: mapGasOrderStatus(statusPagamento),
      status_pagamento: mapGasPaymentStatus(statusPagamento),
      payment_id: paymentId || null,
      metodo_pagamento: metodoPagamento || null,
    })
    .eq("pedido_id", pedidoId);

  if (error) {
    throw new Error(error.message);
  }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const asaasApiKey = String(Deno.env.get("ASAAS_API_KEY") || "").trim();
    const asaasWebhookToken = String(Deno.env.get("ASAAS_WEBHOOK_TOKEN") || "").trim();

    if (!supabaseUrl || !supabaseServiceRoleKey || !asaasApiKey) {
      throw new Error("Configuração ausente no webhook Asaas.");
    }

    if (asaasWebhookToken) {
      const providedToken = String(req.headers.get("asaas-access-token") || "").trim();
      if (!providedToken || providedToken !== asaasWebhookToken) {
        return new Response(JSON.stringify({ error: "Token de webhook inválido." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = await req.json();
    const webhookPaymentId = String(payload?.payment?.id || payload?.id || "").trim();

    if (!webhookPaymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentResp = await fetch(`https://api.asaas.com/v3/payments/${encodeURIComponent(webhookPaymentId)}`, {
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
    });
    const paymentJson = await paymentResp.json();

    if (!paymentResp.ok || !paymentJson?.id) {
      throw new Error(paymentJson?.errors?.[0]?.description || "Falha ao consultar pagamento no Asaas.");
    }

    const asaasStatus = String(paymentJson?.status || "PENDING");
    const statusPagamento = mapAsaasStatus(asaasStatus);
    const pedidoId = String(paymentJson?.externalReference || "").trim();

    if (!pedidoId) {
      throw new Error("Pagamento sem externalReference (pedido_id).");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .select("id, tenant_id, profissional_id, prestador_id, proposta_aceita_id, valor_final")
      .eq("id", pedidoId)
      .maybeSingle();

    if (pedidoError || !pedido) {
      throw new Error(pedidoError?.message || "Pedido não encontrado para conciliação do pagamento.");
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
      throw new Error("Profissional não encontrado para o pedido pago.");
    }

    const { data: comissao } = await supabaseAdmin
      .from("comissoes")
      .select("valor_total, valor_comissao, valor_profissional")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    const valorTotal = Number(comissao?.valor_total ?? pedido?.valor_final ?? paymentJson?.value ?? 0);
    const subscriptionProfile = await resolveProfessionalCommissionProfile(supabaseAdmin, profissionalId);
    const valorComissao = Number(
      comissao?.valor_comissao ?? valorTotal * subscriptionProfile.commissionRate,
    );
    const valorProfissional = Number(comissao?.valor_profissional ?? valorTotal - valorComissao);

    const { data: pagamentoAnterior } = await supabaseAdmin
      .from("pagamentos")
      .select("status_pagamento")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    const jaAprovadoAntes = String(pagamentoAnterior?.status_pagamento || "").toLowerCase() === "aprovada";

    const { error: upsertPagamentoError } = await supabaseAdmin.from("pagamentos").upsert(
      {
        tenant_id: pedido.tenant_id,
        pedido_id: pedidoId,
        profissional_id: profissionalId,
        valor_total: Number(valorTotal.toFixed(2)),
        valor_comissao: Number(valorComissao.toFixed(2)),
        valor_profissional: Number(valorProfissional.toFixed(2)),
        payment_id: webhookPaymentId,
        external_reference: pedidoId,
        status_pagamento: statusPagamento,
      },
      { onConflict: "pedido_id" },
    );

    if (upsertPagamentoError) {
      throw new Error(upsertPagamentoError.message);
    }

    const novoStatusComissao = mapComissaoStatus(statusPagamento);

    const { error: comissaoError } = await supabaseAdmin
      .from("comissoes")
      .update({ status_pagamento: novoStatusComissao })
      .eq("pedido_id", pedidoId)
      .eq("tenant_id", pedido.tenant_id);

    if (comissaoError) {
      throw new Error(comissaoError.message);
    }

    await syncGasPedido({
      supabaseAdmin,
      pedidoId,
      paymentId: webhookPaymentId,
      metodoPagamento: "pix",
      statusPagamento,
    });

    if (statusPagamento === "aprovada" && !jaAprovadoAntes) {
      await baixarEstoquePedido({
        supabaseAdmin,
        pedidoId,
        tenantId: pedido.tenant_id || null,
      });

      await creditarCarteiraProfissional({
        supabaseAdmin,
        tenantId: pedido.tenant_id || null,
        profissionalId,
        pedidoId,
        valorProfissional,
        providerMeta: { provider: "asaas", payment_id: webhookPaymentId },
      });

      const { error: pedidoStatusError } = await supabaseAdmin
        .from("pedidos")
        .update({
          status: "em_execucao",
          status_logistica: "novo",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId)
        .eq("tenant_id", pedido.tenant_id);

      if (pedidoStatusError) {
        throw new Error(pedidoStatusError.message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("[asaas-webhook] erro:", error);

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
