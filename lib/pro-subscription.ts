import { supabase } from "@/lib/supabase";

export type ProfessionalSubscriptionTier = "starter" | "pro" | "elite";
export type AnalyticsAccessMode = "basic" | "advanced" | "complete";

export type ProfessionalSubscriptionPlan = {
  tier: ProfessionalSubscriptionTier;
  label: string;
  priceLabel: string;
  commissionRate: number;
  commissionLabel: string;
  limits: {
    services: number | null;
    portfolio: number | null;
  };
  features: {
    analytics: AnalyticsAccessMode;
    growthDashboard: boolean;
    rankingBoost: "base" | "boosted" | "elite";
  };
};

type SubscriptionRow = {
  subscription_tier?: string | null;
  plano_ativo?: boolean | null;
};

export type ProfessionalSubscriptionContext = {
  userId: string;
  tier: ProfessionalSubscriptionTier;
  plan: ProfessionalSubscriptionPlan;
};

export const PROFESSIONAL_SUBSCRIPTION_PLANS: Record<
  ProfessionalSubscriptionTier,
  ProfessionalSubscriptionPlan
> = {
  starter: {
    tier: "starter",
    label: "Starter PRO",
    priceLabel: "R$ 29,90/mês",
    commissionRate: 20,
    commissionLabel: "20%",
    limits: {
      services: 10,
      portfolio: 10,
    },
    features: {
      analytics: "basic",
      growthDashboard: false,
      rankingBoost: "base",
    },
  },
  pro: {
    tier: "pro",
    label: "Pro Performance",
    priceLabel: "R$ 79,90/mês",
    commissionRate: 15,
    commissionLabel: "15%",
    limits: {
      services: 30,
      portfolio: 40,
    },
    features: {
      analytics: "advanced",
      growthDashboard: true,
      rankingBoost: "boosted",
    },
  },
  elite: {
    tier: "elite",
    label: "Elite Black",
    priceLabel: "R$ 149,90/mês",
    commissionRate: 8,
    commissionLabel: "8%",
    limits: {
      services: null,
      portfolio: null,
    },
    features: {
      analytics: "complete",
      growthDashboard: true,
      rankingBoost: "elite",
    },
  },
};

export function normalizeProfessionalSubscriptionTier(
  rawTier?: string | null,
  legacyPremium?: boolean | null,
): ProfessionalSubscriptionTier {
  const normalized = String(rawTier || "").trim().toLowerCase();
  if (normalized === "starter" || normalized === "pro" || normalized === "elite") {
    return normalized;
  }
  return legacyPremium ? "pro" : "starter";
}

export function getProfessionalSubscriptionPlan(tier: ProfessionalSubscriptionTier) {
  return PROFESSIONAL_SUBSCRIPTION_PLANS[tier];
}

export function getProfessionalCommissionDecimal(tier: ProfessionalSubscriptionTier) {
  return PROFESSIONAL_SUBSCRIPTION_PLANS[tier].commissionRate / 100;
}

export function hasProfessionalFullAccess(
  subscription?: ProfessionalSubscriptionContext | null,
) {
  return subscription?.tier === "elite";
}

export function getUsageLabel(current: number, limit: number | null) {
  if (limit === null) return `${current} usados`;
  return `${current}/${limit} usados`;
}

export function hasReachedLimit(current: number, limit: number | null) {
  return limit !== null && current >= limit;
}

export async function loadProfessionalSubscriptionContext(
  userId?: string,
): Promise<ProfessionalSubscriptionContext | null> {
  let uid = userId || "";

  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id || "";
  }

  if (!uid) return null;

  const [profileRes, profissionalRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("profissionais").select("*").eq("user_id", uid).maybeSingle(),
  ]);

  const profile = (profileRes.data || null) as SubscriptionRow | null;
  const profissional = (profissionalRes.data || null) as SubscriptionRow | null;

  const tier = normalizeProfessionalSubscriptionTier(
    profissional?.subscription_tier || profile?.subscription_tier,
    Boolean(profissional?.plano_ativo ?? profile?.plano_ativo),
  );

  return {
    userId: uid,
    tier,
    plan: getProfessionalSubscriptionPlan(tier),
  };
}

export async function updateProfessionalSubscriptionTier(
  tier: ProfessionalSubscriptionTier,
  userId?: string,
): Promise<ProfessionalSubscriptionContext | null> {
  let uid = userId || "";

  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id || "";
  }

  if (!uid) {
    throw new Error("Usuário não autenticado.");
  }

  const planoAtivo = tier === "pro" || tier === "elite";

  const [profileRes, profissionalRes] = await Promise.all([
    supabase
      .from("profiles")
      .update({ subscription_tier: tier, plano_ativo: planoAtivo })
      .eq("id", uid),
    supabase
      .from("profissionais")
      .update({ subscription_tier: tier, plano_ativo: planoAtivo })
      .eq("user_id", uid),
  ]);

  if (profileRes.error) {
    throw profileRes.error;
  }

  if (profissionalRes.error) {
    throw profissionalRes.error;
  }

  return loadProfessionalSubscriptionContext(uid);
}
