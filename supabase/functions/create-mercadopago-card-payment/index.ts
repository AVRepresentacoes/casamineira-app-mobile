// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";


type Body = {
  pedidoId?: string;
  token?: string;
  payment_method_id?: string;
  issuer_id?: string | null;
  installments?: number;
  identification_type?: string;
  identification_number?: string;
  last_four_digits?: string;
};

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
    const token = String(body?.token || "").trim();
    const paymentMethodId = String(body?.payment_method_id || "").trim();
    const issuerId = String(body?.issuer_id || "").trim();
    const identificationType = String(body?.identification_type || "CPF").trim().toUpperCase();
    const identificationNumber = String(body?.identification_number || "").replace(/\D/g, "");
    const installments = Number(body?.installments || 1);

    if (!pedidoId) {
      return new Response(JSON.stringify({ error: "pedidoId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!token || !paymentMethodId) {
      return new Response(JSON.stringify({ error: "Token e bandeira do cartão são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!identificationNumber) {
      return new Response(JSON.stringify({ error: "CPF/CNPJ do pagador é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Number.isFinite(installments) || installments < 1 || installments > 12) {
      return new Response(JSON.stringify({ error: "Quantidade de parcelas inválida." }), {
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
      .select("payment_id, status_pagamento")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    if (pagamentoAtual?.status_pagamento === "aprovada") {
      return new Response(
        JSON.stringify({
          payment_id: pagamentoAtual.payment_id,
          status_pagamento: "aprovada",
          status_detail: "already_paid",
          transaction_amount: null,
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

    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook-servicos`;
    const externalReference = `casa_mineira_servicos:${pedidoId}`;
    const payerEmail = user.email || `cliente-${user.id.slice(0, 8)}@casamineira.app`;

    const paymentPayload: any = {
      transaction_amount: Number(valorTotal.toFixed(2)),
      token,
      installments: Math.floor(installments),
      payment_method_id: paymentMethodId,
      description: `Pagamento de serviço #${pedidoId}`,
      notification_url: webhookUrl,
      external_reference: externalReference,
      metadata: {
        pedido_id: pedidoId,
        product_id: "casa_mineira_servicos",
        profissional_id: profissionalId,
        split_mode: splitMode,
        split_destination_id: splitDestinationId,
      },
      payer: {
        email: payerEmail,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
    };

    if (issuerId) {
      paymentPayload.issuer_id = issuerId;
    }

    if (splitMode) {
      paymentPayload.application_fee = Number(Number(comissao.valor_comissao || 0).toFixed(2));
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `card-${pedidoId}-${token.slice(0, 16)}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const mpJson = await mpResponse.json();

    if (!mpResponse.ok) {
      console.log("[MP] erro create card payment", mpJson);
      const detalhe = mpJson?.message || mpJson?.cause?.[0]?.description || "Falha no pagamento com cartão.";
      throw new Error(detalhe);
    }

    const paymentId = String(mpJson?.id || "");
    const statusPagamento = mapMpStatus(String(mpJson?.status || ""));
    const statusDetail = String(mpJson?.status_detail || "");

    if (!paymentId) {
      throw new Error("Mercado Pago retornou payload de cartão inválido.");
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
        external_reference: externalReference,
        status_pagamento: statusPagamento,
        init_point: null,
        preference_id: null,
        split_mode: splitMode,
        split_provider: splitMode ? "mercadopago" : null,
        split_destination_id: splitDestinationId,
      },
      { onConflict: "pedido_id" },
    );

    if (pagamentoError) {
      throw new Error(pagamentoError.message);
    }

    const { error: comissaoUpdateError } = await supabaseAdmin
      .from("comissoes")
      .update({ status_pagamento: mapComissaoStatus(statusPagamento) })
      .eq("pedido_id", pedidoId)
      .eq("tenant_id", pedido.tenant_id);

    if (comissaoUpdateError) {
      throw new Error(comissaoUpdateError.message);
    }

    await syncGasPedido({
      supabaseAdmin,
      pedidoId,
      paymentId,
      metodoPagamento: "cartao",
      statusPagamento,
    });

    if (statusPagamento === "aprovada") {
      await baixarEstoquePedido({
        supabaseAdmin,
        pedidoId,
        tenantId: pedido.tenant_id || null,
      });

      if (!splitMode) {
        await creditarCarteiraProfissional({
          supabaseAdmin,
          tenantId: pedido.tenant_id || null,
          profissionalId,
          pedidoId,
          valorProfissional: Number(comissao.valor_profissional || 0),
          providerMeta: { provider: "mercadopago", payment_id: paymentId },
        });
      }

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

    return new Response(
      JSON.stringify({
        payment_id: paymentId,
        status_pagamento: statusPagamento,
        status_detail: statusDetail || null,
        transaction_amount: Number(mpJson?.transaction_amount || valorTotal),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[create-mercadopago-card-payment] erro:", error);

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
