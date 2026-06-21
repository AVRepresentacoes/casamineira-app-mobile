import { supabase } from "@/lib/supabase";

type TenantRow = {
  tenant_id: string;
  slug: string;
  name: string;
  role: string;
  is_default: boolean;
  status: string;
  plan_code: string;
};

export type EmpresaContextRow = {
  empresa_id: string;
  tenant_id: string;
  slug: string;
  tenant_slug: string;
  nome: string;
  nome_exibicao: string | null;
  descricao: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  telefone: string | null;
  email: string | null;
  dominio: string | null;
  whatsapp: string | null;
  ativa: boolean;
  modo_marketplace: boolean;
  modo_white_label: boolean;
  role: string;
};

export type EmpresaSaasSubscriptionRow = {
  empresa_id: string;
  plano_id: string | null;
  plano_nome: string | null;
  plano_slug?: string | null;
  plano_valor: number | null;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_pedidos: number | null;
  limite_pedidos_mes?: number | null;
  white_label: boolean | null;
  suporte_prioritario: boolean | null;
  acesso_financeiro_avancado?: boolean | null;
  acesso_relatorios?: boolean | null;
  assinatura_status: string | null;
  trial_ativo?: boolean;
  trial_inicio?: string | null;
  trial_fim?: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  gateway_customer_id?: string | null;
  gateway_subscription_id: string | null;
};

export async function getCurrentTenantId(): Promise<string> {
  const { data, error } = await supabase.rpc("current_tenant_id");
  if (error || !data) {
    throw new Error(error?.message || "Não foi possível identificar o tenant ativo.");
  }
  return String(data);
}

export async function resolveCurrentTenantId(): Promise<string | null> {
  try {
    return await ensureCurrentUserTenantContext();
  } catch (ensureError) {
    console.log("RESOLVE TENANT ENSURE WARNING:", ensureError);
  }

  try {
    return await getCurrentTenantId();
  } catch (fallbackError) {
    console.log("RESOLVE TENANT FALLBACK WARNING:", fallbackError);
  }

  return null;
}

export async function getMeusTenants(): Promise<TenantRow[]> {
  const { data, error } = await supabase.rpc("get_meus_tenants");
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as TenantRow[];
}

export async function setTenantAtivo(tenantSlug: string): Promise<string> {
  const { data, error } = await supabase.rpc("set_tenant_ativo", {
    p_tenant_slug: tenantSlug,
  });

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível trocar o tenant ativo.");
  }

  return String(data);
}

export async function ensureCurrentUserTenantContext(): Promise<string> {
  const { data, error } = await supabase.rpc("ensure_current_user_tenant_context");

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível inicializar o tenant do usuário.");
  }

  return String(data);
}

export async function getCurrentEmpresaId(): Promise<string> {
  const { data, error } = await supabase.rpc("current_empresa_id");
  if (error || !data) {
    throw new Error(error?.message || "Não foi possível identificar a empresa ativa.");
  }
  return String(data);
}

export async function getMyEmpresaContext(): Promise<EmpresaContextRow> {
  const { data, error } = await supabase.rpc("get_my_empresa_context");
  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível carregar o contexto da empresa atual.");
  }

  return row as EmpresaContextRow;
}

export async function getMyEmpresaSaasSubscription(): Promise<EmpresaSaasSubscriptionRow | null> {
  const { data, error } = await supabase.rpc("get_my_empresa_saas_subscription");
  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as EmpresaSaasSubscriptionRow) : null;
}
