import { supabase } from "@/lib/supabase";

export type DisparoStatus =
  | "pendente"
  | "visualizado"
  | "aceito"
  | "recusado"
  | "expirado";

export type PedidoRapidoStatus =
  | "pendente"
  | "disparado"
  | "aceito"
  | "expirado"
  | "cancelado";

export async function dispararPedidoRapido(
  pedidoId: string,
  options?: { raioKm?: number; limite?: number; janelaMinutos?: number },
) {
  const { data, error } = await supabase.rpc("disparar_pedido_rapido", {
    p_pedido_id: pedidoId,
    p_raio_km: options?.raioKm ?? 15,
    p_limite_profissionais: options?.limite ?? 5,
    p_janela_minutos: options?.janelaMinutos ?? 10,
  });

  if (error) throw new Error(error.message);
  return Number(data || 0);
}

export async function aceitarChamadoRapido(pedidoId: string) {
  const { data, error } = await supabase.rpc("aceitar_chamado_rapido", {
    p_pedido_id: pedidoId,
  });

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function recusarChamadoRapido(pedidoId: string) {
  const { data, error } = await supabase.rpc("recusar_chamado_rapido", {
    p_pedido_id: pedidoId,
  });

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function expirarChamadosRapidos(pedidoId?: string) {
  const { data, error } = await supabase.rpc("expirar_chamados_rapidos", {
    p_pedido_id: pedidoId ?? null,
  });

  if (error) throw new Error(error.message);
  return Number(data || 0);
}
