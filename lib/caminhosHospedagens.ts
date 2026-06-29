import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import type { ImageSourcePropType } from "react-native";

export type HospedagemAmenidade =
  | "cafe"
  | "jantar"
  | "lavanderia"
  | "bike"
  | "wifi"
  | "mochila"
  | "privativo"
  | "compartilhado"
  | "carimbo";

export type CaminhoHospedagem = {
  id: string;
  nome: string;
  cidade: string;
  uf: "MG" | "SP";
  ramal: string;
  etapaKm: number;
  distanciaTrilhaKm: number;
  diariaBase: number;
  avaliacao: number;
  fotos: ImageSourcePropType[];
  whatsapp: string;
  endereco: string;
  descricao: string;
  amenidades: HospedagemAmenidade[];
  servicosAdicionais: CaminhoServicoAdicional[];
  quartos: CaminhoQuarto[];
};

export type CaminhoServicoAdicional = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  unidade: string;
  categoria: "alimentacao" | "lavanderia" | "apoio" | "transporte";
  icon: "restaurant-outline" | "shirt-outline" | "cafe-outline" | "bicycle-outline" | "bag-handle-outline" | "car-outline";
  confirmacao: string;
};

export type CaminhoQuarto = {
  id: string;
  dbId?: string;
  nome: string;
  tipo: "privativo" | "compartilhado" | "casal" | "familia";
  capacidade: number;
  diaria: number;
  disponivel: boolean;
  descricao?: string;
  fotos?: string[];
};

export type ReservaResumo = {
  hospedagem: CaminhoHospedagem;
  quarto: CaminhoQuarto;
  checkin: string;
  checkout: string;
  hospedes: number;
  noites: number;
  total: number;
  sinal: number;
  comissao: number;
  repasseInicial: number;
  restanteNaPousada: number;
};

export type CaminhoHospedagemReservaCliente = {
  id: string;
  hospedagemSlug: string;
  hospedagemNome: string;
  cidade: string;
  quartoNome: string;
  checkin: string;
  checkout: string;
  hospedes: number;
  total: number;
  sinal: number;
  restanteNaPousada: number;
  status: string;
  statusPagamento: string;
  createdAt: string;
};

export type HospedagemPagamentoStatus = "pendente" | "aprovada" | "recusada" | "estornada";

export type HospedagemPixPagamento = {
  checkoutConfigured?: boolean;
  provider?: string;
  reservaId?: string;
  valorSinal?: number;
  message?: string;
  payment_id?: string;
  status_pagamento?: HospedagemPagamentoStatus;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string | null;
};

export type HospedagemCartaoPagamentoPayload = {
  token: string;
  payment_method_id: string;
  issuer_id?: string | null;
  installments?: number;
  identification_type: string;
  identification_number: string;
  last_four_digits?: string;
};

export type HospedagemCartaoPagamentoResult = {
  checkoutConfigured?: boolean;
  provider?: string;
  reservaId?: string;
  valorSinal?: number;
  message?: string;
  payment_id?: string;
  status_pagamento?: HospedagemPagamentoStatus;
  status_detail?: string | null;
  transaction_amount?: number;
};

export type PainelPousadaReserva = {
  id: string;
  cliente: string;
  telefone: string;
  quarto: string;
  checkin: string;
  checkout: string;
  hospedes: number;
  total: number;
  sinal: number;
  comissao: number;
  repasseInicial: number;
  restanteNaChegada: number;
  extras: number;
  status: "aguardando_pagamento" | "confirmada" | "checkin_hoje" | "concluida" | "cancelada";
  observacao: string;
};

export type PainelPousadaDisponibilidade = {
  dia: string;
  status: "livre" | "ocupado" | "bloqueado" | "manutencao";
  detalhe: string;
};

export type PainelPousadaData = {
  source: "supabase";
  pousadaDbId: string | null;
  pousada: CaminhoHospedagem;
  reservas: PainelPousadaReserva[];
  quartos: CaminhoQuarto[];
  servicos: CaminhoServicoAdicional[];
  disponibilidade: PainelPousadaDisponibilidade[];
  visivel: boolean;
  autoConfirmar: boolean;
  respostaRapida: string;
  gatewayStatus: string;
};

function buildEmptyHospedagem(): CaminhoHospedagem {
  return {
    id: "",
    nome: "",
    cidade: "",
    uf: "MG",
    ramal: "",
    etapaKm: 0,
    distanciaTrilhaKm: 0,
    diariaBase: 0,
    avaliacao: 0,
    fotos: [CAMINHOS_ASSETS.pousadaExterior],
    whatsapp: "",
    endereco: "",
    descricao: "",
    amenidades: [],
    servicosAdicionais: [],
    quartos: [],
  };
}

export type HospedagensAdminPousada = {
  id: string;
  slug: string;
  nome: string;
  cidade: string;
  uf: string;
  status: "pendente" | "aprovada" | "suspensa" | "recusada";
  visivel: boolean;
  gatewayStatus: string;
  quartos: number;
  createdAt: string;
};

export type HospedagensAdminReserva = {
  id: string;
  hospedagemNome: string;
  cidade: string;
  cliente: string;
  quarto: string;
  checkin: string;
  checkout: string;
  total: number;
  sinal: number;
  comissao: number;
  repasseInicial: number;
  restanteNaPousada: number;
  status: string;
  statusPagamento: string;
  createdAt: string;
};

export type HospedagensAdminData = {
  source: "supabase";
  metrics: {
    pousadas: number;
    pousadasPendentes: number;
    reservas: number;
    gmv: number;
    sinais: number;
    comissao: number;
    repasse: number;
    canceladas: number;
  };
  pousadas: HospedagensAdminPousada[];
  reservas: HospedagensAdminReserva[];
  chamados: CaminhoHospedagemChamado[];
};

export type CaminhoHospedagemChamado = {
  id: string;
  reservaId: string | null;
  clienteId: string | null;
  pousadaId: string | null;
  papelAbertura: "cliente" | "pousada" | "admin";
  tipo: "duvida" | "cancelamento" | "reembolso" | "no_show" | "problema_quarto" | "divergencia_preco" | "pousada_indisponivel" | "pagamento" | "outro";
  prioridade: "baixa" | "normal" | "alta" | "critica";
  status: "aberto" | "em_analise" | "aguardando_resposta" | "resolvido" | "fechado";
  titulo: string;
  descricao: string;
  respostaAdmin: string;
  decisao: string;
  createdAt: string;
};

export type CaminhoHospedagemAvaliacao = {
  id: string;
  reservaId: string | null;
  hospedagemSlug: string;
  hospedagemNome: string;
  notaGeral: number;
  limpeza: number;
  atendimento: number;
  localizacao: number;
  custoBeneficio: number;
  comentario: string;
  publicada: boolean;
  createdAt: string;
};

export type CaminhoHospedagemFavorito = {
  id: string;
  hospedagemSlug: string;
  hospedagemNome: string;
  cidade: string;
  etapaOrdem: number | null;
  checkinPlanejado: string | null;
  observacao: string;
  createdAt: string;
};

export type CaminhoHospedagemNotificacao = {
  id: string;
  papel: "cliente" | "pousada" | "admin";
  titulo: string;
  mensagem: string;
  tipo: "sistema" | "reserva" | "pagamento" | "suporte" | "avaliacao" | "admin";
  lida: boolean;
  createdAt: string;
};

export const CAMINHOS_REGRAS_NEGOCIO = {
  sinalPercentual: 0.5,
  comissaoLancamentoPercentual: 0.12,
  comissaoPadraoPercentual: 0.15,
  multaPousadaPercentual: 0.1,
  taxaOperacionalCancelamentoAntecipado: 0.2,
  reembolsoCancelamentoIntermediario: 0.5,
  horasCancelamentoAntecipado: 72,
  horasCancelamentoIntermediario: 24,
};

export const CAMINHOS_CIDADES_INICIAIS = [
  "Águas da Prata",
  "Andradas",
  "Ouro Fino",
  "Borda da Mata",
  "Tocos do Moji",
  "Estiva",
  "Consolação",
  "Paraisópolis",
  "Campos do Jordão",
  "Pindamonhangaba",
  "Aparecida",
];

export const CAMINHOS_ASSETS = {
  logo: require("@/assets/images/hospedagens-caminhos-da-fe/icon.png"),
  splash: require("@/assets/images/hospedagens-caminhos-da-fe/splash.png"),
  hero: require("@/assets/images/hospedagens-caminhos-da-fe/hero.png"),
  pousadaExterior: require("@/assets/images/hospedagens-caminhos-da-fe/pousada-exterior.png"),
  quartoCompartilhado: require("@/assets/images/hospedagens-caminhos-da-fe/quarto-compartilhado.png"),
  quartoPrivativo: require("@/assets/images/hospedagens-caminhos-da-fe/quarto-privativo.png"),
  featureGraphic: require("@/assets/images/hospedagens-caminhos-da-fe/feature-graphic.png"),
};

function statusReservaPainel(status: string, checkin: string): PainelPousadaReserva["status"] {
  if (status === "cancelada_cliente" || status === "cancelada_pousada") return "cancelada";
  if (status === "concluida" || status === "no_show") return "concluida";
  if (status === "confirmada" && checkin === new Date().toISOString().slice(0, 10)) return "checkin_hoje";
  if (status === "confirmada") return "confirmada";
  return "aguardando_pagamento";
}

export function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getQuartoById(hospedagem: CaminhoHospedagem, quartoId: string) {
  return hospedagem.quartos.find((item) => item.id === quartoId) || hospedagem.quartos[0] || null;
}

function mapCategoriaServicoIcon(categoria: string): CaminhoServicoAdicional["icon"] {
  if (categoria === "alimentacao") return "restaurant-outline";
  if (categoria === "lavanderia") return "shirt-outline";
  if (categoria === "transporte") return "car-outline";
  return "bag-handle-outline";
}

function mapPousadaFoto(row: any): ImageSourcePropType {
  const fotos = Array.isArray(row?.fotos) ? row.fotos.map(String).filter(Boolean) : [];
  return fotos[0] ? { uri: fotos[0] } : CAMINHOS_ASSETS.pousadaExterior;
}

function mapQuartoRow(row: any): CaminhoQuarto {
  return {
    id: String(row.slug || row.id),
    dbId: row.id ? String(row.id) : undefined,
    nome: String(row.nome || "Quarto"),
    tipo: String(row.tipo || "privativo") as CaminhoQuarto["tipo"],
    capacidade: Number(row.capacidade || 1),
    diaria: Number(row.diaria || 0),
    disponivel: Boolean(row.disponivel),
    descricao: row.descricao ? String(row.descricao) : "",
    fotos: Array.isArray(row.fotos) ? row.fotos.map(String).filter(Boolean) : [],
  };
}

function mapServicoRow(row: any): CaminhoServicoAdicional {
  const categoria = String(row.categoria || "apoio") as CaminhoServicoAdicional["categoria"];
  return {
    id: String(row.slug || row.id),
    nome: String(row.nome || "Serviço"),
    descricao: String(row.descricao || ""),
    preco: Number(row.preco || 0),
    unidade: String(row.unidade || "por unidade"),
    categoria,
    icon: mapCategoriaServicoIcon(categoria),
    confirmacao: String(row.confirmacao || "Sob confirmação"),
  };
}

async function carregarCatalogoRows() {
  const { data: pousadas, error: pousadasError } = await supabase
    .from("caminho_hospedagem_pousadas")
    .select("id,slug,nome,cidade,uf,ramal,endereco,whatsapp,descricao,status,visivel,fotos")
    .eq("status", "aprovada")
    .eq("visivel", true)
    .order("cidade", { ascending: true })
    .order("nome", { ascending: true });

  if (pousadasError) {
    throw new Error(pousadasError.message);
  }

  const pousadaRows = (pousadas || []) as any[];
  if (!pousadaRows.length) return [];

  const pousadaIds = pousadaRows.map((row) => String(row.id));

  const [quartosRes, servicosRes, avaliacoesRes] = await Promise.all([
    supabase
      .from("caminho_hospedagem_quartos")
      .select("id,pousada_id,slug,nome,tipo,capacidade,diaria,disponivel,ativo,descricao,fotos")
      .in("pousada_id", pousadaIds)
      .eq("ativo", true)
      .eq("disponivel", true)
      .order("diaria", { ascending: true }),
    supabase
      .from("caminho_hospedagem_servicos")
      .select("id,pousada_id,slug,nome,descricao,preco,unidade,categoria,confirmacao,ativo")
      .in("pousada_id", pousadaIds)
      .eq("ativo", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("caminho_hospedagem_avaliacoes")
      .select("hospedagem_slug,nota_geral")
      .eq("publicada", true)
      .limit(1000),
  ]);

  if (quartosRes.error) throw new Error(quartosRes.error.message);
  if (servicosRes.error) throw new Error(servicosRes.error.message);
  if (avaliacoesRes.error) throw new Error(avaliacoesRes.error.message);

  const quartosPorPousada = new Map<string, CaminhoQuarto[]>();
  for (const row of ((quartosRes.data || []) as any[])) {
    const pousadaId = String(row.pousada_id || "");
    if (!pousadaId) continue;
    quartosPorPousada.set(pousadaId, [...(quartosPorPousada.get(pousadaId) || []), mapQuartoRow(row)]);
  }

  const servicosPorPousada = new Map<string, CaminhoServicoAdicional[]>();
  for (const row of ((servicosRes.data || []) as any[])) {
    const pousadaId = String(row.pousada_id || "");
    if (!pousadaId) continue;
    servicosPorPousada.set(pousadaId, [...(servicosPorPousada.get(pousadaId) || []), mapServicoRow(row)]);
  }

  const avaliacoesPorSlug = new Map<string, number[]>();
  for (const row of ((avaliacoesRes.data || []) as any[])) {
    const slug = String(row.hospedagem_slug || "");
    if (!slug) continue;
    avaliacoesPorSlug.set(slug, [...(avaliacoesPorSlug.get(slug) || []), Number(row.nota_geral || 0)]);
  }

  return pousadaRows.map((row) => {
    const id = String(row.slug || row.id);
    const quartos = quartosPorPousada.get(String(row.id)) || [];
    const notas = avaliacoesPorSlug.get(id) || [];
    const diariaBase = quartos.reduce((min, quarto) => Math.min(min, quarto.diaria), Number.POSITIVE_INFINITY);
    const avaliacao = notas.length
      ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length
      : 0;

    return {
      id,
      nome: String(row.nome || "Pousada"),
      cidade: String(row.cidade || ""),
      uf: String(row.uf || "MG") as "MG" | "SP",
      ramal: String(row.ramal || "Caminho da Fé"),
      etapaKm: 0,
      distanciaTrilhaKm: 0,
      diariaBase: Number.isFinite(diariaBase) ? diariaBase : 0,
      avaliacao,
      fotos: [mapPousadaFoto(row)],
      whatsapp: String(row.whatsapp || ""),
      endereco: String(row.endereco || ""),
      descricao: String(row.descricao || ""),
      amenidades: [] as HospedagemAmenidade[],
      servicosAdicionais: servicosPorPousada.get(String(row.id)) || [],
      quartos,
    } satisfies CaminhoHospedagem;
  });
}

export async function listarCatalogoHospedagens() {
  return carregarCatalogoRows();
}

export async function obterHospedagemPublicaPorId(id: string) {
  const catalogo = await carregarCatalogoRows();
  return catalogo.find((item) => item.id === id) || null;
}

export function calcularResumoJornada(reservas: CaminhoHospedagemReservaCliente[]) {
  const reservasValidas = reservas.filter((item) => item.status !== "cancelada_cliente" && item.status !== "cancelada_pousada");
  const totalReservado = reservasValidas.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalSinais = reservasValidas.reduce((sum, item) => sum + Number(item.sinal || 0), 0);
  const restantePousadas = reservasValidas.reduce((sum, item) => sum + Number(item.restanteNaPousada || 0), 0);
  const kmPercorridos = 0;

  return {
    reservas: reservasValidas.length,
    totalReservado,
    totalSinais,
    restantePousadas,
    kmPercorridos,
  };
}

function mapReservaRow(row: any): CaminhoHospedagemReservaCliente {
  return {
    id: String(row.id),
    hospedagemSlug: String(row.hospedagem_slug || ""),
    hospedagemNome: String(row.hospedagem_nome || "Hospedagem"),
    cidade: String(row.cidade || ""),
    quartoNome: String(row.quarto_nome || "Quarto"),
    checkin: String(row.checkin || ""),
    checkout: String(row.checkout || ""),
    hospedes: Number(row.hospedes || 1),
    total: Number(row.total || 0),
    sinal: Number(row.sinal || 0),
    restanteNaPousada: Number(row.restante_na_pousada || 0),
    status: String(row.status || "aguardando_pagamento"),
    statusPagamento: String(row.status_pagamento || "pendente"),
    createdAt: String(row.created_at || ""),
  };
}

export async function listarMinhasReservasHospedagem() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("caminho_hospedagem_reservas")
    .select(
      "id,hospedagem_slug,hospedagem_nome,cidade,quarto_nome,checkin,checkout,hospedes,total,sinal,restante_na_pousada,status,status_pagamento,created_at",
    )
    .eq("cliente_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.log("HOSPEDAGENS RESERVAS LOAD ERROR:", error.message);
    return [];
  }

  return data?.length ? data.map(mapReservaRow) : [];
}

export function calcularNoites(checkin: string, checkout: string) {
  const start = new Date(`${checkin}T12:00:00`);
  const end = new Date(`${checkout}T12:00:00`);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 1;
  return Math.max(1, Math.round(diff / 86400000));
}

export function calcularReserva(params: {
  hospedagem: CaminhoHospedagem;
  quarto: CaminhoQuarto;
  checkin: string;
  checkout: string;
  hospedes: number;
  comissaoPercentual?: number;
}): ReservaResumo {
  const noites = calcularNoites(params.checkin, params.checkout);
  const total = Number((params.quarto.diaria * noites).toFixed(2));
  const sinal = Number((total * CAMINHOS_REGRAS_NEGOCIO.sinalPercentual).toFixed(2));
  const comissao = Number((total * (params.comissaoPercentual || CAMINHOS_REGRAS_NEGOCIO.comissaoLancamentoPercentual)).toFixed(2));
  const repasseInicial = Number(Math.max(0, sinal - comissao).toFixed(2));
  const restanteNaPousada = Number((total - sinal).toFixed(2));

  return {
    hospedagem: params.hospedagem,
    quarto: params.quarto,
    checkin: params.checkin,
    checkout: params.checkout,
    hospedes: params.hospedes,
    noites,
    total,
    sinal,
    comissao,
    repasseInicial,
    restanteNaPousada,
  };
}

export async function criarReservaHospedagem(payload: {
  hospedagemId: string;
  quartoId: string;
  checkin: string;
  checkout: string;
  hospedes: number;
  nome: string;
  telefone: string;
  observacoes?: string;
  servicosAdicionaisTotal?: number;
  servicosAdicionaisDescricao?: string;
}) {
  const hospedagem = await obterHospedagemPublicaPorId(payload.hospedagemId);
  if (!hospedagem) throw new Error("Hospedagem indisponível.");
  const quarto = getQuartoById(hospedagem, payload.quartoId);
  if (!quarto) throw new Error("Quarto indisponível.");
  if (!quarto.disponivel) throw new Error("Quarto indisponível para reserva.");
  if (!quarto.dbId) throw new Error("Quarto sem vínculo real no banco.");

  const resumo = calcularReserva({
    hospedagem,
    quarto,
    checkin: payload.checkin,
    checkout: payload.checkout,
    hospedes: payload.hospedes,
  });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Faça login para confirmar sua reserva.");
  }

  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) {
    throw new Error("Tenant do app não encontrado.");
  }

  const noites = calcularNoites(payload.checkin, payload.checkout);
  const diasReserva = Array.from({ length: noites }, (_, index) => {
    const date = new Date(`${payload.checkin}T12:00:00`);
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });

  const { data: pousadaRow, error: pousadaError } = await supabase
    .from("caminho_hospedagem_pousadas")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("slug", hospedagem.id)
    .eq("status", "aprovada")
    .eq("visivel", true)
    .maybeSingle();

  if (pousadaError || !pousadaRow?.id) {
    throw new Error(pousadaError?.message || "Pousada indisponível para reserva.");
  }

  const { data: quartoRow, error: quartoError } = await supabase
    .from("caminho_hospedagem_quartos")
    .select("id,ativo,disponivel")
    .eq("id", quarto.dbId)
    .eq("pousada_id", String(pousadaRow.id))
    .eq("ativo", true)
    .eq("disponivel", true)
    .maybeSingle();

  if (quartoError || !quartoRow?.id) {
    throw new Error(quartoError?.message || "Quarto indisponível para reserva.");
  }

  const { data: disponibilidade, error: disponibilidadeError } = await supabase
    .from("caminho_hospedagem_disponibilidade")
    .select("dia,status")
    .eq("pousada_id", String(pousadaRow.id))
    .eq("quarto_id", quarto.dbId)
    .in("dia", diasReserva)
    .eq("status", "livre");

  if (disponibilidadeError) {
    throw new Error(disponibilidadeError.message);
  }

  const diasLivres = new Set(((disponibilidade || []) as any[]).map((row) => String(row.dia)));
  const todosDiasLivres = diasReserva.every((dia) => diasLivres.has(dia));
  if (!todosDiasLivres) {
    throw new Error("Disponibilidade não confirmada para as datas selecionadas.");
  }

  const { data: conflito, error: conflitoError } = await supabase
    .from("caminho_hospedagem_reservas")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("quarto_id", quarto.dbId)
    .in("status", ["aguardando_pagamento", "confirmada"])
    .lt("checkin", payload.checkout)
    .gt("checkout", payload.checkin)
    .limit(1);

  if (conflitoError) {
    throw new Error(conflitoError.message);
  }

  if ((conflito || []).length > 0) {
    throw new Error("Este quarto já possui reserva pendente ou confirmada nesse período.");
  }

  const insertPayload = {
    tenant_id: tenantId,
    cliente_id: session.user.id,
    hospedagem_slug: hospedagem.id,
    hospedagem_nome: hospedagem.nome,
    cidade: hospedagem.cidade,
    quarto_id: quarto.dbId,
    quarto_slug: quarto.id,
    quarto_nome: quarto.nome,
    checkin: payload.checkin,
    checkout: payload.checkout,
    hospedes: payload.hospedes,
    nome_cliente: payload.nome.trim(),
    telefone_cliente: payload.telefone.trim(),
    observacoes: payload.observacoes?.trim() || null,
    total: resumo.total,
    sinal: resumo.sinal,
    comissao: resumo.comissao,
    repasse_inicial: resumo.repasseInicial,
    restante_na_pousada: resumo.restanteNaPousada,
    status: "aguardando_pagamento",
    status_pagamento: "pendente",
  };

  const { data, error } = await supabase
    .from("caminho_hospedagem_reservas")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23P01") {
      throw new Error("Este quarto já possui reserva pendente ou confirmada nesse período.");
    }
    throw new Error(error?.message || "Não foi possível criar a reserva no Supabase.");
  }

  return { reservaId: String(data.id), resumo };
}

export async function obterReservaHospedagemPorId(reservaId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("Faça login para acessar sua reserva.");
  }

  const tenantId = await resolveCurrentTenantId();
  let query = supabase
    .from("caminho_hospedagem_reservas")
    .select("*")
    .eq("id", reservaId)
    .eq("cliente_id", session.user.id)
    .limit(1);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: String(data.id),
    hospedagemNome: String(data.hospedagem_nome || "Hospedagem"),
    cidade: String(data.cidade || ""),
    quartoNome: String(data.quarto_nome || "Quarto"),
    checkin: String(data.checkin || ""),
    checkout: String(data.checkout || ""),
    hospedes: Number(data.hospedes || 1),
    total: Number(data.total || 0),
    sinal: Number(data.sinal || 0),
    restanteNaPousada: Number(data.restante_na_pousada || 0),
    servicosAdicionaisTotal: 0,
    servicosAdicionaisDescricao: "",
    status: String(data.status || "aguardando_pagamento"),
    statusPagamento: String(data.status_pagamento || "pendente") as HospedagemPagamentoStatus,
    provider: data.provider ? String(data.provider) : null,
    providerPaymentId: data.provider_payment_id ? String(data.provider_payment_id) : null,
  };
}

async function invokeHospedagemPaymentFunction(body: Record<string, unknown>) {
  const reservaId = String(body.reservaId || "");
  if (reservaId.startsWith("local-")) {
    throw new Error("Reserva local não é aceita no GO LIVE. Crie a reserva no Supabase antes do pagamento.");
  }

  const { data, error } = await supabase.functions.invoke("create-caminho-hospedagem-pix-payment", {
    body,
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
    throw new Error(detalhe || error.message || "Não foi possível preparar o pagamento do sinal.");
  }

  return data;
}

export async function gerarPixSinalHospedagem(reservaId: string) {
  return invokeHospedagemPaymentFunction({ reservaId, metodo: "pix" }) as Promise<HospedagemPixPagamento>;
}

export async function pagarSinalHospedagemComCartao(
  reservaId: string,
  payload: HospedagemCartaoPagamentoPayload,
) {
  return invokeHospedagemPaymentFunction({ reservaId, metodo: "cartao", ...payload }) as Promise<HospedagemCartaoPagamentoResult>;
}

export async function carregarPainelPousadaHospedagens(): Promise<PainelPousadaData> {
  const emptyPousada = buildEmptyHospedagem();
  const emptyData: PainelPousadaData = {
    source: "supabase",
    pousadaDbId: null,
    pousada: emptyPousada,
    reservas: [],
    quartos: [],
    servicos: [],
    disponibilidade: [],
    visivel: false,
    autoConfirmar: false,
    respostaRapida: "Olá! Sua reserva foi recebida. Vamos confirmar os detalhes da chegada e serviços adicionais.",
    gatewayStatus: "pendente",
  };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return emptyData;

    const tenantId = await resolveCurrentTenantId().catch(() => null);
    if (!tenantId) return emptyData;

    let { data: pousada, error: pousadaError } = await supabase
      .from("caminho_hospedagem_pousadas")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (pousadaError) {
      console.log("HOSPEDAGENS PAINEL LOAD ERROR:", pousadaError.message);
      return emptyData;
    }

    if (!pousada) {
      const { data: inserted, error: insertError } = await supabase
        .from("caminho_hospedagem_pousadas")
        .insert({
          tenant_id: tenantId,
          owner_user_id: session.user.id,
          slug: `pousada-${session.user.id.slice(0, 8)}`,
          nome: "Minha pousada",
          cidade: "",
          uf: "MG",
          ramal: "",
          endereco: "",
          whatsapp: "",
          descricao: "",
          status: "pendente",
          visivel: false,
          auto_confirmar: false,
          resposta_rapida: emptyData.respostaRapida,
          gateway_provider: "mercadopago",
          gateway_status: "pendente",
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        console.log("HOSPEDAGENS PAINEL CREATE ERROR:", insertError?.message);
        return emptyData;
      }
      pousada = inserted;
    }

    const pousadaDbId = String(pousada.id);

    const [quartosRes, servicosRes, disponibilidadeRes, reservasRes] = await Promise.all([
      supabase.from("caminho_hospedagem_quartos").select("*").eq("pousada_id", pousadaDbId).order("created_at"),
      supabase.from("caminho_hospedagem_servicos").select("*").eq("pousada_id", pousadaDbId).order("created_at"),
      supabase.from("caminho_hospedagem_disponibilidade").select("*").eq("pousada_id", pousadaDbId).order("dia"),
      supabase
        .from("caminho_hospedagem_reservas")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("hospedagem_slug", String(pousada.slug || ""))
        .order("checkin", { ascending: true })
        .limit(80),
    ]);

    const quartos: CaminhoQuarto[] = (quartosRes.data || []).map(mapQuartoRow);

    const servicos = (servicosRes.data || []).map(mapServicoRow);

    const disponibilidade = (disponibilidadeRes.data || []).map((row: any) => ({
      dia: String(row.dia),
      status: String(row.status || "livre") as PainelPousadaDisponibilidade["status"],
      detalhe: String(row.detalhe || ""),
    }));

    const reservas = (reservasRes.data || []).map((row: any) => {
      const total = Number(row.total || 0);
      const sinal = Number(row.sinal || 0);
      const comissao = Number(row.comissao || 0);
      return {
        id: String(row.id),
        cliente: String(row.nome_cliente || "Cliente"),
        telefone: String(row.telefone_cliente || ""),
        quarto: String(row.quarto_nome || "Quarto"),
        checkin: String(row.checkin || ""),
        checkout: String(row.checkout || ""),
        hospedes: Number(row.hospedes || 1),
        total,
        sinal,
        comissao,
        repasseInicial: Number(row.repasse_inicial || Math.max(0, sinal - comissao)),
        restanteNaChegada: Number(row.restante_na_pousada || Math.max(0, total - sinal)),
        extras: 0,
        status: statusReservaPainel(String(row.status || ""), String(row.checkin || "")),
        observacao: String(row.observacoes || "Sem observações."),
      };
    });

    return {
      source: "supabase",
      pousadaDbId,
      pousada: {
        ...emptyPousada,
        id: String(pousada.slug || ""),
        nome: String(pousada.nome || ""),
        cidade: String(pousada.cidade || ""),
        uf: String(pousada.uf || "MG") as "MG" | "SP",
        ramal: String(pousada.ramal || ""),
        endereco: String(pousada.endereco || ""),
        whatsapp: String(pousada.whatsapp || ""),
        descricao: String(pousada.descricao || ""),
        fotos: [mapPousadaFoto(pousada)],
        diariaBase: quartos.length ? quartos.reduce((min, quarto) => Math.min(min, quarto.diaria), Number.POSITIVE_INFINITY) : 0,
        quartos,
        servicosAdicionais: servicos,
      },
      reservas,
      quartos,
      servicos,
      disponibilidade,
      visivel: Boolean(pousada.visivel),
      autoConfirmar: Boolean(pousada.auto_confirmar),
      respostaRapida: String(pousada.resposta_rapida || emptyData.respostaRapida),
      gatewayStatus: String(pousada.gateway_status || "pendente"),
    };
  } catch (error: any) {
    console.log("HOSPEDAGENS PAINEL UNEXPECTED ERROR:", error?.message || error);
    return emptyData;
  }
}

export async function atualizarPainelPousadaVisibilidade(pousadaDbId: string | null, visivel: boolean) {
  if (!pousadaDbId) return;
  await supabase.from("caminho_hospedagem_pousadas").update({ visivel }).eq("id", pousadaDbId);
}

export async function atualizarPainelPousadaCadastro(
  pousadaDbId: string | null,
  payload: Partial<Pick<CaminhoHospedagem, "nome" | "cidade" | "uf" | "ramal" | "endereco" | "whatsapp" | "descricao">>,
) {
  if (!pousadaDbId) return;
  await supabase
    .from("caminho_hospedagem_pousadas")
    .update({
      ...(typeof payload.nome === "string" ? { nome: payload.nome.trim() } : {}),
      ...(typeof payload.cidade === "string" ? { cidade: payload.cidade.trim() } : {}),
      ...(typeof payload.uf === "string" ? { uf: payload.uf.trim().toUpperCase().slice(0, 2) } : {}),
      ...(typeof payload.ramal === "string" ? { ramal: payload.ramal.trim() } : {}),
      ...(typeof payload.endereco === "string" ? { endereco: payload.endereco.trim() } : {}),
      ...(typeof payload.whatsapp === "string" ? { whatsapp: payload.whatsapp.trim() } : {}),
      ...(typeof payload.descricao === "string" ? { descricao: payload.descricao.trim() } : {}),
    })
    .eq("id", pousadaDbId);
}

export async function atualizarPainelPousadaOperacao(
  pousadaDbId: string | null,
  payload: { autoConfirmar?: boolean; respostaRapida?: string },
) {
  if (!pousadaDbId) return;
  await supabase
    .from("caminho_hospedagem_pousadas")
    .update({
      ...(typeof payload.autoConfirmar === "boolean" ? { auto_confirmar: payload.autoConfirmar } : {}),
      ...(typeof payload.respostaRapida === "string" ? { resposta_rapida: payload.respostaRapida } : {}),
    })
    .eq("id", pousadaDbId);
}

export async function atualizarPainelPousadaQuarto(pousadaDbId: string | null, slug: string, payload: Partial<CaminhoQuarto>) {
  if (!pousadaDbId) return;
  await supabase
    .from("caminho_hospedagem_quartos")
    .update({
      ...(typeof payload.nome === "string" ? { nome: payload.nome.trim() } : {}),
      ...(typeof payload.tipo === "string" ? { tipo: payload.tipo } : {}),
      ...(typeof payload.capacidade === "number" ? { capacidade: payload.capacidade } : {}),
      ...(typeof payload.diaria === "number" ? { diaria: payload.diaria } : {}),
      ...(typeof payload.disponivel === "boolean" ? { disponivel: payload.disponivel } : {}),
      ...(typeof payload.descricao === "string" ? { descricao: payload.descricao.trim() } : {}),
      ...(Array.isArray(payload.fotos) ? { fotos: payload.fotos } : {}),
    })
    .eq("pousada_id", pousadaDbId)
    .eq("slug", slug);
}

export async function adicionarPainelPousadaQuarto(
  pousadaDbId: string | null,
  payload: Omit<CaminhoQuarto, "id" | "disponivel"> & { id?: string; disponivel?: boolean },
) {
  if (!pousadaDbId) return null;
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) return null;
  const slug = payload.id || `quarto-${Date.now()}`;
  const { data, error } = await supabase
    .from("caminho_hospedagem_quartos")
    .insert({
      tenant_id: tenantId,
      pousada_id: pousadaDbId,
      slug,
      nome: payload.nome.trim(),
      tipo: payload.tipo,
      capacidade: payload.capacidade,
      diaria: payload.diaria,
      disponivel: payload.disponivel ?? true,
      descricao: payload.descricao?.trim() || null,
      fotos: payload.fotos || [],
    })
    .select("slug,nome,tipo,capacidade,diaria,disponivel,descricao,fotos")
    .single();

  if (error || !data) {
    console.log("HOSPEDAGENS QUARTO CREATE ERROR:", error?.message);
    return null;
  }

  return {
    dbId: data.id ? String(data.id) : undefined,
    id: String(data.slug),
    nome: String(data.nome),
    tipo: String(data.tipo || "privativo") as CaminhoQuarto["tipo"],
    capacidade: Number(data.capacidade || 1),
    diaria: Number(data.diaria || 0),
    disponivel: Boolean(data.disponivel),
    descricao: data.descricao ? String(data.descricao) : "",
    fotos: Array.isArray(data.fotos) ? data.fotos.map(String) : [],
  };
}

export async function atualizarPainelPousadaServico(pousadaDbId: string | null, slug: string, payload: Partial<CaminhoServicoAdicional>) {
  if (!pousadaDbId) return;
  await supabase
    .from("caminho_hospedagem_servicos")
    .update({
      ...(typeof payload.preco === "number" ? { preco: payload.preco } : {}),
    })
    .eq("pousada_id", pousadaDbId)
    .eq("slug", slug);
}

export async function salvarPainelPousadaDisponibilidade(
  pousadaDbId: string | null,
  dia: string,
  status: PainelPousadaDisponibilidade["status"],
  detalhe: string,
  quartoDbIds?: string[],
) {
  if (!pousadaDbId) return;
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) return;

  const quartos =
    quartoDbIds && quartoDbIds.length
      ? quartoDbIds
      : (
          await supabase
            .from("caminho_hospedagem_quartos")
            .select("id")
            .eq("pousada_id", pousadaDbId)
            .eq("ativo", true)
        ).data?.map((row: any) => String(row.id)) || [];

  if (!quartos.length) return;

  await supabase.from("caminho_hospedagem_disponibilidade").upsert(
    quartos.map((quartoId) => ({
      tenant_id: tenantId,
      pousada_id: pousadaDbId,
      quarto_id: quartoId,
      dia,
      status,
      detalhe,
    })),
    { onConflict: "pousada_id,quarto_id,dia" },
  );
}

export async function atualizarStatusReservaPainelPousada(
  reservaId: string,
  status: "confirmada" | "concluida" | "cancelada_pousada",
  motivo?: string,
) {
  if (!reservaId || reservaId.startsWith("res-")) return { ok: true, demo: true };

  if (status === "cancelada_pousada") {
    const { error } = await supabase.rpc("caminho_hospedagem_cancelar_por_pousada", {
      p_reserva_id: reservaId,
      p_motivo: motivo || "Cancelamento solicitado pela pousada",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  }

  const { error } = await supabase.rpc("caminho_hospedagem_atualizar_status_por_pousada", {
    p_reserva_id: reservaId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function carregarAdminHospedagens(): Promise<HospedagensAdminData> {
  const emptyData: HospedagensAdminData = {
    source: "supabase",
    metrics: {
      pousadas: 0,
      pousadasPendentes: 0,
      reservas: 0,
      gmv: 0,
      sinais: 0,
      comissao: 0,
      repasse: 0,
      canceladas: 0,
    },
    pousadas: [],
    reservas: [],
    chamados: [],
  };
  try {
    const tenantId = await resolveCurrentTenantId().catch(() => null);
    if (!tenantId) return emptyData;

    const [pousadasRes, quartosRes, reservasRes, chamadosRes] = await Promise.all([
      supabase
        .from("caminho_hospedagem_pousadas")
        .select("id,slug,nome,cidade,uf,status,visivel,gateway_status,created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("caminho_hospedagem_quartos")
        .select("pousada_id")
        .eq("tenant_id", tenantId)
        .limit(1000),
      supabase
        .from("caminho_hospedagem_reservas")
        .select("id,hospedagem_nome,cidade,nome_cliente,quarto_nome,checkin,checkout,total,sinal,comissao,repasse_inicial,restante_na_pousada,status,status_pagamento,created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(120),
      supabase
        .from("caminho_hospedagem_chamados")
        .select("id,reserva_id,cliente_id,pousada_id,papel_abertura,tipo,prioridade,status,titulo,descricao,resposta_admin,decisao,created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    if (pousadasRes.error || reservasRes.error) {
      console.log("HOSPEDAGENS ADMIN LOAD ERROR:", pousadasRes.error?.message || reservasRes.error?.message);
      return emptyData;
    }

    const quartosPorPousada = new Map<string, number>();
    for (const row of (quartosRes.data as any[]) || []) {
      const id = String(row.pousada_id || "");
      if (id) quartosPorPousada.set(id, (quartosPorPousada.get(id) || 0) + 1);
    }

    const pousadas: HospedagensAdminPousada[] = ((pousadasRes.data as any[]) || []).map((row) => ({
      id: String(row.id),
      slug: String(row.slug || row.id),
      nome: String(row.nome || "Pousada"),
      cidade: String(row.cidade || ""),
      uf: String(row.uf || "MG"),
      status: String(row.status || "pendente") as HospedagensAdminPousada["status"],
      visivel: Boolean(row.visivel),
      gatewayStatus: String(row.gateway_status || "pendente"),
      quartos: quartosPorPousada.get(String(row.id)) || 0,
      createdAt: String(row.created_at || ""),
    }));

    const reservas: HospedagensAdminReserva[] = ((reservasRes.data as any[]) || []).map((row) => ({
      id: String(row.id),
      hospedagemNome: String(row.hospedagem_nome || "Hospedagem"),
      cidade: String(row.cidade || ""),
      cliente: String(row.nome_cliente || "Cliente"),
      quarto: String(row.quarto_nome || "Quarto"),
      checkin: String(row.checkin || ""),
      checkout: String(row.checkout || ""),
      total: Number(row.total || 0),
      sinal: Number(row.sinal || 0),
      comissao: Number(row.comissao || 0),
      repasseInicial: Number(row.repasse_inicial || 0),
      restanteNaPousada: Number(row.restante_na_pousada || 0),
      status: String(row.status || "aguardando_pagamento"),
      statusPagamento: String(row.status_pagamento || "pendente"),
      createdAt: String(row.created_at || ""),
    }));

    const chamados = ((chamadosRes.data as any[]) || []).map(mapChamadoRow);

    const reservasAtivas = reservas.filter((item) => !["cancelada_cliente", "cancelada_pousada"].includes(item.status));
    return {
      source: "supabase",
      metrics: {
        pousadas: pousadas.length,
        pousadasPendentes: pousadas.filter((item) => item.status === "pendente").length,
        reservas: reservas.length,
        gmv: reservasAtivas.reduce((sum, item) => sum + item.total, 0),
        sinais: reservasAtivas.reduce((sum, item) => sum + item.sinal, 0),
        comissao: reservasAtivas.reduce((sum, item) => sum + item.comissao, 0),
        repasse: reservasAtivas.reduce((sum, item) => sum + item.repasseInicial, 0),
        canceladas: reservas.filter((item) => ["cancelada_cliente", "cancelada_pousada"].includes(item.status)).length,
      },
      pousadas,
      reservas,
      chamados,
    };
  } catch (error: any) {
    console.log("HOSPEDAGENS ADMIN UNEXPECTED ERROR:", error?.message || error);
    return emptyData;
  }
}

function mapChamadoRow(row: any): CaminhoHospedagemChamado {
  return {
    id: String(row.id),
    reservaId: row.reserva_id ? String(row.reserva_id) : null,
    clienteId: row.cliente_id ? String(row.cliente_id) : null,
    pousadaId: row.pousada_id ? String(row.pousada_id) : null,
    papelAbertura: String(row.papel_abertura || "cliente") as CaminhoHospedagemChamado["papelAbertura"],
    tipo: String(row.tipo || "duvida") as CaminhoHospedagemChamado["tipo"],
    prioridade: String(row.prioridade || "normal") as CaminhoHospedagemChamado["prioridade"],
    status: String(row.status || "aberto") as CaminhoHospedagemChamado["status"],
    titulo: String(row.titulo || "Chamado"),
    descricao: String(row.descricao || ""),
    respostaAdmin: String(row.resposta_admin || ""),
    decisao: String(row.decisao || ""),
    createdAt: String(row.created_at || ""),
  };
}

export async function listarChamadosHospedagens(escopo: "cliente" | "pousada" | "admin" = "cliente") {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const tenantId = await resolveCurrentTenantId().catch(() => null);
    let query = supabase
      .from("caminho_hospedagem_chamados")
      .select("id,reserva_id,cliente_id,pousada_id,papel_abertura,tipo,prioridade,status,titulo,descricao,resposta_admin,decisao,created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    if (tenantId) query = query.eq("tenant_id", tenantId);
    if (escopo === "cliente") query = query.eq("cliente_id", session.user.id);

    const { data, error } = await query;
    if (error) {
      console.log("HOSPEDAGENS CHAMADOS LOAD ERROR:", error.message);
      return [];
    }
    return data?.length ? data.map(mapChamadoRow) : [];
  } catch (error: any) {
    console.log("HOSPEDAGENS CHAMADOS UNEXPECTED ERROR:", error?.message || error);
    return [];
  }
}

export async function abrirChamadoHospedagens(payload: {
  papel: "cliente" | "pousada";
  titulo: string;
  descricao: string;
  tipo: CaminhoHospedagemChamado["tipo"];
  prioridade?: CaminhoHospedagemChamado["prioridade"];
  reservaId?: string | null;
  pousadaId?: string | null;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Faça login para abrir um chamado.");
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) throw new Error("Tenant do app não encontrado.");

  const { error } = await supabase.from("caminho_hospedagem_chamados").insert({
    tenant_id: tenantId,
    reserva_id: payload.reservaId || null,
    cliente_id: payload.papel === "cliente" ? session.user.id : null,
    pousada_id: payload.pousadaId || null,
    aberto_por: session.user.id,
    papel_abertura: payload.papel,
    tipo: payload.tipo,
    prioridade: payload.prioridade || "normal",
    titulo: payload.titulo.trim(),
    descricao: payload.descricao.trim(),
  });
  if (error) throw new Error(error.message);
}

export async function atualizarChamadoAdmin(
  chamadoId: string,
  payload: Partial<Pick<CaminhoHospedagemChamado, "status" | "prioridade" | "respostaAdmin" | "decisao">>,
) {
  if (!chamadoId || chamadoId.includes("demo")) return;
  const { error } = await supabase
    .from("caminho_hospedagem_chamados")
    .update({
      ...(payload.status ? { status: payload.status, closed_at: ["resolvido", "fechado"].includes(payload.status) ? new Date().toISOString() : null } : {}),
      ...(payload.prioridade ? { prioridade: payload.prioridade } : {}),
      ...(typeof payload.respostaAdmin === "string" ? { resposta_admin: payload.respostaAdmin.trim() } : {}),
      ...(typeof payload.decisao === "string" ? { decisao: payload.decisao.trim() } : {}),
    })
    .eq("id", chamadoId);
  if (error) throw new Error(error.message);
}

export async function registrarAceiteHospedagens(payload: {
  papel: "cliente" | "pousada" | "admin";
  documentos: Array<"termos_cliente" | "politica_privacidade" | "contrato_pousada" | "politicas_pousada">;
  versao?: string;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return;
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) return;
  const versao = payload.versao || "2026-06-23";
  await supabase.from("caminho_hospedagem_aceites").upsert(
    payload.documentos.map((documento) => ({
      tenant_id: tenantId,
      user_id: session.user.id,
      papel: payload.papel,
      documento,
      versao,
      metadata: { app: "hospedagens-caminhos-da-fe" },
    })),
    { onConflict: "tenant_id,user_id,documento,versao" },
  );
}

function mapAvaliacaoRow(row: any): CaminhoHospedagemAvaliacao {
  return {
    id: String(row.id),
    reservaId: row.reserva_id ? String(row.reserva_id) : null,
    hospedagemSlug: String(row.hospedagem_slug || ""),
    hospedagemNome: String(row.hospedagem_nome || "Hospedagem"),
    notaGeral: Number(row.nota_geral || 5),
    limpeza: Number(row.limpeza || 5),
    atendimento: Number(row.atendimento || 5),
    localizacao: Number(row.localizacao || 5),
    custoBeneficio: Number(row.custo_beneficio || 5),
    comentario: String(row.comentario || ""),
    publicada: Boolean(row.publicada),
    createdAt: String(row.created_at || ""),
  };
}

export async function listarAvaliacoesHospedagem(hospedagemSlug?: string) {
  let query = supabase
    .from("caminho_hospedagem_avaliacoes")
    .select("id,reserva_id,hospedagem_slug,hospedagem_nome,nota_geral,limpeza,atendimento,localizacao,custo_beneficio,comentario,publicada,created_at")
    .eq("publicada", true)
    .order("created_at", { ascending: false })
    .limit(80);
  if (hospedagemSlug) query = query.eq("hospedagem_slug", hospedagemSlug);
  const { data, error } = await query;
  if (error) {
    console.log("HOSPEDAGENS AVALIACOES LOAD:", error.message);
    return [];
  }
  return (data || []).map(mapAvaliacaoRow);
}

export async function salvarAvaliacaoHospedagem(payload: {
  reservaId?: string | null;
  hospedagemSlug: string;
  hospedagemNome: string;
  notaGeral: number;
  limpeza: number;
  atendimento: number;
  localizacao: number;
  custoBeneficio: number;
  comentario: string;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Faça login para avaliar.");
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) throw new Error("Tenant do app não encontrado.");
  const { error } = await supabase.from("caminho_hospedagem_avaliacoes").insert({
    tenant_id: tenantId,
    cliente_id: session.user.id,
    reserva_id: payload.reservaId || null,
    hospedagem_slug: payload.hospedagemSlug,
    hospedagem_nome: payload.hospedagemNome,
    nota_geral: payload.notaGeral,
    limpeza: payload.limpeza,
    atendimento: payload.atendimento,
    localizacao: payload.localizacao,
    custo_beneficio: payload.custoBeneficio,
    comentario: payload.comentario.trim(),
  });
  if (error) throw new Error(error.message);
}

function mapFavoritoRow(row: any): CaminhoHospedagemFavorito {
  return {
    id: String(row.id),
    hospedagemSlug: String(row.hospedagem_slug || ""),
    hospedagemNome: String(row.hospedagem_nome || "Hospedagem"),
    cidade: String(row.cidade || ""),
    etapaOrdem: row.etapa_ordem === null || row.etapa_ordem === undefined ? null : Number(row.etapa_ordem),
    checkinPlanejado: row.checkin_planejado ? String(row.checkin_planejado) : null,
    observacao: String(row.observacao || ""),
    createdAt: String(row.created_at || ""),
  };
}

export async function listarFavoritosHospedagens() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return [] as CaminhoHospedagemFavorito[];
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  let query = supabase
    .from("caminho_hospedagem_favoritos")
    .select("id,hospedagem_slug,hospedagem_nome,cidade,etapa_ordem,checkin_planejado,observacao,created_at")
    .eq("user_id", session.user.id)
    .order("etapa_ordem", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data, error } = await query;
  if (error) {
    console.log("HOSPEDAGENS FAVORITOS LOAD:", error.message);
    return [];
  }
  return (data || []).map(mapFavoritoRow);
}

export async function alternarFavoritoHospedagem(hospedagem: CaminhoHospedagem) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Faça login para salvar favoritos.");
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) throw new Error("Tenant do app não encontrado.");
  const { data: existing } = await supabase
    .from("caminho_hospedagem_favoritos")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", session.user.id)
    .eq("hospedagem_slug", hospedagem.id)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await supabase.from("caminho_hospedagem_favoritos").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
    return false;
  }
  const { error } = await supabase.from("caminho_hospedagem_favoritos").insert({
    tenant_id: tenantId,
    user_id: session.user.id,
    hospedagem_slug: hospedagem.id,
    hospedagem_nome: hospedagem.nome,
    cidade: hospedagem.cidade,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function atualizarPlanejamentoFavorito(
  favoritoId: string,
  payload: { etapaOrdem?: number | null; checkinPlanejado?: string | null; observacao?: string },
) {
  const { error } = await supabase
    .from("caminho_hospedagem_favoritos")
    .update({
      ...(payload.etapaOrdem !== undefined ? { etapa_ordem: payload.etapaOrdem } : {}),
      ...(payload.checkinPlanejado !== undefined ? { checkin_planejado: payload.checkinPlanejado || null } : {}),
      ...(payload.observacao !== undefined ? { observacao: payload.observacao.trim() } : {}),
    })
    .eq("id", favoritoId);
  if (error) throw new Error(error.message);
}

function mapNotificacaoRow(row: any): CaminhoHospedagemNotificacao {
  return {
    id: String(row.id),
    papel: String(row.papel || "cliente") as CaminhoHospedagemNotificacao["papel"],
    titulo: String(row.titulo || "Notificação"),
    mensagem: String(row.mensagem || ""),
    tipo: String(row.tipo || "sistema") as CaminhoHospedagemNotificacao["tipo"],
    lida: Boolean(row.lida),
    createdAt: String(row.created_at || ""),
  };
}

export async function listarNotificacoesHospedagens() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return [] as CaminhoHospedagemNotificacao[];
  }
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  let query = supabase
    .from("caminho_hospedagem_notificacoes")
    .select("id,papel,titulo,mensagem,tipo,lida,created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data, error } = await query;
  if (error) {
    console.log("HOSPEDAGENS NOTIFICACOES LOAD:", error.message);
    return [];
  }
  return (data || []).map(mapNotificacaoRow);
}

export async function marcarNotificacaoLida(notificacaoId: string) {
  if (!notificacaoId || notificacaoId.includes("demo")) return;
  await supabase
    .from("caminho_hospedagem_notificacoes")
    .update({ lida: true, read_at: new Date().toISOString() })
    .eq("id", notificacaoId);
}

export async function atualizarStatusPousadaAdmin(
  pousadaId: string,
  payload: { status?: HospedagensAdminPousada["status"]; visivel?: boolean },
) {
  if (!pousadaId || pousadaId.includes("-")) return;
  const { error } = await supabase
    .from("caminho_hospedagem_pousadas")
    .update({
      ...(payload.status ? { status: payload.status } : {}),
      ...(typeof payload.visivel === "boolean" ? { visivel: payload.visivel } : {}),
    })
    .eq("id", pousadaId);
  if (error) throw new Error(error.message);
}
