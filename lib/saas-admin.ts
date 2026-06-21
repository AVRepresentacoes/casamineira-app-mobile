import { supabase } from "@/lib/supabase";

export type SaasEmpresaOverview = {
  empresa_id: string;
  slug: string;
  nome: string;
  ativa: boolean;
  usuarios_qtd: number;
  pedidos_qtd: number;
  plano_nome: string | null;
  assinatura_status: string | null;
};

export type SaasPlano = {
  id: string;
  nome: string;
  slug?: string;
  valor: number;
  descricao?: string | null;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_pedidos: number | null;
  limite_pedidos_mes?: number | null;
  white_label: boolean;
  suporte_prioritario: boolean;
  acesso_financeiro_avancado?: boolean;
  acesso_relatorios?: boolean;
  ativo?: boolean;
};

export type SaasEmpresaDetail = {
  empresa_id: string;
  slug: string;
  nome: string;
  ativa: boolean;
  dominio: string | null;
  telefone: string | null;
  email: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  nome_exibicao: string | null;
  descricao: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  modo_marketplace: boolean;
  modo_white_label: boolean;
  usuarios_qtd: number;
  pedidos_qtd: number;
  profissionais_qtd?: number;
  plano_id: string | null;
  plano_nome: string | null;
  plano_valor: number | null;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_pedidos: number | null;
  limite_pedidos_mes?: number | null;
  white_label: boolean | null;
  suporte_prioritario: boolean | null;
  assinatura_id: string | null;
  assinatura_status: string | null;
  trial_ativo?: boolean;
  trial_inicio?: string | null;
  trial_fim?: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  gateway_customer_id?: string | null;
  gateway_subscription_id: string | null;
};

export type UpdateSaasEmpresaPayload = {
  nome?: string;
  slug?: string;
  ativa?: boolean;
  dominio?: string | null;
  telefone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  cor_primaria?: string | null;
  cor_secundaria?: string | null;
  nome_exibicao?: string | null;
  descricao?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  modo_marketplace?: boolean;
  modo_white_label?: boolean;
  plano_id?: string | null;
  assinatura_status?: string | null;
  gateway_subscription_id?: string | null;
};

export async function getSaasEmpresasOverview() {
  const { data, error } = await supabase.rpc("get_saas_empresas_overview");
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as SaasEmpresaOverview[];
}

export async function isCurrentUserSuperAdmin() {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

export async function createSaasEmpresa(nome: string, slug: string) {
  const { data, error } = await supabase.rpc("saas_admin_create_empresa", {
    p_nome: nome,
    p_slug: slug,
    p_admin_user_id: null,
    p_dominio: null,
  });

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível criar a empresa.");
  }

  return String(data);
}

export async function setSaasEmpresaStatus(empresaId: string, ativa: boolean) {
  const { error } = await supabase.rpc("saas_admin_set_empresa_status", {
    p_empresa_id: empresaId,
    p_ativa: ativa,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getSaasPlanos() {
  const { data, error } = await supabase.rpc("get_active_planos_saas");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SaasPlano[];
}

export async function getSaasEmpresaDetail(empresaId: string) {
  const { data, error } = await supabase.rpc("get_saas_empresa_detail", {
    p_empresa_id: empresaId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Empresa SaaS não encontrada.");
  }

  return row as SaasEmpresaDetail;
}

export async function updateSaasEmpresa(empresaId: string, payload: UpdateSaasEmpresaPayload) {
  const { error } = await supabase.rpc("saas_admin_update_empresa", {
    p_empresa_id: empresaId,
    p_nome: payload.nome ?? null,
    p_slug: payload.slug ?? null,
    p_ativa: payload.ativa ?? null,
    p_dominio: payload.dominio ?? null,
    p_telefone: payload.telefone ?? null,
    p_email: payload.email ?? null,
    p_logo_url: payload.logo_url ?? null,
    p_cor_primaria: payload.cor_primaria ?? null,
    p_cor_secundaria: payload.cor_secundaria ?? null,
    p_nome_exibicao: payload.nome_exibicao ?? null,
    p_descricao: payload.descricao ?? null,
    p_whatsapp: payload.whatsapp ?? null,
    p_endereco: payload.endereco ?? null,
    p_cidade: payload.cidade ?? null,
    p_estado: payload.estado ?? null,
    p_modo_marketplace: payload.modo_marketplace ?? null,
    p_modo_white_label: payload.modo_white_label ?? null,
    p_plano_id: payload.plano_id ?? null,
    p_assinatura_status: payload.assinatura_status ?? null,
    p_gateway_subscription_id: payload.gateway_subscription_id ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function assignSaasEmpresaAdmin(empresaId: string, userId: string) {
  const { error } = await supabase.rpc("saas_admin_assign_empresa_admin", {
    p_empresa_id: empresaId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function extendSaasEmpresaTrial(empresaId: string, extraDays: number) {
  const { error } = await supabase.rpc("saas_admin_extend_trial", {
    p_empresa_id: empresaId,
    p_extra_days: extraDays,
  });

  if (error) {
    throw new Error(error.message);
  }
}
