import { supabase } from "@/lib/supabase";

export type GasSortOption = "preco" | "tempo" | "avaliacao";

export type GasRevendedor = {
  id: string;
  empresa_id: string | null;
  fornecedor_id?: string | null;
  nome: string;
  whatsapp: string | null;
  preco_p13: number;
  tempo_entrega_min: number | null;
  bairro: string | null;
  cidade: string | null;
  avaliacao: number;
  ativo: boolean;
  created_at: string;
};

export type GasPedidoPayload = {
  revendedorId: string;
  preco: number;
  tipoBotijao?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
};

export type GasCheckoutPayload = {
  revendedorId: string;
  tipoBotijao?: string | null;
  checkoutToken: string;
  recebedor: string;
  endereco: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  referencia?: string | null;
};

export type GasPedido = {
  id: string;
  pedido_id?: string | null;
  revendedor_id: string | null;
  tipo_botijao: string;
  preco: number | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  status: string;
  status_pagamento?: string | null;
  total?: number | null;
  metodo_pagamento?: string | null;
  created_at: string;
  gas_revendedores?: {
    nome: string | null;
  } | null;
};

type GasPedidoRow = Omit<GasPedido, "gas_revendedores"> & {
  gas_revendedores?: { nome: string | null } | { nome: string | null }[] | null;
};

export function formatGasPrice(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatGasDeliveryTime(value: number | null) {
  if (!value || value <= 0) return "Entrega sob consulta";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function normalizeGasText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function listActiveGasRevendedores() {
  const { data, error } = await supabase
    .from("gas_revendedores")
    .select("id, empresa_id, fornecedor_id, nome, whatsapp, preco_p13, tempo_entrega_min, bairro, cidade, avaliacao, ativo, created_at")
    .eq("ativo", true)
    .order("preco_p13", { ascending: true })
    .order("avaliacao", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as GasRevendedor[]).map((item) => ({
    ...item,
    preco_p13: Number(item.preco_p13 || 0),
    tempo_entrega_min: item.tempo_entrega_min ? Number(item.tempo_entrega_min) : null,
    avaliacao: Number(item.avaliacao || 0),
  }));
}

export async function createGasCheckoutOrder(payload: GasCheckoutPayload) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Faça login para continuar com o pedido de gás.");
  }

  const { data, error } = await supabase.functions.invoke("create-gas-checkout-order", {
    body: {
      revendedorId: payload.revendedorId,
      tipoBotijao: payload.tipoBotijao?.trim() || "P13",
      checkoutToken: payload.checkoutToken.trim(),
      recebedor: payload.recebedor.trim(),
      endereco: payload.endereco.trim(),
      numero: payload.numero.trim(),
      complemento: payload.complemento?.trim() || null,
      bairro: payload.bairro.trim(),
      cidade: payload.cidade.trim(),
      referencia: payload.referencia?.trim() || null,
    },
  });

  if (error) {
    let detalhe = "";
    const context = (error as any)?.context;

    if (context && typeof context.json === "function") {
      try {
        const body = await context.json();
        detalhe = String(body?.error || body?.message || "").trim();
      } catch {
        // noop
      }
    }

    throw new Error(detalhe || error.message || "Não foi possível iniciar o checkout do gás.");
  }

  return {
    pedidoId: String((data as any)?.pedidoId || ""),
    gasPedidoId: String((data as any)?.gasPedidoId || ""),
    total: Number((data as any)?.total || 0),
  };
}

export async function createGasPedido(payload: GasPedidoPayload) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Faça login para solicitar gás.");
  }

  const { data, error } = await supabase
    .from("gas_pedidos")
    .insert({
      cliente_id: session.user.id,
      revendedor_id: payload.revendedorId,
      tipo_botijao: payload.tipoBotijao?.trim() || "P13",
      preco: Number(payload.preco || 0),
      endereco: payload.endereco?.trim() || null,
      bairro: payload.bairro?.trim() || null,
      cidade: payload.cidade?.trim() || null,
      status: "solicitado",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível registrar seu pedido de gás.");
  }

  return { id: String(data.id) };
}

export async function listMyGasPedidos(): Promise<GasPedido[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return [] as GasPedido[];
  }

  const { data, error } = await supabase
    .from("gas_pedidos")
    .select("id, pedido_id, revendedor_id, tipo_botijao, preco, total, endereco, bairro, cidade, status, status_pagamento, metodo_pagamento, created_at, gas_revendedores(nome)")
    .eq("cliente_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as GasPedidoRow[]).map((item): GasPedido => {
    const relation = Array.isArray(item.gas_revendedores)
      ? item.gas_revendedores[0] || null
      : item.gas_revendedores || null;

    return {
      ...item,
      preco: item.preco !== null ? Number(item.preco) : null,
      total: item.total !== null ? Number(item.total) : null,
      gas_revendedores: relation,
    };
  });
}

export function buildGasWhatsappUrl(params: {
  whatsapp: string | null;
  revendedorNome: string;
  pedidoId: string;
  preco: number;
  tipoBotijao?: string | null;
  bairro?: string | null;
  cidade?: string | null;
}) {
  const digits = String(params.whatsapp || "").replace(/\D/g, "");
  if (!digits) return null;

  const destino = params.bairro?.trim() || params.cidade?.trim() || "Itajubá";
  const message = [
    `Olá, ${params.revendedorNome}!`,
    `Acabei de solicitar um botijão ${params.tipoBotijao?.trim() || "P13"} pelo app Casa Mineira.`,
    `Pedido: ${params.pedidoId}`,
    `Preço informado: ${formatGasPrice(params.preco)}`,
    `Região de entrega: ${destino}.`,
  ].join("\n");

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
