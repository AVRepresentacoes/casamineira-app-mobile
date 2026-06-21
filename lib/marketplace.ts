import { supabase } from "@/lib/supabase";
import { getProfessionalCommissionDecimal, loadProfessionalSubscriptionContext } from "@/lib/pro-subscription";
import { resolveCurrentTenantId } from "@/lib/tenant";
import {
  criarContratoDigitalBase,
  criarMarcosEscrowPadrao,
  registrarEventoOperacional,
} from "@/lib/stage2";

type PropostaInput = {
  pedidoId: string;
  valor: number;
  descricao: string;
};

type Proposta = {
  id: string;
  pedido_id: string;
  profissional_id: string;
  valor: number;
  descricao: string;
  mensagem?: string | null;
  status: string;
};

export async function enviarProposta({
  pedidoId,
  valor,
  descricao,
}: PropostaInput): Promise<Proposta> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const profissionalId = session.user.id;
  const tenantId = await resolveCurrentTenantId();
  if (!tenantId) {
    throw new Error("Tenant ativo não encontrado.");
  }

  const { data: proposta, error: propostaError } = await supabase
    .from("propostas")
    .insert({
      tenant_id: tenantId,
      pedido_id: pedidoId,
      profissional_id: profissionalId,
      valor,
      descricao,
      mensagem: descricao,
      status: "enviada",
    })
    .select()
    .single();

  if (propostaError) {
    // Proposta duplicada no mesmo pedido: retorna a existente em vez de quebrar o fluxo.
    if ((propostaError as any).code === "23505") {
      const { data: existente, error: existenteError } = await supabase
        .from("propostas")
        .select("id, pedido_id, profissional_id, valor, descricao, status")
        .eq("pedido_id", pedidoId)
        .eq("profissional_id", profissionalId)
        .maybeSingle();

      if (!existenteError && existente) {
        return existente as Proposta;
      }
    }

    throw new Error(propostaError?.message || "Falha ao inserir proposta.");
  }

  if (!proposta) {
    throw new Error("Falha ao inserir proposta.");
  }

  const { error: rpcError } = await supabase.rpc("marcar_pedido_como_proposta_recebida", {
    p_pedido_id: pedidoId,
  });

  if (rpcError) {
    console.log("ERRO RPC MARCAR PEDIDO PROPOSTA_RECEBIDA:", rpcError);

    // Fallback para bases que ainda não aplicaram a migration da RPC.
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({ status: "proposta_recebida", updated_at: new Date().toISOString() })
      .eq("id", pedidoId)
      .select()
      .single();

    if (pedidoError) {
      // Não interrompe o envio: a proposta já foi criada e pode ser consultada pelo cliente.
      console.log(
        "ERRO FALLBACK UPDATE PEDIDO PROPOSTA_RECEBIDA:",
        pedidoError
      );
    }
  }

  try {
    await registrarEventoOperacional({
      evento: "proposta_enviada",
      pedidoId,
      metadata: { valor },
    });
  } catch (eventError) {
    console.log("ERRO ANALYTICS PROPOSTA_ENVIADA:", eventError);
  }

  return proposta as Proposta;
}

export async function aceitarPropostaComComissao({
  pedidoId,
  propostaId,
}: {
  pedidoId: string;
  propostaId: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const clienteId = session.user.id;
  const tenantId = await resolveCurrentTenantId();
  if (!tenantId) {
    throw new Error("Tenant ativo não encontrado.");
  }

  const { data: pedidoAtual, error: pedidoLoadError } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .eq("cliente_id", clienteId)
    .eq("tenant_id", tenantId)
    .single();

  if (pedidoLoadError || !pedidoAtual) {
    throw new Error("Pedido não encontrado para este cliente.");
  }

  const { data: propostaAceita, error: propostaError } = await supabase
    .from("propostas")
    .update({ status: "aceita", contato_liberado: true })
    .eq("id", propostaId)
    .eq("pedido_id", pedidoId)
    .eq("tenant_id", tenantId)
    .select("id, pedido_id, profissional_id, valor")
    .single();

  if (propostaError || !propostaAceita) {
    throw new Error(propostaError?.message || "Falha ao aceitar proposta.");
  }

  await supabase
    .from("propostas")
    .update({ status: "recusada" })
    .eq("pedido_id", pedidoId)
    .eq("tenant_id", tenantId)
    .neq("id", propostaId)
    .neq("status", "aceita");

  const valorTotal = Number(propostaAceita.valor || 0);
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Valor da proposta inválido.");
  }

  const subscription = await loadProfessionalSubscriptionContext(propostaAceita.profissional_id).catch(() => null);
  const percentual = subscription ? getProfessionalCommissionDecimal(subscription.tier) : 0.2;
  const valorComissao = Number((valorTotal * percentual).toFixed(2));
  const valorProfissional = Number((valorTotal - valorComissao).toFixed(2));

  const profissionalKey =
    Object.prototype.hasOwnProperty.call(pedidoAtual, "profissional_id")
      ? "profissional_id"
      : "prestador_id";

  const { error: pedidoUpdateError } = await supabase
    .from("pedidos")
    .update({
      status: "aceita",
      proposta_aceita_id: propostaAceita.id,
      valor_final: valorTotal,
      [profissionalKey]: propostaAceita.profissional_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pedidoId)
    .eq("cliente_id", clienteId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (pedidoUpdateError) {
    throw new Error(pedidoUpdateError.message);
  }

  const { error: comissaoError } = await supabase
    .from("comissoes")
    .insert({
      tenant_id: tenantId,
      pedido_id: pedidoId,
      profissional_id: propostaAceita.profissional_id,
      valor_total: valorTotal,
      percentual,
      valor_comissao: valorComissao,
      valor_profissional: valorProfissional,
      status_pagamento: "aguardar_pagamento",
    })
    .select()
    .single();

  if (comissaoError) {
    const mensagem = String(comissaoError.message || "").toLowerCase();
    const semPermissao =
      (comissaoError as any).code === "42501" ||
      mensagem.includes("permission denied") ||
      mensagem.includes("row-level security");

    const conflitoDuplicado = (comissaoError as any).code === "23505";

    // Em ambientes endurecidos de RLS, a comissão é preparada na edge function de pagamento.
    if (!semPermissao && !conflitoDuplicado) {
      throw new Error(comissaoError.message);
    }
  }

  // Stage 2: cria contrato digital e marcos de escrow assim que houver proposta aceita.
  try {
    await criarContratoDigitalBase({
      pedidoId,
      clienteId,
      profissionalId: propostaAceita.profissional_id,
    });

    await criarMarcosEscrowPadrao({
      pedidoId,
      valorTotal,
    });

    await registrarEventoOperacional({
      evento: "proposta_aceita",
      pedidoId,
      metadata: {
        propostaId: propostaAceita.id,
        valorTotal,
        valorComissao,
        valorProfissional,
      },
    });
  } catch (stage2Error) {
    console.log("ERRO STAGE2 ACEITE:", stage2Error);
  }
}
