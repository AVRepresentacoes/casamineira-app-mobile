// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  revendedorId?: string;
  tipoBotijao?: string;
  checkoutToken?: string;
  recebedor?: string;
  endereco?: string;
  numero?: string;
  complemento?: string | null;
  bairro?: string;
  cidade?: string;
  referencia?: string | null;
};

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let cleanupSupabaseAdmin: ReturnType<typeof createClient> | null = null;
  let cleanupPedidoId: string | null = null;
  let cleanupPropostaId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error("Credenciais do Supabase ausentes na function.");
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    cleanupSupabaseAdmin = supabaseAdmin;

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
    const revendedorId = String(body?.revendedorId || "").trim();
    const tipoBotijao = String(body?.tipoBotijao || "P13").trim().toUpperCase();
    const checkoutToken = String(body?.checkoutToken || "").trim();
    const recebedor = String(body?.recebedor || "").trim();
    const endereco = String(body?.endereco || "").trim();
    const numero = String(body?.numero || "").trim();
    const complemento = String(body?.complemento || "").trim();
    const bairro = String(body?.bairro || "").trim();
    const cidade = String(body?.cidade || "").trim();
    const referencia = String(body?.referencia || "").trim();

    if (!revendedorId) {
      return new Response(JSON.stringify({ error: "Revendedor inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkoutToken) {
      return new Response(JSON.stringify({ error: "Sessão de checkout inválida." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tipoBotijao !== "P13") {
      return new Response(JSON.stringify({ error: "No momento, apenas o P13 está disponível para pagamento no app." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!recebedor || !endereco || !numero || !bairro || !cidade) {
      return new Response(JSON.stringify({ error: "Confirme os dados de entrega antes de continuar." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tenantId, error: tenantError } = await supabaseAuth.rpc("current_tenant_id");
    if (tenantError || !tenantId) {
      throw new Error(tenantError?.message || "Tenant ativo não encontrado.");
    }

    const { data: existingGasPedido, error: existingGasPedidoError } = await supabaseAdmin
      .from("gas_pedidos")
      .select("id, pedido_id, total")
      .eq("cliente_id", user.id)
      .eq("checkout_token", checkoutToken)
      .maybeSingle();

    if (existingGasPedidoError) {
      throw new Error(existingGasPedidoError.message);
    }

    if (existingGasPedido?.pedido_id) {
      return new Response(
        JSON.stringify({
          pedidoId: String(existingGasPedido.pedido_id),
          gasPedidoId: String(existingGasPedido.id),
          total: roundMoney(Number(existingGasPedido.total || 0)),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: revendedor, error: revendedorError } = await supabaseAdmin
      .from("gas_revendedores")
      .select("id, nome, preco_p13, tempo_entrega_min, ativo, cidade, bairro, empresa_id, fornecedor_id")
      .eq("id", revendedorId)
      .eq("ativo", true)
      .maybeSingle();

    if (revendedorError || !revendedor) {
      throw new Error(revendedorError?.message || "Revendedor não encontrado.");
    }

    const profissionalId = revendedor.fornecedor_id || revendedor.empresa_id || null;
    if (!profissionalId) {
      throw new Error("Este revendedor ainda não está habilitado para receber pagamentos no app.");
    }

    const precoGas = roundMoney(Number(revendedor.preco_p13 || 0));
    if (!Number.isFinite(precoGas) || precoGas <= 0) {
      throw new Error("Preço do botijão inválido.");
    }

    const taxaEntrega = 0;
    const taxaServico = 0;
    const total = roundMoney(precoGas + taxaEntrega + taxaServico);

    const subscriptionProfile = await resolveProfessionalCommissionProfile(supabaseAdmin, profissionalId);
    const percentual = subscriptionProfile.commissionRate;
    const valorComissao = roundMoney(total * percentual);
    const valorProfissional = roundMoney(total - valorComissao);

    const enderecoFormatado = [
      `${endereco}, ${numero}`,
      complemento || null,
      bairro,
      cidade,
      referencia ? `Referência: ${referencia}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .insert({
        tenant_id: tenantId,
        cliente_id: user.id,
        profissional_id: profissionalId,
        categoria: "Marketplace",
        servico: `Pedido de gás ${tipoBotijao}`,
        descricao: `Pedido de gás ${tipoBotijao} com ${revendedor.nome}. Entrega em ${enderecoFormatado}.`,
        status: "aguardando_pagamento",
        status_logistica: null,
        valor_final: total,
        tipo_atendimento: "orcamento",
      })
      .select("id")
      .single();

    if (pedidoError || !pedido) {
      throw new Error(pedidoError?.message || "Falha ao criar pedido de gás.");
    }
    cleanupPedidoId = String(pedido.id);

    const { data: proposta, error: propostaError } = await supabaseAdmin
      .from("propostas")
      .insert({
        tenant_id: tenantId,
        pedido_id: pedido.id,
        profissional_id: profissionalId,
        valor: total,
        descricao: `Proposta automática do pedido de gás ${tipoBotijao}.`,
        mensagem: "Checkout automático do gás",
        status: "aceita",
        contato_liberado: true,
      })
      .select("id")
      .single();

    if (propostaError || !proposta) {
      throw new Error(propostaError?.message || "Falha ao preparar proposta automática do gás.");
    }
    cleanupPropostaId = String(proposta.id);

    const { error: pedidoUpdateError } = await supabaseAdmin
      .from("pedidos")
      .update({
        proposta_aceita_id: proposta.id,
        status: "aguardando_pagamento",
        valor_final: total,
      })
      .eq("id", pedido.id);

    if (pedidoUpdateError) {
      throw new Error(pedidoUpdateError.message);
    }

    const { error: comissaoError } = await supabaseAdmin
      .from("comissoes")
      .upsert(
        {
          tenant_id: tenantId,
          pedido_id: pedido.id,
          profissional_id: profissionalId,
          valor_total: total,
          percentual,
          valor_comissao: valorComissao,
          valor_profissional: valorProfissional,
          status_pagamento: "aguardar_pagamento",
        },
        { onConflict: "pedido_id" },
      );

    if (comissaoError) {
      throw new Error(comissaoError.message);
    }

    const { data: gasPedido, error: gasPedidoError } = await supabaseAdmin
      .from("gas_pedidos")
      .insert({
        cliente_id: user.id,
        checkout_token: checkoutToken,
        pedido_id: pedido.id,
        revendedor_id: revendedor.id,
        tipo_botijao: tipoBotijao,
        preco: precoGas,
        endereco: `${endereco}, ${numero}`,
        bairro,
        cidade,
        status: "aguardando_pagamento",
        recebedor,
        complemento: complemento || null,
        referencia: referencia || null,
        taxa_entrega: taxaEntrega,
        taxa_servico: taxaServico,
        total,
        valor_plataforma: valorComissao,
        valor_revendedor: valorProfissional,
        metodo_pagamento: null,
        status_pagamento: "pending",
      })
      .select("id")
      .single();

    if (gasPedidoError || !gasPedido) {
      if (String(gasPedidoError?.code || "") === "23505") {
        const { data: duplicatedGasPedido } = await supabaseAdmin
          .from("gas_pedidos")
          .select("id, pedido_id, total")
          .eq("cliente_id", user.id)
          .eq("checkout_token", checkoutToken)
          .maybeSingle();

        if (cleanupPropostaId) {
          await supabaseAdmin.from("propostas").delete().eq("id", cleanupPropostaId);
        }
        if (cleanupPedidoId) {
          await supabaseAdmin.from("comissoes").delete().eq("pedido_id", cleanupPedidoId);
          await supabaseAdmin.from("pedidos").delete().eq("id", cleanupPedidoId);
        }

        if (duplicatedGasPedido?.pedido_id) {
          return new Response(
            JSON.stringify({
              pedidoId: String(duplicatedGasPedido.pedido_id),
              gasPedidoId: String(duplicatedGasPedido.id),
              total: roundMoney(Number(duplicatedGasPedido.total || total)),
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      throw new Error(gasPedidoError?.message || "Falha ao criar pedido de gás para checkout.");
    }

    cleanupPedidoId = null;
    cleanupPropostaId = null;

    return new Response(
      JSON.stringify({
        pedidoId: String(pedido.id),
        gasPedidoId: String(gasPedido.id),
        total,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[create-gas-checkout-order] erro:", error);

    if (cleanupSupabaseAdmin && cleanupPedidoId) {
      try {
        if (cleanupPropostaId) {
          await cleanupSupabaseAdmin.from("propostas").delete().eq("id", cleanupPropostaId);
        }
        await cleanupSupabaseAdmin.from("comissoes").delete().eq("pedido_id", cleanupPedidoId);
        await cleanupSupabaseAdmin.from("pedidos").delete().eq("id", cleanupPedidoId);
      } catch (cleanupError) {
        console.log("[create-gas-checkout-order] cleanup erro:", cleanupError);
      }
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao preparar checkout do gás.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
