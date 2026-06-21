export function formatCurrencyInputBR(input: string) {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";

  const cents = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents);
}

export function parseCurrencyInputBR(input: string) {
  const normalized = String(input || "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
