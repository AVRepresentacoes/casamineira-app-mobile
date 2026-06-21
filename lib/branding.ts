import { supabase } from "@/lib/supabase";

export type BrandingConfig = {
  tenantSlug: string;
  appName: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  supportWhatsapp: string | null;
};

export const DEFAULT_BRANDING: BrandingConfig = {
  tenantSlug: "default",
  appName: "Casa Mineira Serviços",
  slogan: "Conectando profissionais e clientes",
  primaryColor: "#facc15",
  secondaryColor: "#020617",
  accentColor: "#1e293b",
  logoUrl: null,
  supportWhatsapp: null,
};

function sanitizeHexColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color) || /^#[0-9a-fA-F]{3}$/.test(color)) {
    return color;
  }
  return fallback;
}

function normalizeBrandingRow(row: any): BrandingConfig {
  return {
    tenantSlug: String(row?.tenant_slug || DEFAULT_BRANDING.tenantSlug),
    appName: String(row?.app_name || DEFAULT_BRANDING.appName),
    slogan: String(row?.slogan || DEFAULT_BRANDING.slogan),
    primaryColor: sanitizeHexColor(row?.primary_color, DEFAULT_BRANDING.primaryColor),
    secondaryColor: sanitizeHexColor(row?.secondary_color, DEFAULT_BRANDING.secondaryColor),
    accentColor: sanitizeHexColor(row?.accent_color, DEFAULT_BRANDING.accentColor),
    logoUrl: row?.logo_url ? String(row.logo_url) : null,
    supportWhatsapp: row?.support_whatsapp ? String(row.support_whatsapp) : null,
  };
}

function resolveTenantSlug() {
  const fromEnv = String(process.env.EXPO_PUBLIC_TENANT_SLUG || "")
    .trim()
    .toLowerCase();
  return fromEnv || "default";
}

export async function loadBrandingConfig(): Promise<BrandingConfig> {
  const tenantSlug = resolveTenantSlug();

  try {
    const { data, error } = await supabase
      .from("app_branding")
      .select(
        "tenant_slug,app_name,slogan,primary_color,secondary_color,accent_color,logo_url,support_whatsapp,active",
      )
      .eq("active", true)
      .in("tenant_slug", [tenantSlug, "default"]);

    if (error || !data || data.length === 0) {
      return { ...DEFAULT_BRANDING, tenantSlug };
    }

    const exact = data.find((row) => String(row.tenant_slug || "").toLowerCase() === tenantSlug);
    const fallback = data.find((row) => String(row.tenant_slug || "").toLowerCase() === "default");

    const picked = exact || fallback || data[0];
    return normalizeBrandingRow(picked);
  } catch {
    return { ...DEFAULT_BRANDING, tenantSlug };
  }
}
