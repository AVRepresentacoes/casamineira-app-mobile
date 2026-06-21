import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

type Role = "cliente" | "profissional";

export async function registrarEventoOperacional(input: {
  evento: string;
  pedidoId?: string;
  metadata?: Record<string, unknown>;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return;

  await supabase.from("analytics_eventos").insert({
    user_id: session.user.id,
    pedido_id: input.pedidoId ?? null,
    evento: input.evento,
    metadata: input.metadata ?? {},
    plataforma: Platform.OS,
  });
}

export async function criarContratoDigitalBase(input: {
  pedidoId: string;
  clienteId: string;
  profissionalId: string;
  termos?: string;
}) {
  const termosPadrao =
    input.termos ??
    "Contrato digital de prestacao de servico com aceite por ambas as partes e execucao por marcos.";

  const { error } = await supabase.from("contratos_digitais").upsert(
    {
      pedido_id: input.pedidoId,
      cliente_id: input.clienteId,
      profissional_id: input.profissionalId,
      termos: termosPadrao,
      status: "pendente_assinaturas",
    },
    { onConflict: "pedido_id" },
  );

  if (error) throw new Error(error.message);
}

export async function assinarContratoDigital(input: {
  pedidoId: string;
  role: Role;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) throw new Error("Usuario nao autenticado.");

  const patch =
    input.role === "cliente"
      ? { cliente_signed_at: new Date().toISOString() }
      : { profissional_signed_at: new Date().toISOString() };

  const { data: contrato, error } = await supabase
    .from("contratos_digitais")
    .update(patch)
    .eq("pedido_id", input.pedidoId)
    .select("id, cliente_signed_at, profissional_signed_at")
    .single();

  if (error) throw new Error(error.message);

  const ativo = Boolean(contrato?.cliente_signed_at && contrato?.profissional_signed_at);
  if (ativo) {
    const { error: statusError } = await supabase
      .from("contratos_digitais")
      .update({ status: "ativo" })
      .eq("id", contrato.id);

    if (statusError) throw new Error(statusError.message);
  }
}

export async function criarMarcosEscrowPadrao(input: {
  pedidoId: string;
  valorTotal: number;
}) {
  const v = Number(input.valorTotal || 0);
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error("Valor total invalido para criar marcos.");
  }

  const m1 = Number((v * 0.4).toFixed(2));
  const m2 = Number((v * 0.4).toFixed(2));
  const m3 = Number((v - m1 - m2).toFixed(2));

  const payload = [
    {
      pedido_id: input.pedidoId,
      ordem: 1,
      titulo: "Inicio do servico",
      descricao: "Liberacao apos inicio validado pelas partes.",
      percentual: 40,
      valor: m1,
      status: "pendente",
    },
    {
      pedido_id: input.pedidoId,
      ordem: 2,
      titulo: "Marco intermediario",
      descricao: "Liberacao apos entrega parcial combinada.",
      percentual: 40,
      valor: m2,
      status: "pendente",
    },
    {
      pedido_id: input.pedidoId,
      ordem: 3,
      titulo: "Conclusao final",
      descricao: "Liberacao final apos aceite de encerramento.",
      percentual: 20,
      valor: m3,
      status: "pendente",
    },
  ];

  const { error } = await supabase
    .from("escrow_milestones")
    .upsert(payload, { onConflict: "pedido_id,ordem" });

  if (error) throw new Error(error.message);
}

export async function listarMarcosEscrow(pedidoId: string) {
  const { data, error } = await supabase
    .from("escrow_milestones")
    .select("*")
    .eq("pedido_id", pedidoId)
    .order("ordem", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function atualizarStatusMarcoEscrow(input: {
  milestoneId: string;
  status: "em_execucao" | "aprovado" | "liberado" | "disputa";
}) {
  const patch: Record<string, unknown> = {
    status: input.status,
  };

  if (input.status === "aprovado") patch.approved_client_at = new Date().toISOString();
  if (input.status === "liberado") patch.released_at = new Date().toISOString();

  const { error } = await supabase
    .from("escrow_milestones")
    .update(patch)
    .eq("id", input.milestoneId);

  if (error) throw new Error(error.message);
}
