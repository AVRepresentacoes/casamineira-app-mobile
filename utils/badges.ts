export type BadgeTipo = "novo" | "confiavel" | "destaque";

export function getBadge(media: number, total: number): BadgeTipo {
  if (total >= 15 && media >= 4.5) return "destaque";
  if (total >= 5 && media >= 4) return "confiavel";
  return "novo";
}
