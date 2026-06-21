import { assertEmpresaCanPerform } from "@/lib/saas-commercial";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";

/* =========================
   TIPOS
========================= */
export type Pedido = {
  id: string;
  cliente_id: string;
  categoria: string;
  descricao: string;
  status: string;
  tipo_atendimento?: "orcamento" | "rapido";
  status_disparo?: "pendente" | "disparado" | "aceito" | "expirado" | "cancelado" | null;
  profissional_aceitou_id?: string | null;
  aceito_em?: string | null;
  expira_em?: string | null;
  created_at: string;
};

/* =========================
   CRIAR PEDIDO
========================= */
export async function criarPedido({
  clienteId,
  categoria,
  descricao,
}: {
  clienteId: string;
  categoria: string;
  descricao: string;
}) {
  const tenantId = await resolveCurrentTenantId();
  if (!tenantId) {
    throw new Error("Tenant ativo não encontrado.");
  }

  await assertEmpresaCanPerform("create_pedido");

  const { error } = await supabase.from("pedidos").insert({
    tenant_id: tenantId,
    cliente_id: clienteId,
    categoria,
    descricao,
    status: "aberto",
  });

  if (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
}

/* =========================
   LISTAR PEDIDOS DO CLIENTE
========================= */
export async function listarPedidosDoCliente(clienteId: string) {
  const tenantId = await resolveCurrentTenantId();
  let query = supabase
    .from("pedidos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Pedido[];
}
