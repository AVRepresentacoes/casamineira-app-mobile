export type SaasBillingProvider = "mercadopago" | "stripe" | "asaas" | "manual";

export type SaasBillingCustomerInput = {
  empresaId: string;
  email: string | null;
  nome: string;
  telefone?: string | null;
};

export type SaasBillingSubscriptionInput = {
  empresaId: string;
  planoId: string;
  provider: SaasBillingProvider;
  customerId?: string | null;
  trialDays?: number | null;
};

export type SaasBillingSyncPayload = {
  empresaId: string;
  assinaturaId: string;
  provider: SaasBillingProvider;
  gatewayCustomerId?: string | null;
  gatewaySubscriptionId?: string | null;
  status?: string | null;
  payload?: Record<string, unknown> | null;
};

export interface SaasBillingAdapter {
  provider: SaasBillingProvider;
  createCustomer(input: SaasBillingCustomerInput): Promise<{ gatewayCustomerId: string }>;
  createSubscription(input: SaasBillingSubscriptionInput): Promise<{ gatewaySubscriptionId: string; checkoutUrl?: string | null }>;
  cancelSubscription(input: { gatewaySubscriptionId: string }): Promise<void>;
  syncStatus(input: SaasBillingSyncPayload): Promise<void>;
}

class PendingBillingAdapter implements SaasBillingAdapter {
  constructor(public provider: SaasBillingProvider) {}

  async createCustomer(_input: SaasBillingCustomerInput): Promise<{ gatewayCustomerId: string }> {
    throw new Error(`Integração SaaS com ${this.provider} ainda não foi ativada.`);
  }

  async createSubscription(
    _input: SaasBillingSubscriptionInput
  ): Promise<{ gatewaySubscriptionId: string; checkoutUrl?: string | null }> {
    throw new Error(`Checkout SaaS com ${this.provider} ainda não foi ativado.`);
  }

  async cancelSubscription(_input: { gatewaySubscriptionId: string }): Promise<void> {
    throw new Error(`Cancelamento SaaS com ${this.provider} ainda não foi ativado.`);
  }

  async syncStatus(_input: SaasBillingSyncPayload): Promise<void> {
    throw new Error(`Sincronização SaaS com ${this.provider} ainda não foi ativada.`);
  }
}

export function getSaasBillingAdapter(provider: SaasBillingProvider) {
  return new PendingBillingAdapter(provider);
}
