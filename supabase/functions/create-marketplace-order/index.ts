// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { resolveProfessionalCommissionProfile } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CartItemInput = {
  productId: string;
  quantity: number;
};

type Body = {
  items?: CartItemInput[];
};

type NormalizedItem = {
  productId: string;
  fornecedorId: string;
  quantity: number;
  unitPrice: number;
  title: string;
};

function roundMoney(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho vazio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId || "").trim()).filter(Boolean))];
    if (uniqueProductIds.length === 0) {
      return new Response(JSON.stringify({ error: "Produtos inválidos no carrinho." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tenantId, error: tenantError } = await supabaseAuth.rpc("current_tenant_id");
    if (tenantError || !tenantId) {
      throw new Error(tenantError?.message || "Tenant ativo não encontrado.");
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from("produtos_fornecedor")
      .select("id, fornecedor_id, titulo, preco, preco_de, preco_por, estoque, ativo")
      .in("id", uniqueProductIds)
      .eq("tenant_id", tenantId)
      .eq("ativo", true);

    if (productsError) {
      throw new Error(productsError.message);
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "Produtos não encontrados." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = new Map(products.map((p: any) => [String(p.id), p]));
    const normalizedItems: NormalizedItem[] = [];

    for (const item of items) {
      const productId = String(item.productId || "").trim();
      const quantity = Math.max(1, Number(item.quantity || 1));
      const product = productMap.get(productId);
      if (!product) continue;

      const precoBase = Number(product.preco_de ?? product.preco ?? 0);
      const precoPromocional = Number(product.preco_por ?? 0);
      const precoEfetivo =
        precoPromocional > 0 && (precoBase <= 0 || precoPromocional < precoBase)
          ? precoPromocional
          : Number(product.preco ?? precoBase);

      if (quantity > Number(product.estoque || 0)) {
        return new Response(
          JSON.stringify({ error: `Estoque insuficiente para ${product.titulo}.` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      normalizedItems.push({
        productId,
        fornecedorId: String(product.fornecedor_id),
        quantity,
        unitPrice: Number(precoEfetivo || 0),
        title: String(product.titulo || "Produto"),
      });
    }

    if (normalizedItems.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groups = new Map<string, NormalizedItem[]>();
    for (const item of normalizedItems) {
      const list = groups.get(item.fornecedorId) || [];
      list.push(item);
      groups.set(item.fornecedorId, list);
    }

    const pedidoIds: string[] = [];
    const resumo: Array<{ pedidoId: string; fornecedorId: string; total: number }> = [];

    for (const [fornecedorId, groupItems] of groups.entries()) {
      let subtotal = 0;
      for (const item of groupItems) {
        subtotal += item.unitPrice * item.quantity;
      }

      const frete = subtotal >= 299 ? 0 : 19.9;
      const total = roundMoney(subtotal + frete);
      const subscriptionProfile = await resolveProfessionalCommissionProfile(supabaseAdmin, fornecedorId);
      const valorComissao = roundMoney(total * subscriptionProfile.commissionRate);
      const valorProfissional = roundMoney(total - valorComissao);

      const descricaoPedido = groupItems
        .map((item) => `${item.quantity}x ${item.title}`)
        .join(", ")
        .slice(0, 500);

      const { data: pedido, error: pedidoError } = await supabaseAdmin
        .from("pedidos")
        .insert({
          tenant_id: tenantId,
          cliente_id: user.id,
          profissional_id: fornecedorId,
          categoria: "Marketplace",
          servico: "Compra de produtos",
          descricao: `Pedido marketplace: ${descricaoPedido}`,
          status: "aguardando_pagamento",
          // Fluxo correto: logística inicia apenas após confirmação de pagamento.
          status_logistica: null,
          valor_final: total,
          tipo_atendimento: "orcamento",
        })
        .select("id")
        .single();

      if (pedidoError || !pedido) {
        throw new Error(pedidoError?.message || "Falha ao criar pedido marketplace.");
      }

      const { data: proposta, error: propostaError } = await supabaseAdmin
        .from("propostas")
        .insert({
          tenant_id: tenantId,
          pedido_id: pedido.id,
          profissional_id: fornecedorId,
          valor: total,
          descricao: `Proposta automática do carrinho marketplace (${groupItems.length} itens).`,
          mensagem: "Checkout automático do carrinho",
          status: "aceita",
          contato_liberado: true,
        })
        .select("id")
        .single();

      if (propostaError || !proposta) {
        throw new Error(propostaError?.message || "Falha ao criar proposta automática.");
      }

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
            profissional_id: fornecedorId,
            valor_total: total,
            percentual: subscriptionProfile.commissionRate,
            valor_comissao: valorComissao,
            valor_profissional: valorProfissional,
            status_pagamento: "aguardar_pagamento",
          },
          { onConflict: "pedido_id" },
        );

      if (comissaoError) {
        throw new Error(comissaoError.message);
      }

      const itemRows = groupItems.map((item) => ({
        tenant_id: tenantId,
        pedido_id: pedido.id,
        produto_id: item.productId,
        fornecedor_id: fornecedorId,
        cliente_id: user.id,
        titulo: item.title,
        quantidade: item.quantity,
        preco_unitario: roundMoney(item.unitPrice),
        subtotal: roundMoney(item.unitPrice * item.quantity),
      }));

      const { error: itensError } = await supabaseAdmin
        .from("pedido_produtos_itens")
        .insert(itemRows);
      if (itensError) {
        throw new Error(itensError.message);
      }

      pedidoIds.push(String(pedido.id));
      resumo.push({
        pedidoId: String(pedido.id),
        fornecedorId,
        total,
      });
    }

    return new Response(
      JSON.stringify({
        pedidoId: pedidoIds[0] || null,
        pedidoIds,
        quantidadePedidos: pedidoIds.length,
        pedidos: resumo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.log("[create-marketplace-order] erro:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao criar pedido do marketplace.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
