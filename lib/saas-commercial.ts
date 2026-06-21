import { supabase } from "@/lib/supabase";

export type SaasPlanoComercial = {
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
};

export type EmpresaCommercialContext = {
  empresa_id: string;
  plano_id: string | null;
  plano_nome: string | null;
  plano_slug: string | null;
  plano_valor: number | null;
  plano_descricao: string | null;
  assinatura_status: string | null;
  trial_ativo: boolean;
  trial_inicio: string | null;
  trial_fim: string | null;
  trial_expirado: boolean;
  assinatura_bloqueada: boolean;
  limite_usuarios: number | null;
  limite_profissionais: number | null;
  limite_pedidos_mes: number | null;
  usuarios_usados: number;
  profissionais_usados: number;
  pedidos_mes_usados: number;
  white_label: boolean;
  suporte_prioritario: boolean;
  acesso_financeiro_avancado: boolean;
  acesso_relatorios: boolean;
  usuarios_restantes: number | null;
  profissionais_restantes: number | null;
  pedidos_mes_restantes: number | null;
};

export type EmpresaOnboardingStatus = {
  empresa_id: string;
  branding_ok: boolean;
  whatsapp_ok: boolean;
  tem_profissional: boolean;
  tem_cliente: boolean;
  tem_pedido: boolean;
  checklist_concluido: boolean;
};

export type SaasCommercialMetrics = {
  empresas_trial: number;
  empresas_ativas: number;
  empresas_inadimplentes: number;
  empresas_canceladas: number;
  empresas_pausadas: number;
  empresas_expiradas: number;
  mrr_estimado: number;
  starter_qtd: number;
  pro_qtd: number;
  enterprise_qtd: number;
};

export type PlanChangePreview = {
  plano_atual_id: string | null;
  plano_atual_slug: string | null;
  plano_atual_nome: string | null;
  novo_plano_id: string;
  novo_plano_slug: string;
  novo_plano_nome: string;
  can_apply: boolean;
  requires_attention: boolean;
  motivo: string | null;
  usuarios_usados: number;
  profissionais_usados: number;
  pedidos_mes_usados: number;
  limite_usuarios_novo: number | null;
  limite_profissionais_novo: number | null;
  limite_pedidos_mes_novo: number | null;
};

export type OnboardEmpresaPayload = {
  empresaNome: string;
  segmento?: string | null;
  cidade?: string | null;
  estado?: string | null;
  whatsapp?: string | null;
  empresaEmail?: string | null;
  adminNome?: string | null;
  planoSlug?: string;
  trialDias?: number;
};

export type OnboardEmpresaResult = {
  empresa_id: string;
  tenant_slug: string;
  assinatura_id: string;
  plano_slug: string;
};

export async function getActiveSaasPlans() {
  const { data, error } = await supabase
    .from("planos_saas")
    .select(
      "id, nome, slug, valor, descricao, limite_usuarios, limite_profissionais, limite_pedidos, limite_pedidos_mes, white_label, suporte_prioritario, acesso_financeiro_avancado, acesso_relatorios, ativo"
    )
    .eq("ativo", true)
    .order("valor", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SaasPlanoComercial[];
}

export async function getMyEmpresaCommercialContext() {
  const { data, error } = await supabase.rpc("get_my_empresa_commercial_context");
  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível carregar o contexto comercial da empresa.");
  }

  return row as EmpresaCommercialContext;
}

export async function getMyEmpresaOnboardingStatus() {
  const { data, error } = await supabase.rpc("get_my_empresa_onboarding_status");
  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível carregar o checklist da empresa.");
  }

  return row as EmpresaOnboardingStatus;
}

export async function getSaasCommercialMetrics() {
  const { data, error } = await supabase.rpc("get_saas_commercial_metrics");
  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível carregar as métricas comerciais.");
  }

  return row as SaasCommercialMetrics;
}

export async function onboardMySaasEmpresa(payload: OnboardEmpresaPayload) {
  const { data, error } = await supabase.rpc("onboard_my_saas_empresa", {
    p_empresa_nome: payload.empresaNome,
    p_segmento: payload.segmento ?? null,
    p_cidade: payload.cidade ?? null,
    p_estado: payload.estado ?? null,
    p_whatsapp: payload.whatsapp ?? null,
    p_empresa_email: payload.empresaEmail ?? null,
    p_admin_nome: payload.adminNome ?? null,
    p_plano_slug: payload.planoSlug ?? "starter",
    p_trial_dias: payload.trialDias ?? 14,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível concluir o onboarding da empresa.");
  }

  return row as OnboardEmpresaResult;
}

export async function extendSaasTrial(empresaId: string, extraDays = 7) {
  const { error } = await supabase.rpc("saas_admin_extend_trial", {
    p_empresa_id: empresaId,
    p_extra_days: extraDays,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function previewCurrentEmpresaPlanChange(planoId: string) {
  const { data, error } = await supabase.rpc("preview_current_empresa_plan_change", {
    p_plano_id: planoId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível simular a troca de plano.");
  }

  return row as PlanChangePreview;
}

export async function changeCurrentEmpresaPlan(planoId: string) {
  const { error } = await supabase.rpc("change_current_empresa_plan", {
    p_plano_id: planoId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function assertEmpresaCanPerform(action: string) {
  const { error } = await supabase.rpc("assert_current_empresa_plan_allows", {
    p_action: action,
  });

  if (error) {
    throw new Error(error.message);
  }
}
