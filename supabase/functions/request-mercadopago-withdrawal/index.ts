// @ts-nocheck
import { corsPreflightResponse, createCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";


type Body = {
  valor?: number;
  pixKey?: string;
  pixKeyType?: string;
  pixHolderName?: string;
  pixHolderDocument?: string;
};

function detectPixKeyType(pixKey: string, rawType?: string) {
  const explicit = String(rawType || "").trim().toUpperCase();
  if (["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"].includes(explicit)) return explicit;

  const key = String(pixKey || "").trim();
  const digits = key.replace(/\D/g, "");

  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(key)) return "EMAIL";
  if (/^\+?\d{10,13}$/.test(digits)) return "PHONE";
  if (/^\d{11}$/.test(digits)) return "CPF";
  if (/^\d{14}$/.test(digits)) return "CNPJ";
  return "EVP";
}

function mapPixKeyTypeToMercadoPago(type: string) {
  if (type === "EMAIL") return "email";
  if (type === "PHONE") return "phone";
  if (type === "CPF") return "cpf";
  if (type === "CNPJ") return "cnpj";
  return "evp";
}

function isPayoutApproved(status: string) {
  const s = String(status || "").toLowerCase();
  return ["approved", "success", "succeeded", "processed", "completed"].includes(s);
}

function isPayoutFailed(status: string) {
  const s = String(status || "").toLowerCase();
  return ["failed", "rejected", "cancelled", "canceled", "error", "denied"].includes(s);
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

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Credenciais do Supabase ausentes.");
    }

    const autoPayoutEnabled = String(Deno.env.get("MERCADO_PAGO_PAYOUT_AUTO") || "false").toLowerCase() === "true";
    const enforceSignature = String(Deno.env.get("MERCADO_PAGO_PAYOUT_ENFORCE_SIGNATURE") || "false").toLowerCase() === "true";
    const payoutSignature = String(Deno.env.get("MERCADO_PAGO_PAYOUT_X_SIGNATURE") || "").trim();

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

    const valor = Number(body?.valor || 0);
    const pixKey = String(body?.pixKey || "").trim();
    const pixKeyType = detectPixKeyType(pixKey, body?.pixKeyType);
    const pixHolderName = String(body?.pixHolderName || "").trim() || null;
    const pixHolderDocument = String(body?.pixHolderDocument || "").replace(/\D/g, "") || null;

    if (!Number.isFinite(valor) || valor <= 0) {
      return new Response(JSON.stringify({ error: "Valor inválido para saque." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pixKey) {
      return new Response(JSON.stringify({ error: "Chave PIX obrigatória." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIdempotency = String(req.headers.get("x-idempotency-key") || "").trim();
    const idempotencyKey = clientIdempotency || `withdraw-${user.id}-${Math.round(valor * 100)}-${pixKeyType}-${pixKey.slice(-6)}`;

    const { data: solicitacaoData, error: solicitacaoErr } = await supabaseAuth.rpc("request_pix_withdrawal", {
      p_valor: Number(valor.toFixed(2)),
      p_pix_key: pixKey,
      p_pix_key_type: pixKeyType,
      p_pix_holder_name: pixHolderName,
      p_pix_holder_document: pixHolderDocument,
      p_idempotency_key: idempotencyKey,
    });

    if (solicitacaoErr) {
      throw new Error(solicitacaoErr.message || "Falha ao solicitar saque.");
    }

    const solicitacao = Array.isArray(solicitacaoData) ? solicitacaoData[0] : solicitacaoData;
    if (!solicitacao?.solicitacao_id) {
      throw new Error("Não foi possível registrar a solicitação de saque.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: saqueRow, error: saqueRowError } = await supabaseAdmin
      .from("saque_solicitacoes")
      .select("id, tenant_id, profissional_id, wallet_id, valor, pix_key, pix_key_type, pix_holder_name, pix_holder_document, status")
      .eq("id", solicitacao.solicitacao_id)
      .maybeSingle();

    if (saqueRowError || !saqueRow) {
      throw new Error(saqueRowError?.message || "Solicitação de saque não encontrada.");
    }

    if (!autoPayoutEnabled) {
      return new Response(
        JSON.stringify({
          saque_id: saqueRow.id,
          status: "requested",
          message: "Solicitação registrada. Processamento automático desativado (modo manual).",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!mercadoPagoToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado para payout automático.");
    }

    if (enforceSignature && !payoutSignature) {
      throw new Error("MERCADO_PAGO_PAYOUT_X_SIGNATURE ausente com assinatura obrigatória habilitada.");
    }

    if (saqueRow.status === "paid") {
      return new Response(
        JSON.stringify({
          saque_id: saqueRow.id,
          status: "paid",
          message: "Saque já liquidado anteriormente.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const attempts = 1;

    await supabaseAdmin
      .from("saque_solicitacoes")
      .update({
        status: "processing",
        attempts,
        provider: "mercadopago",
        updated_at: new Date().toISOString(),
      })
      .eq("id", saqueRow.id)
      .eq("profissional_id", user.id);

    const notificationUrl = `${supabaseUrl}/functions/v1/mercadopago-withdraw-webhook`;
    const mpPixType = mapPixKeyTypeToMercadoPago(String(saqueRow.pix_key_type || pixKeyType));
    const amount = Number(Number(saqueRow.valor || valor).toFixed(2));

    const mpPayload: any = {
      type: "payout",
      external_reference: String(saqueRow.id),
      description: `Saque profissional ${String(user.id).slice(0, 8)}`,
      seller_configuration: {
        notification_info: {
          notification_url: notificationUrl,
        },
      },
      transaction: {
        from: {
          accounts: [{ amount }],
        },
        to: {
          accounts: [
            {
              amount,
              bank_account: {
                key: {
                  type: mpPixType,
                  value: String(saqueRow.pix_key || pixKey),
                },
                owner: {
                  name: saqueRow.pix_holder_name || pixHolderName || undefined,
                  document: saqueRow.pix_holder_document || pixHolderDocument || undefined,
                },
              },
            },
          ],
        },
      },
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${mercadoPagoToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `withdraw-${saqueRow.id}`,
      "X-Enforce-Signature": enforceSignature ? "true" : "false",
    };

    if (payoutSignature) {
      headers["X-Signature"] = payoutSignature;
    }

    const mpResp = await fetch("https://api.mercadopago.com/v1/transaction-intents/process", {
      method: "POST",
      headers,
      body: JSON.stringify(mpPayload),
    });

    const mpJson = await mpResp.json().catch(() => ({}));

    if (!mpResp.ok) {
      const reason = mpJson?.message || mpJson?.error || "Falha ao processar payout PIX no Mercado Pago.";

      const { data: walletRow } = await supabaseAdmin
        .from("wallets")
        .select("id, bloqueado")
        .eq("id", saqueRow.wallet_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const bloqueadoAtual = Number(walletRow?.bloqueado || 0);

      await supabaseAdmin
        .from("wallets")
        .update({
          bloqueado: Math.max(0, bloqueadoAtual - amount),
        })
        .eq("id", saqueRow.wallet_id)
        .eq("user_id", user.id);

      await supabaseAdmin.from("saque_solicitacoes").update({
        status: "failed",
        provider_status: String(mpJson?.status || "error"),
        failure_reason: String(reason).slice(0, 500),
        metadata: mpJson,
        processed_at: new Date().toISOString(),
      }).eq("id", saqueRow.id);

      await supabaseAdmin.from("wallet_transactions").insert({
        tenant_id: saqueRow.tenant_id,
        user_id: user.id,
        tipo: "saque_falhou_estorno",
        valor: amount,
        descricao: "Falha no saque PIX - bloqueio revertido",
        status: "failed",
        referencia_tipo: "saque_falha",
        referencia_id: String(saqueRow.id),
        metadata: mpJson,
      });

      return new Response(JSON.stringify({
        saque_id: saqueRow.id,
        status: "failed",
        error: reason,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerStatus = String(mpJson?.status || mpJson?.state || mpJson?.result || "processing");
    const providerTransferId = String(mpJson?.id || mpJson?.transaction_intent_id || mpJson?.external_reference || "");

    if (isPayoutApproved(providerStatus)) {
      const { data: walletRow } = await supabaseAdmin
        .from("wallets")
        .select("id, saldo, bloqueado")
        .eq("id", saqueRow.wallet_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const saldoAtual = Number(walletRow?.saldo || 0);
      const bloqueadoAtual = Number(walletRow?.bloqueado || 0);

      await supabaseAdmin
        .from("wallets")
        .update({
          saldo: Math.max(0, saldoAtual - amount),
          bloqueado: Math.max(0, bloqueadoAtual - amount),
        })
        .eq("id", saqueRow.wallet_id)
        .eq("user_id", user.id);

      await supabaseAdmin
        .from("saque_solicitacoes")
        .update({
          status: "paid",
          provider_transfer_id: providerTransferId || null,
          provider_status: providerStatus,
          metadata: mpJson,
          processed_at: new Date().toISOString(),
        })
        .eq("id", saqueRow.id);

      await supabaseAdmin.from("wallet_transactions").insert({
        tenant_id: saqueRow.tenant_id,
        user_id: user.id,
        tipo: "saque_pago",
        valor: amount,
        descricao: "Saque PIX liquidado",
        status: "confirmed",
        referencia_tipo: "saque_pagamento",
        referencia_id: String(saqueRow.id),
        metadata: mpJson,
      });

      return new Response(
        JSON.stringify({
          saque_id: saqueRow.id,
          status: "paid",
          provider_transfer_id: providerTransferId || null,
          message: "Saque PIX pago com sucesso.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (isPayoutFailed(providerStatus)) {
      const { data: walletRow } = await supabaseAdmin
        .from("wallets")
        .select("id, bloqueado")
        .eq("id", saqueRow.wallet_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const bloqueadoAtual = Number(walletRow?.bloqueado || 0);

      await supabaseAdmin
        .from("wallets")
        .update({ bloqueado: Math.max(0, bloqueadoAtual - amount) })
        .eq("id", saqueRow.wallet_id)
        .eq("user_id", user.id);

      await supabaseAdmin
        .from("saque_solicitacoes")
        .update({
          status: "failed",
          provider_transfer_id: providerTransferId || null,
          provider_status: providerStatus,
          failure_reason: String(mpJson?.message || "Saque recusado pelo provedor.").slice(0, 500),
          metadata: mpJson,
          processed_at: new Date().toISOString(),
        })
        .eq("id", saqueRow.id);

      await supabaseAdmin.from("wallet_transactions").insert({
        tenant_id: saqueRow.tenant_id,
        user_id: user.id,
        tipo: "saque_falhou_estorno",
        valor: amount,
        descricao: "Saque PIX recusado - saldo desbloqueado",
        status: "failed",
        referencia_tipo: "saque_falha",
        referencia_id: String(saqueRow.id),
        metadata: mpJson,
      });

      return new Response(
        JSON.stringify({
          saque_id: saqueRow.id,
          status: "failed",
          provider_transfer_id: providerTransferId || null,
          error: mpJson?.message || "Saque recusado no provedor.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await supabaseAdmin
      .from("saque_solicitacoes")
      .update({
        status: "processing",
        provider_transfer_id: providerTransferId || null,
        provider_status: providerStatus,
        metadata: mpJson,
      })
      .eq("id", saqueRow.id);

    return new Response(
      JSON.stringify({
        saque_id: saqueRow.id,
        status: "processing",
        provider_transfer_id: providerTransferId || null,
        message: "Saque em processamento pelo provedor.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[request-mercadopago-withdrawal] erro:", error);

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
