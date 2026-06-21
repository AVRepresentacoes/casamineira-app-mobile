import { supabase } from "@/lib/supabase";

export type AdminWebDashboard = {
  total_empresas: number;
  empresas_trial: number;
  empresas_ativas: number;
  empresas_inadimplentes: number;
  empresas_canceladas: number;
  total_usuarios: number;
  total_profissionais: number;
  total_clientes: number;
  total_pedidos: number;
  mrr_estimado: number;
  arr_estimado: number;
  planos_mais_usados: Array<{ slug: string; nome: string; total: number }>;
  crescimento_empresas: Array<{ mes: string; label: string; total: number }>;
  crescimento_pedidos: Array<{ mes: string; label: string; total: number }>;
  assinaturas_por_status: Array<{ status: string; total: number }>;
};

export type AdminWebEmpresaRow = {
  empresa_id: string;
  nome: string;
  slug: string;
  ativa: boolean;
  created_at: string;
  plano_nome: string | null;
  plano_slug: string | null;
  assinatura_status: string | null;
  trial_ativo: boolean | null;
  trial_fim: string | null;
  usuarios_qtd: number;
  profissionais_qtd: number;
  clientes_qtd: number;
  pedidos_qtd: number;
};

export type AdminWebPlanoRow = {
  id: string;
  nome: string;
  slug: string;
  valor: number;
  descricao: string | null;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_pedidos: number | null;
  limite_pedidos_mes: number | null;
  white_label: boolean;
  suporte_prioritario: boolean;
  acesso_financeiro_avancado: boolean;
  acesso_relatorios: boolean;
  ativo: boolean;
  empresas_qtd: number;
  created_at: string;
};

export type AdminWebAssinaturaRow = {
  assinatura_id: string;
  empresa_id: string;
  empresa_nome: string;
  empresa_slug: string;
  plano_id: string | null;
  plano_nome: string | null;
  plano_slug: string | null;
  status: string;
  trial_ativo: boolean;
  trial_inicio: string | null;
  trial_fim: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  created_at: string;
};

export type AdminWebUsuarioRow = {
  tenant_user_id: string;
  user_id: string;
  nome: string;
  email: string | null;
  empresa_id: string;
  empresa_nome: string;
  role: string;
  ativo: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdminWebPlanoPayload = {
  planoId?: string | null;
  nome: string;
  slug: string;
  valor: number;
  descricao?: string | null;
  limite_usuarios?: number | null;
  limite_profissionais?: number | null;
  limite_pedidos?: number | null;
  limite_pedidos_mes?: number | null;
  white_label?: boolean;
  suporte_prioritario?: boolean;
  acesso_financeiro_avancado?: boolean;
  acesso_relatorios?: boolean;
  ativo?: boolean;
};

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}

export async function adminWebGetDashboard() {
  const { data, error } = await supabase.rpc("admin_web_get_dashboard");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Não foi possível carregar o dashboard admin.");

  return {
    ...row,
    planos_mais_usados: parseJsonArray(row.planos_mais_usados),
    crescimento_empresas: parseJsonArray(row.crescimento_empresas),
    crescimento_pedidos: parseJsonArray(row.crescimento_pedidos),
    assinaturas_por_status: parseJsonArray(row.assinaturas_por_status),
  } as AdminWebDashboard;
}

export async function adminWebListEmpresas(search?: string, status?: string) {
  const { data, error } = await supabase.rpc("admin_web_list_empresas", {
    p_search: search?.trim() || null,
    p_status: status?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return (data || []) as AdminWebEmpresaRow[];
}

export async function adminWebListPlanos() {
  const { data, error } = await supabase.rpc("admin_web_list_planos");
  if (error) throw new Error(error.message);
  return (data || []) as AdminWebPlanoRow[];
}

export async function adminWebUpsertPlano(payload: AdminWebPlanoPayload) {
  const { data, error } = await supabase.rpc("admin_web_upsert_plano", {
    p_plano_id: payload.planoId ?? null,
    p_nome: payload.nome,
    p_slug: payload.slug,
    p_valor: payload.valor,
    p_descricao: payload.descricao ?? null,
    p_limite_usuarios: payload.limite_usuarios ?? null,
    p_limite_profissionais: payload.limite_profissionais ?? null,
    p_limite_pedidos: payload.limite_pedidos ?? null,
    p_limite_pedidos_mes: payload.limite_pedidos_mes ?? null,
    p_white_label: payload.white_label ?? false,
    p_suporte_prioritario: payload.suporte_prioritario ?? false,
    p_acesso_financeiro_avancado: payload.acesso_financeiro_avancado ?? false,
    p_acesso_relatorios: payload.acesso_relatorios ?? false,
    p_ativo: payload.ativo ?? true,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function adminWebSetPlanoActive(planoId: string, ativo: boolean) {
  const { error } = await supabase.rpc("admin_web_set_plano_active", {
    p_plano_id: planoId,
    p_ativo: ativo,
  });
  if (error) throw new Error(error.message);
}

export async function adminWebListAssinaturas(search?: string, status?: string) {
  const { data, error } = await supabase.rpc("admin_web_list_assinaturas", {
    p_search: search?.trim() || null,
    p_status: status?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return (data || []) as AdminWebAssinaturaRow[];
}

export async function adminWebUpdateAssinatura(payload: {
  assinaturaId: string;
  planoId?: string | null;
  status?: string | null;
  trialAtivo?: boolean | null;
  trialFim?: string | null;
  dataFim?: string | null;
  gatewayCustomerId?: string | null;
  gatewaySubscriptionId?: string | null;
}) {
  const { error } = await supabase.rpc("admin_web_update_assinatura", {
    p_assinatura_id: payload.assinaturaId,
    p_plano_id: payload.planoId ?? null,
    p_status: payload.status ?? null,
    p_trial_ativo: payload.trialAtivo ?? null,
    p_trial_fim: payload.trialFim ?? null,
    p_data_fim: payload.dataFim ?? null,
    p_gateway_customer_id: payload.gatewayCustomerId ?? null,
    p_gateway_subscription_id: payload.gatewaySubscriptionId ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function adminWebListUsuarios(search?: string, empresaId?: string, role?: string) {
  const { data, error } = await supabase.rpc("admin_web_list_usuarios", {
    p_search: search?.trim() || null,
    p_empresa_id: empresaId || null,
    p_role: role?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return (data || []) as AdminWebUsuarioRow[];
}

export async function adminWebSetTenantUserActive(tenantUserId: string, ativo: boolean) {
  const { error } = await supabase.rpc("admin_web_set_tenant_user_active", {
    p_tenant_user_id: tenantUserId,
    p_ativo: ativo,
  });
  if (error) throw new Error(error.message);
}

export async function adminWebLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminWebLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
