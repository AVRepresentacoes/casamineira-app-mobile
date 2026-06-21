export type ProfessionalSubscriptionTier = "starter" | "pro" | "elite";

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

export function getProfessionalCommissionRateForTier(tier: ProfessionalSubscriptionTier) {
  if (tier === "elite") return 0.08;
  if (tier === "pro") return 0.15;
  return 0.2;
}

export async function resolveProfessionalCommissionProfile(
  supabaseAdmin: any,
  profissionalId: string,
) {
  const [profileRes, profissionalRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("subscription_tier, plano_ativo").eq("id", profissionalId).maybeSingle(),
    supabaseAdmin.from("profissionais").select("subscription_tier, plano_ativo").eq("user_id", profissionalId).maybeSingle(),
  ]);

  const profile = profileRes.data || null;
  const profissional = profissionalRes.data || null;
  const tier = normalizeProfessionalSubscriptionTier(
    profissional?.subscription_tier || profile?.subscription_tier,
    Boolean(profissional?.plano_ativo ?? profile?.plano_ativo),
  );
  const commissionRate = getProfessionalCommissionRateForTier(tier);

  return {
    tier,
    commissionRate,
    commissionPercent: Number((commissionRate * 100).toFixed(2)),
  };
}
