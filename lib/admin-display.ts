export function normalizeAdminPlanoNome(value: string | null | undefined, slug?: string | null) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();
  const normalizedSlug = String(slug || "").trim().toLowerCase();

  if (normalizedSlug === "starter") {
    return "Starter";
  }

  if (normalizedSlug === "pro") {
    return "Pro";
  }

  if (normalizedSlug === "enterprise") {
    return "Enterprise";
  }

  if (!raw) {
    return "";
  }

  if (normalized === "os peixes" || normalized === "o peixe") {
    return "Enterprise";
  }

  if (normalized === "por") {
    return "Plano";
  }

  return raw;
}
