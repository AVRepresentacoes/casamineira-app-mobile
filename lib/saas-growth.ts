import { supabase } from "@/lib/supabase";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";

export type DashboardSummary = {
  empresa_id: string;
  pedidos_total: number;
  pedidos_mes: number;
  clientes_total: number;
  profissionais_total: number;
  profissionais_ativos: number;
  receita_estimada: number;
  pedidos_recentes: Array<{ id: string; categoria?: string | null; status?: string | null; created_at?: string | null }>;
  atividade_recente: Array<{ tipo: string; titulo: string; created_at?: string | null }>;
};

export type ProfissionalInvite = {
  id: string;
  email: string;
  nome: string | null;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type PublicInviteInfo = {
  convite_id: string;
  empresa_id: string;
  empresa_nome: string;
  empresa_logo_url: string | null;
  email: string;
  nome: string | null;
  status: string;
  expires_at: string;
};

export async function getPublicSaasPlans() {
  const { data, error } = await supabase.rpc("get_public_planos_saas");
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as SaasPlanoComercial[];
}

export async function getMyEmpresaDashboardSummary() {
  const { data, error } = await supabase.rpc("get_my_empresa_dashboard_summary");
  if (error) {
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível carregar o dashboard da empresa.");
  }
  return row as DashboardSummary;
}

export async function createProfissionalInvite(email: string, nome?: string | null) {
  const { data, error } = await supabase.rpc("create_profissional_invite", {
    p_email: email,
    p_nome: nome ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Não foi possível criar o convite.");
  }
  return row as { convite_id: string; token: string; invite_url: string; expires_at: string };
}

export async function listCurrentEmpresaProfissionalInvites() {
  const { data, error } = await supabase.rpc("list_current_empresa_profissional_invites");
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as ProfissionalInvite[];
}

export async function getProfissionalInvitePublic(token: string) {
  const { data, error } = await supabase.rpc("get_profissional_invite_public", {
    p_token: token,
  });
  if (error) {
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Convite não encontrado.");
  }
  return row as PublicInviteInfo;
}

export async function acceptProfissionalInvite(token: string, nome?: string | null) {
  const { data, error } = await supabase.rpc("accept_profissional_invite", {
    p_token: token,
    p_nome: nome ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return String(data);
}
