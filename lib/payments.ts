import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { registrarEventoOperacional } from "@/lib/stage2";

export type PagamentoStatus = "pendente" | "aprovada" | "recusada" | "estornada";

export type PagamentoPedido = {
  id: string;
  pedido_id: string;
  status_pagamento: PagamentoStatus;
  status_pagamentos?: PagamentoStatus | null;
  init_point?: string | null;
  payment_id?: string | null;
  valor_total?: number | null;
};

export type PixPagamento = {
  payment_id: string;
  status_pagamento: PagamentoStatus;
  qr_code: string;
  qr_code_base64: string;
  ticket_url?: string | null;
};

export type CartaoPagamentoPayload = {
  token: string;
  payment_method_id: string;
  issuer_id?: string | null;
  installments?: number;
  identification_type: string;
  identification_number: string;
  last_four_digits?: string;
};

export type CartaoPagamentoResult = {
  payment_id: string;
  status_pagamento: PagamentoStatus;
  status_detail?: string | null;
  transaction_amount?: number;
};

type PaymentProvider = "mercadopago" | "asaas";

function getPaymentProvider(): PaymentProvider {
  const raw = String(process.env.EXPO_PUBLIC_PAYMENT_PROVIDER || "mercadopago")
    .trim()
    .toLowerCase();

  if (raw === "asaas") return "asaas";
  return "mercadopago";
}

export async function gerarPagamentoMercadoPago(pedidoId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const candidates = [
    "create-mercadopago-preference",
    "create_mercadopago_preference",
    "mercadopago-preference",
  ];

  let data: any = null;
  let error: any = null;

  for (const fnName of candidates) {
    const result = await supabase.functions.invoke(fnName, {
      body: { pedidoId },
    });

    data = result.data;
    error = result.error;

    const msg = String((error as any)?.message || "").toLowerCase();
    if (!error) break;
    if (
      !msg.includes("not found") &&
      !msg.includes("requested function was not found")
    ) {
      break;
    }
  }

  if (error) {
    let detalhe = "";
    const context = (error as any)?.context;

    if (context && typeof context.json === "function") {
      try {
        const body = await context.json();
        detalhe = String(body?.error || body?.message || "").trim();
      } catch {
        // ignore
      }
    }

    throw new Error(detalhe || error.message || "Falha ao iniciar pagamento.");
  }

  if (!data?.init_point) {
    throw new Error("Checkout do Mercado Pago não retornou URL.");
  }

  await registrarEventoOperacional({
    evento: "pagamento_iniciado",
    pedidoId,
    metadata: { preferenceId: data.preference_id },
  });

  return data as { init_point: string; preference_id: string; status_pagamento: PagamentoStatus };
}

export async function obterPagamentoPorPedido(pedidoId: string) {
  const tenantId = await resolveCurrentTenantId();
  let query = supabase
    .from("pagamentos")
    .select("*")
    .eq("pedido_id", pedidoId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const pagamento = data as PagamentoPedido;
  const statusCompat = (pagamento.status_pagamento ||
    pagamento.status_pagamentos ||
    "pendente") as PagamentoStatus;

  return {
    ...pagamento,
    status_pagamento: statusCompat,
  };
}

export async function gerarPagamentoPixMercadoPago(pedidoId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const provider = getPaymentProvider();
  const candidates =
    provider === "asaas"
      ? [
          "create-asaas-pix-payment",
          "create_asaas_pix_payment",
          "asaas-pix-payment",
        ]
      : [
          "create-mercadopago-pix-payment",
          "create_mercadopago_pix_payment",
          "mercadopago-pix-payment",
        ];

  let data: any = null;
  let error: any = null;

  for (const fnName of candidates) {
    const result = await supabase.functions.invoke(fnName, {
      body: { pedidoId },
    });

    data = result.data;
    error = result.error;

    const msg = String((error as any)?.message || "").toLowerCase();
    if (!error) break;
    if (!msg.includes("not found") && !msg.includes("requested function was not found")) {
      break;
    }
  }

  if (error) {
    let detalhe = "";
    const context = (error as any)?.context;

    if (context && typeof context.json === "function") {
      try {
        const body = await context.json();
        detalhe = String(body?.error || body?.message || "").trim();
      } catch {
        // ignore
      }
    }

    throw new Error(
      detalhe ||
        error.message ||
        (provider === "asaas"
          ? "Falha ao gerar cobrança PIX no Asaas."
          : "Falha ao gerar cobrança PIX no Mercado Pago."),
    );
  }

  if (!data?.qr_code || !data?.qr_code_base64) {
    throw new Error(
      provider === "asaas"
        ? "Asaas não retornou dados do PIX."
        : "Mercado Pago não retornou dados do PIX.",
    );
  }

  await registrarEventoOperacional({
    evento: "pagamento_pix_gerado",
    pedidoId,
    metadata: { paymentId: data.payment_id },
  });

  return data as PixPagamento;
}

export async function gerarPagamentoCartaoMercadoPago(
  pedidoId: string,
  payload: CartaoPagamentoPayload,
) {
  const provider = getPaymentProvider();
  if (provider === "asaas") {
    throw new Error(
      "Pagamento com cartão via Asaas ainda não habilitado no app. Use PIX ou defina EXPO_PUBLIC_PAYMENT_PROVIDER=mercadopago para cartão.",
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const candidates = [
    "create-mercadopago-card-payment",
    "create_mercadopago_card_payment",
    "mercadopago-card-payment",
  ];

  let data: any = null;
  let error: any = null;

  for (const fnName of candidates) {
    const result = await supabase.functions.invoke(fnName, {
      body: { pedidoId, ...payload },
    });

    data = result.data;
    error = result.error;

    const msg = String((error as any)?.message || "").toLowerCase();
    if (!error) break;
    if (!msg.includes("not found") && !msg.includes("requested function was not found")) {
      break;
    }
  }

  if (error) {
    let detalhe = "";
    const context = (error as any)?.context;

    if (context && typeof context.json === "function") {
      try {
        const body = await context.json();
        detalhe = String(body?.error || body?.message || "").trim();
      } catch {
        // ignore
      }
    }

    throw new Error(detalhe || error.message || "Falha ao processar pagamento no cartão.");
  }

  if (!data?.payment_id) {
    throw new Error("Mercado Pago não retornou payment_id do cartão.");
  }

  await registrarEventoOperacional({
    evento: "pagamento_cartao_gerado",
    pedidoId,
    metadata: { paymentId: data.payment_id, status: data.status_pagamento },
  });

  return data as CartaoPagamentoResult;
}
