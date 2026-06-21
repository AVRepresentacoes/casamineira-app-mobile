export function getBadge(media: number, total: number) {
  if (total >= 15 && media >= 4.5) return "🌟 Destaque";
  if (total >= 5 && media >= 4) return "✔ Confiável";
  return "🆕 Novo";
}
