export type PaymentIntegrationPlan = {
  providers: string[];
  requiredSecrets: string[];
};

export function planPaymentIntegrations(features: string[]): PaymentIntegrationPlan {
  const usesPix = features.some((feature) => feature.toLowerCase().includes("pix"));

  return {
    providers: usesPix ? ["Mercado Pago", "Asaas"] : ["Mercado Pago"],
    requiredSecrets: usesPix ? ["MERCADO_PAGO_ACCESS_TOKEN", "ASAAS_API_KEY"] : ["MERCADO_PAGO_ACCESS_TOKEN"],
  };
}
