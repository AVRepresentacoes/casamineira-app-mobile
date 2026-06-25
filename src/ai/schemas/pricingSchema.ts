export type PricingSchema = {
  setupPrice: number;
  monthlyPrice: number;
  aiCostReserve: number;
  marginPercent: number;
  currency: "BRL";
};

export function estimatePricing(featureCount: number, urgency: "baixa" | "media" | "alta"): PricingSchema {
  const urgencyMultiplier = urgency === "alta" ? 1.25 : urgency === "media" ? 1.1 : 1;
  const setupPrice = Math.round((2500 + featureCount * 650) * urgencyMultiplier);

  return {
    setupPrice,
    monthlyPrice: Math.max(297, Math.round(setupPrice * 0.08)),
    aiCostReserve: 150,
    marginPercent: 55,
    currency: "BRL",
  };
}
