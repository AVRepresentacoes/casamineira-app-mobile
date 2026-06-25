export type AnalyticsEventPlan = {
  events: string[];
  funnels: string[];
};

export function planAnalyticsEvents(): AnalyticsEventPlan {
  return {
    events: ["signup_started", "signup_completed", "first_booking", "payment_started", "payment_completed"],
    funnels: ["aquisicao", "ativacao", "pagamento", "retencao"],
  };
}
