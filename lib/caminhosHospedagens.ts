import AsyncStorage from "@react-native-async-storage/async-storage";
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

type HospedagemReservaLocal = {
  id: string;
  hospedagemNome: string;
  cidade: string;
  quartoNome: string;
  checkin: string;
  checkout: string;
  hospedes: number;
  total: number;
  sinal: number;
  restanteNaPousada: number;
  servicosAdicionaisTotal: number;
  servicosAdicionaisDescricao: string;
  status: string;
  statusPagamento: HospedagemPagamentoStatus;
  provider: string | null;
  providerPaymentId: string | null;
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
  source: "supabase" | "demo";
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
  source: "supabase" | "demo";
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

const HOSPEDAGENS_RESERVAS_LOCAIS_KEY = "@hospedagens_caminhos_reservas_locais_v1";

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

export const HOSPEDAGENS_DEMO: CaminhoHospedagem[] = [
  {
    id: "ouro-fino-refugio",
    nome: "Refúgio do Peregrino Ouro Fino",
    cidade: "Ouro Fino",
    uf: "MG",
    ramal: "Ramal Inconfidentes",
    etapaKm: 178,
    distanciaTrilhaKm: 0.6,
    diariaBase: 120,
    avaliacao: 4.8,
    fotos: [CAMINHOS_ASSETS.pousadaExterior],
    whatsapp: "+5535999990001",
    endereco: "Centro, Ouro Fino - MG",
    descricao: "Hospedagem modelo para peregrinos, com café cedo, espaço para bike e apoio para carimbo.",
    amenidades: ["cafe", "jantar", "bike", "wifi", "carimbo", "privativo"],
    servicosAdicionais: [
      { id: "jantar-caseiro", nome: "Jantar caseiro", descricao: "Prato simples e reforçado para recuperação após a etapa.", preco: 38, unidade: "por pessoa", categoria: "alimentacao", icon: "restaurant-outline", confirmacao: "Confirmar até 16h" },
      { id: "lanche-trilha", nome: "Lanche para trilha", descricao: "Kit com fruta, sanduíche simples e água para saída cedo.", preco: 24, unidade: "por kit", categoria: "alimentacao", icon: "bag-handle-outline", confirmacao: "Solicitar na véspera" },
      { id: "lavagem-rapida", nome: "Lavanderia rápida", descricao: "Lavagem básica de roupas leves do peregrino.", preco: 28, unidade: "por carga", categoria: "lavanderia", icon: "shirt-outline", confirmacao: "Entrega conforme horário local" },
    ],
    quartos: [
      { id: "privativo-1", nome: "Quarto privativo peregrino", tipo: "privativo", capacidade: 2, diaria: 140, disponivel: true },
      { id: "compartilhado-1", nome: "Beliche compartilhado", tipo: "compartilhado", capacidade: 1, diaria: 85, disponivel: true },
    ],
  },
  {
    id: "borda-mata-estacao",
    nome: "Estação Caminho Borda da Mata",
    cidade: "Borda da Mata",
    uf: "MG",
    ramal: "Ramal Águas da Prata",
    etapaKm: 214,
    distanciaTrilhaKm: 0.3,
    diariaBase: 110,
    avaliacao: 4.7,
    fotos: [CAMINHOS_ASSETS.quartoCompartilhado],
    whatsapp: "+5535999990002",
    endereco: "Próximo ao caminho, Borda da Mata - MG",
    descricao: "Ponto de apoio modelo com jantar sob consulta, lavanderia rápida e quarto coletivo.",
    amenidades: ["cafe", "jantar", "lavanderia", "bike", "wifi", "compartilhado"],
    servicosAdicionais: [
      { id: "almoco-simples", nome: "Almoço simples", descricao: "Refeição regional para chegada antes do check-in.", preco: 34, unidade: "por pessoa", categoria: "alimentacao", icon: "restaurant-outline", confirmacao: "Sob disponibilidade" },
      { id: "jantar-peregrino", nome: "Jantar do peregrino", descricao: "Jantar com carboidrato, proteína e salada.", preco: 42, unidade: "por pessoa", categoria: "alimentacao", icon: "restaurant-outline", confirmacao: "Confirmar até 15h" },
      { id: "lavanderia-express", nome: "Lavanderia express", descricao: "Lavagem e secagem de peças leves.", preco: 32, unidade: "por carga", categoria: "lavanderia", icon: "shirt-outline", confirmacao: "Prazo informado no check-in" },
      { id: "guarda-bike", nome: "Guarda de bike", descricao: "Espaço protegido para bicicleta durante a noite.", preco: 15, unidade: "por diária", categoria: "apoio", icon: "bicycle-outline", confirmacao: "Vagas limitadas" },
    ],
    quartos: [
      { id: "coletivo-1", nome: "Quarto coletivo", tipo: "compartilhado", capacidade: 1, diaria: 75, disponivel: true },
      { id: "casal-1", nome: "Quarto casal simples", tipo: "casal", capacidade: 2, diaria: 130, disponivel: true },
    ],
  },
  {
    id: "estiva-casa-montanha",
    nome: "Casa da Montanha Estiva",
    cidade: "Estiva",
    uf: "MG",
    ramal: "Ramal Águas da Prata",
    etapaKm: 263,
    distanciaTrilhaKm: 1.1,
    diariaBase: 135,
    avaliacao: 4.9,
    fotos: [CAMINHOS_ASSETS.quartoPrivativo],
    whatsapp: "+5535999990003",
    endereco: "Zona urbana, Estiva - MG",
    descricao: "Hospedagem modelo para descanso entre etapas longas, com café reforçado e apoio para mochila.",
    amenidades: ["cafe", "lavanderia", "mochila", "wifi", "privativo", "carimbo"],
    servicosAdicionais: [
      { id: "cafe-reforcado", nome: "Café reforçado", descricao: "Complemento com ovos, frutas e item extra para etapa longa.", preco: 22, unidade: "por pessoa", categoria: "alimentacao", icon: "cafe-outline", confirmacao: "Servido em horário combinado" },
      { id: "lavanderia-peregrino", nome: "Lavanderia do peregrino", descricao: "Cuidado básico para roupas de caminhada.", preco: 30, unidade: "por carga", categoria: "lavanderia", icon: "shirt-outline", confirmacao: "Confirmar no check-in" },
      { id: "apoio-mochila", nome: "Apoio com mochila", descricao: "Orientação para transporte local de mochila por parceiro da região.", preco: 45, unidade: "sob consulta", categoria: "apoio", icon: "bag-handle-outline", confirmacao: "Depende de parceiro local" },
    ],
    quartos: [
      { id: "familia-1", nome: "Quarto família", tipo: "familia", capacidade: 4, diaria: 220, disponivel: true },
      { id: "privativo-2", nome: "Suíte simples", tipo: "privativo", capacidade: 2, diaria: 150, disponivel: true },
    ],
  },
  {
    id: "paraisopolis-peregrino",
    nome: "Pouso do Peregrino Paraisópolis",
    cidade: "Paraisópolis",
    uf: "MG",
    ramal: "Ramal Paraisópolis",
    etapaKm: 317,
    distanciaTrilhaKm: 0.4,
    diariaBase: 125,
    avaliacao: 4.8,
    fotos: [CAMINHOS_ASSETS.hero],
    whatsapp: "+5535999990004",
    endereco: "Centro, Paraisópolis - MG",
    descricao: "Pouso modelo com atendimento cedo, guarda de bike e jantar mediante reserva.",
    amenidades: ["cafe", "jantar", "bike", "wifi", "privativo", "carimbo"],
    servicosAdicionais: [
      { id: "jantar-reserva", nome: "Jantar mediante reserva", descricao: "Refeição preparada para chegada no fim da tarde.", preco: 40, unidade: "por pessoa", categoria: "alimentacao", icon: "restaurant-outline", confirmacao: "Confirmar até 14h" },
      { id: "marmita-etapa", nome: "Marmita para próxima etapa", descricao: "Opção prática para levar no início da caminhada.", preco: 29, unidade: "por unidade", categoria: "alimentacao", icon: "bag-handle-outline", confirmacao: "Solicitar na chegada" },
      { id: "bike-care", nome: "Espaço bike care", descricao: "Local de apoio para guardar e fazer limpeza simples da bike.", preco: 20, unidade: "por diária", categoria: "apoio", icon: "bicycle-outline", confirmacao: "Vagas limitadas" },
    ],
    quartos: [
      { id: "privativo-3", nome: "Quarto privativo", tipo: "privativo", capacidade: 2, diaria: 145, disponivel: true },
      { id: "compartilhado-2", nome: "Cama compartilhada", tipo: "compartilhado", capacidade: 1, diaria: 80, disponivel: true },
    ],
  },
  {
    id: "aparecida-chegada",
    nome: "Chegada da Fé Aparecida",
    cidade: "Aparecida",
    uf: "SP",
    ramal: "Chegada",
    etapaKm: 497,
    distanciaTrilhaKm: 0.8,
    diariaBase: 160,
    avaliacao: 4.7,
    fotos: [CAMINHOS_ASSETS.pousadaExterior],
    whatsapp: "+5512999990005",
    endereco: "Região central, Aparecida - SP",
    descricao: "Hospedagem modelo para chegada ao Santuário, com quarto privativo e check-in flexível.",
    amenidades: ["cafe", "wifi", "privativo", "mochila"],
    servicosAdicionais: [
      { id: "checkin-flexivel", nome: "Check-in flexível", descricao: "Apoio para chegada fora do horário padrão, quando disponível.", preco: 35, unidade: "por reserva", categoria: "apoio", icon: "bag-handle-outline", confirmacao: "Sob confirmação" },
      { id: "almoco-chegada", nome: "Almoço de chegada", descricao: "Refeição simples próxima ao horário de chegada em Aparecida.", preco: 39, unidade: "por pessoa", categoria: "alimentacao", icon: "restaurant-outline", confirmacao: "Confirmar até 11h" },
      { id: "traslado-local", nome: "Traslado local", descricao: "Indicação de transporte local para deslocamentos curtos.", preco: 55, unidade: "sob consulta", categoria: "transporte", icon: "car-outline", confirmacao: "Depende de disponibilidade" },
    ],
    quartos: [
      { id: "suite-1", nome: "Suíte chegada", tipo: "privativo", capacidade: 2, diaria: 190, disponivel: true },
      { id: "familia-2", nome: "Quarto família", tipo: "familia", capacidade: 4, diaria: 280, disponivel: true },
    ],
  },
];

function demoDatePlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildPainelPousadaReservasDemo(pousada: CaminhoHospedagem): PainelPousadaReserva[] {
  const quartoA = pousada.quartos[0];
  const quartoB = pousada.quartos[1] || pousada.quartos[0];
  const base = [
    { id: "res-001", cliente: "Marina Alves", telefone: "(35) 99921-4400", quarto: quartoA.nome, dias: [0, 1], hospedes: 1, total: quartoA.diaria, extras: 62, status: "checkin_hoje" as const, observacao: "Chegada prevista 17h. Solicitou jantar e lavanderia." },
    { id: "res-002", cliente: "Paulo Henrique", telefone: "(11) 98870-2100", quarto: quartoB.nome, dias: [2, 3], hospedes: 2, total: quartoB.diaria, extras: 48, status: "confirmada" as const, observacao: "Casal em peregrinação. Quer café reforçado cedo." },
    { id: "res-003", cliente: "Grupo Caminhar", telefone: "(31) 99720-1002", quarto: quartoA.nome, dias: [5, 6], hospedes: 4, total: quartoA.diaria * 2, extras: 120, status: "aguardando_pagamento" as const, observacao: "Grupo solicitou apoio com mochila sob consulta." },
    { id: "res-004", cliente: "Renata Duarte", telefone: "(12) 99114-8820", quarto: quartoB.nome, dias: [-3, -2], hospedes: 1, total: quartoB.diaria, extras: 0, status: "concluida" as const, observacao: "Hospedagem concluída sem ocorrência." },
  ];

  return base.map((item) => {
    const sinal = Number((item.total * CAMINHOS_REGRAS_NEGOCIO.sinalPercentual).toFixed(2));
    const comissao = Number((item.total * CAMINHOS_REGRAS_NEGOCIO.comissaoLancamentoPercentual).toFixed(2));
    return {
      ...item,
      checkin: demoDatePlus(item.dias[0]),
      checkout: demoDatePlus(item.dias[1]),
      sinal,
      comissao,
      repasseInicial: Number(Math.max(0, sinal - comissao).toFixed(2)),
      restanteNaChegada: Number((item.total - sinal + item.extras).toFixed(2)),
    };
  });
}

export function buildPainelPousadaDisponibilidadeDemo(): PainelPousadaDisponibilidade[] {
  return [
    { dia: demoDatePlus(0), status: "ocupado", detalhe: "1 check-in confirmado" },
    { dia: demoDatePlus(1), status: "livre", detalhe: "2 quartos livres" },
    { dia: demoDatePlus(2), status: "ocupado", detalhe: "Reserva Paulo Henrique" },
    { dia: demoDatePlus(3), status: "bloqueado", detalhe: "Bloqueio manual para manutenção" },
    { dia: demoDatePlus(4), status: "livre", detalhe: "Disponível para venda" },
    { dia: demoDatePlus(5), status: "ocupado", detalhe: "Grupo Caminhar aguardando sinal" },
  ];
}

function statusReservaPainel(status: string, checkin: string): PainelPousadaReserva["status"] {
  if (status === "cancelada_cliente" || status === "cancelada_pousada") return "cancelada";
  if (status === "concluida" || status === "no_show") return "concluida";
  if (status === "confirmada" && checkin === demoDatePlus(0)) return "checkin_hoje";
  if (status === "confirmada") return "confirmada";
  return "aguardando_pagamento";
}

export function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getHospedagemById(id: string) {
  return HOSPEDAGENS_DEMO.find((item) => item.id === id) || null;
}

export function getQuartoById(hospedagem: CaminhoHospedagem, quartoId: string) {
  return hospedagem.quartos.find((item) => item.id === quartoId) || hospedagem.quartos[0] || null;
}

function datePlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const MINHAS_RESERVAS_HOSPEDAGENS_DEMO: CaminhoHospedagemReservaCliente[] = [
  {
    id: "demo-ouro-fino",
    hospedagemSlug: "ouro-fino-refugio",
    hospedagemNome: "Refúgio do Peregrino Ouro Fino",
    cidade: "Ouro Fino",
    quartoNome: "Quarto privativo peregrino",
    checkin: datePlus(-4),
    checkout: datePlus(-3),
    hospedes: 1,
    total: 140,
    sinal: 70,
    restanteNaPousada: 70,
    status: "concluida",
    statusPagamento: "aprovada",
    createdAt: datePlus(-12),
  },
  {
    id: "demo-borda-mata",
    hospedagemSlug: "borda-mata-estacao",
    hospedagemNome: "Estação Caminho Borda da Mata",
    cidade: "Borda da Mata",
    quartoNome: "Quarto coletivo",
    checkin: datePlus(5),
    checkout: datePlus(6),
    hospedes: 1,
    total: 75,
    sinal: 37.5,
    restanteNaPousada: 37.5,
    status: "confirmada",
    statusPagamento: "aprovada",
    createdAt: datePlus(-2),
  },
];

export function calcularResumoJornada(reservas: CaminhoHospedagemReservaCliente[]) {
  const reservasValidas = reservas.filter((item) => item.status !== "cancelada_cliente" && item.status !== "cancelada_pousada");
  const totalReservado = reservasValidas.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalSinais = reservasValidas.reduce((sum, item) => sum + Number(item.sinal || 0), 0);
  const restantePousadas = reservasValidas.reduce((sum, item) => sum + Number(item.restanteNaPousada || 0), 0);
  const kmPercorridos = reservasValidas.reduce((sum, item) => {
    const hospedagem = getHospedagemById(item.hospedagemSlug);
    return sum + Number(hospedagem?.etapaKm || 0);
  }, 0);

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
    return MINHAS_RESERVAS_HOSPEDAGENS_DEMO;
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
    return MINHAS_RESERVAS_HOSPEDAGENS_DEMO;
  }

  return data?.length ? data.map(mapReservaRow) : MINHAS_RESERVAS_HOSPEDAGENS_DEMO;
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

async function listarReservasLocais() {
  try {
    const raw = await AsyncStorage.getItem(HOSPEDAGENS_RESERVAS_LOCAIS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as HospedagemReservaLocal[]) : [];
  } catch {
    return [];
  }
}

async function salvarReservaLocal(reserva: HospedagemReservaLocal) {
  const atuais = await listarReservasLocais();
  const next = [reserva, ...atuais.filter((item) => item.id !== reserva.id)].slice(0, 30);
  await AsyncStorage.setItem(HOSPEDAGENS_RESERVAS_LOCAIS_KEY, JSON.stringify(next));
}

async function obterReservaLocal(reservaId: string) {
  const reservas = await listarReservasLocais();
  return reservas.find((item) => item.id === reservaId) || null;
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
  const hospedagem = getHospedagemById(payload.hospedagemId);
  if (!hospedagem) throw new Error("Hospedagem indisponível.");
  const quarto = getQuartoById(hospedagem, payload.quartoId);
  if (!quarto) throw new Error("Quarto indisponível.");

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
  const insertPayload = {
    tenant_id: tenantId,
    cliente_id: session.user.id,
    hospedagem_slug: hospedagem.id,
    hospedagem_nome: hospedagem.nome,
    cidade: hospedagem.cidade,
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
    console.log("HOSPEDAGENS RESERVA INSERT FALLBACK:", error?.message);
    const localReserva: HospedagemReservaLocal = {
      id: `local-${Date.now()}`,
      hospedagemNome: hospedagem.nome,
      cidade: hospedagem.cidade,
      quartoNome: quarto.nome,
      checkin: payload.checkin,
      checkout: payload.checkout,
      hospedes: payload.hospedes,
      total: resumo.total,
      sinal: resumo.sinal,
      restanteNaPousada: resumo.restanteNaPousada,
      servicosAdicionaisTotal: Number(payload.servicosAdicionaisTotal || 0),
      servicosAdicionaisDescricao: payload.servicosAdicionaisDescricao?.trim() || "",
      status: "aguardando_pagamento",
      statusPagamento: "pendente",
      provider: null,
      providerPaymentId: null,
    };
    await salvarReservaLocal(localReserva);
    return { reservaId: localReserva.id, resumo, local: true };
  }

  return { reservaId: String(data.id), resumo };
}

export async function obterReservaHospedagemPorId(reservaId: string) {
  if (reservaId.startsWith("local-")) {
    return obterReservaLocal(reservaId);
  }

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
    const reserva = await obterReservaLocal(reservaId);
    return {
      checkoutConfigured: false,
      provider: "mercadopago",
      reservaId,
      valorSinal: reserva?.sinal || 0,
      message: "Reserva local criada para teste. Para cobrança real, sincronize a tabela de reservas e o tenant no Supabase.",
    };
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
  const demoPousada = HOSPEDAGENS_DEMO[0];
  const demoData: PainelPousadaData = {
    source: "demo",
    pousadaDbId: null,
    pousada: demoPousada,
    reservas: buildPainelPousadaReservasDemo(demoPousada),
    quartos: demoPousada.quartos,
    servicos: demoPousada.servicosAdicionais,
    disponibilidade: buildPainelPousadaDisponibilidadeDemo(),
    visivel: true,
    autoConfirmar: false,
    respostaRapida: "Olá! Sua reserva foi recebida. Vamos confirmar os detalhes da chegada e serviços adicionais.",
    gatewayStatus: "pendente",
  };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return demoData;

    const tenantId = await resolveCurrentTenantId().catch(() => null);
    if (!tenantId) return demoData;

    let { data: pousada, error: pousadaError } = await supabase
      .from("caminho_hospedagem_pousadas")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (pousadaError) {
      console.log("HOSPEDAGENS PAINEL LOAD DEMO:", pousadaError.message);
      return demoData;
    }

    if (!pousada) {
      const { data: inserted, error: insertError } = await supabase
        .from("caminho_hospedagem_pousadas")
        .insert({
          tenant_id: tenantId,
          owner_user_id: session.user.id,
          slug: demoPousada.id,
          nome: demoPousada.nome,
          cidade: demoPousada.cidade,
          uf: demoPousada.uf,
          ramal: demoPousada.ramal,
          endereco: demoPousada.endereco,
          whatsapp: demoPousada.whatsapp,
          descricao: demoPousada.descricao,
          status: "pendente",
          visivel: true,
          auto_confirmar: false,
          resposta_rapida: demoData.respostaRapida,
          gateway_provider: "mercadopago",
          gateway_status: "pendente",
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        console.log("HOSPEDAGENS PAINEL CREATE DEMO:", insertError?.message);
        return demoData;
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
        .eq("hospedagem_slug", String(pousada.slug || demoPousada.id))
        .order("checkin", { ascending: true })
        .limit(80),
    ]);

    let quartos: CaminhoQuarto[] = (quartosRes.data || []).map((row: any) => ({
      id: String(row.slug || row.id),
      nome: String(row.nome || "Quarto"),
      tipo: String(row.tipo || "privativo") as CaminhoQuarto["tipo"],
      capacidade: Number(row.capacidade || 1),
      diaria: Number(row.diaria || 0),
      disponivel: Boolean(row.disponivel),
      descricao: row.descricao ? String(row.descricao) : "",
      fotos: Array.isArray(row.fotos) ? row.fotos.map(String) : [],
    }));

    if (!quartos.length) {
      await supabase.from("caminho_hospedagem_quartos").insert(
        demoPousada.quartos.map((item) => ({
          tenant_id: tenantId,
          pousada_id: pousadaDbId,
          slug: item.id,
          nome: item.nome,
          tipo: item.tipo,
          capacidade: item.capacidade,
          diaria: item.diaria,
          disponivel: item.disponivel,
          descricao: item.descricao || null,
          fotos: item.fotos || [],
        })),
      );
      quartos = demoPousada.quartos.map((item) => ({
        ...item,
        descricao: item.descricao || "",
        fotos: item.fotos || [],
      }));
    }

    let servicos = (servicosRes.data || []).map((row: any) => ({
      id: String(row.slug || row.id),
      nome: String(row.nome || "Serviço"),
      descricao: String(row.descricao || ""),
      preco: Number(row.preco || 0),
      unidade: String(row.unidade || "por unidade"),
      categoria: String(row.categoria || "apoio") as CaminhoServicoAdicional["categoria"],
      icon: "bag-handle-outline" as CaminhoServicoAdicional["icon"],
      confirmacao: String(row.confirmacao || "Sob confirmação"),
    }));

    if (!servicos.length) {
      await supabase.from("caminho_hospedagem_servicos").insert(
        demoPousada.servicosAdicionais.map((item) => ({
          tenant_id: tenantId,
          pousada_id: pousadaDbId,
          slug: item.id,
          nome: item.nome,
          descricao: item.descricao,
          preco: item.preco,
          unidade: item.unidade,
          categoria: item.categoria,
          confirmacao: item.confirmacao,
        })),
      );
      servicos = demoPousada.servicosAdicionais;
    }

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
        ...demoPousada,
        id: String(pousada.slug || demoPousada.id),
        nome: String(pousada.nome || demoPousada.nome),
        cidade: String(pousada.cidade || demoPousada.cidade),
        uf: String(pousada.uf || demoPousada.uf) as "MG" | "SP",
        ramal: String(pousada.ramal || demoPousada.ramal),
        endereco: String(pousada.endereco || demoPousada.endereco),
        whatsapp: String(pousada.whatsapp || demoPousada.whatsapp),
        descricao: String(pousada.descricao || demoPousada.descricao),
      },
      reservas: reservas.length ? reservas : buildPainelPousadaReservasDemo(demoPousada),
      quartos,
      servicos,
      disponibilidade: disponibilidade.length ? disponibilidade : buildPainelPousadaDisponibilidadeDemo(),
      visivel: Boolean(pousada.visivel),
      autoConfirmar: Boolean(pousada.auto_confirmar),
      respostaRapida: String(pousada.resposta_rapida || demoData.respostaRapida),
      gatewayStatus: String(pousada.gateway_status || "pendente"),
    };
  } catch (error: any) {
    console.log("HOSPEDAGENS PAINEL UNEXPECTED DEMO:", error?.message || error);
    return demoData;
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
) {
  if (!pousadaDbId) return;
  const tenantId = await resolveCurrentTenantId().catch(() => null);
  if (!tenantId) return;
  await supabase.from("caminho_hospedagem_disponibilidade").upsert(
    {
      tenant_id: tenantId,
      pousada_id: pousadaDbId,
      dia,
      status,
      detalhe,
    },
    { onConflict: "pousada_id,dia" },
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

function buildAdminDemoData(): HospedagensAdminData {
  const reservas = buildPainelPousadaReservasDemo(HOSPEDAGENS_DEMO[0]).map((item) => ({
    id: item.id,
    hospedagemNome: HOSPEDAGENS_DEMO[0].nome,
    cidade: HOSPEDAGENS_DEMO[0].cidade,
    cliente: item.cliente,
    quarto: item.quarto,
    checkin: item.checkin,
    checkout: item.checkout,
    total: item.total + item.extras,
    sinal: item.sinal,
    comissao: item.comissao,
    repasseInicial: item.repasseInicial,
    restanteNaPousada: item.restanteNaChegada,
    status: item.status,
    statusPagamento: item.status === "aguardando_pagamento" ? "pendente" : "aprovada",
    createdAt: new Date().toISOString(),
  }));
  const gmv = reservas.filter((item) => !item.status.includes("cancelada")).reduce((sum, item) => sum + item.total, 0);
  const sinais = reservas.reduce((sum, item) => sum + item.sinal, 0);
  const comissao = reservas.reduce((sum, item) => sum + item.comissao, 0);
  const repasse = reservas.reduce((sum, item) => sum + item.repasseInicial, 0);

  const chamados: CaminhoHospedagemChamado[] = [
    {
      id: "chamado-demo-1",
      reservaId: reservas[0]?.id || null,
      clienteId: null,
      pousadaId: null,
      papelAbertura: "cliente",
      tipo: "duvida",
      prioridade: "normal",
      status: "aberto",
      titulo: "Confirmar horário de chegada",
      descricao: "Cliente quer confirmar se pode chegar após 18h.",
      respostaAdmin: "",
      decisao: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: "chamado-demo-2",
      reservaId: reservas[2]?.id || null,
      clienteId: null,
      pousadaId: null,
      papelAbertura: "pousada",
      tipo: "pagamento",
      prioridade: "alta",
      status: "em_analise",
      titulo: "Sinal pendente em reserva de grupo",
      descricao: "Pousada solicitou revisão do status de pagamento antes de reservar os quartos.",
      respostaAdmin: "Aguardando compensação do provedor.",
      decisao: "",
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    source: "demo",
    metrics: {
      pousadas: HOSPEDAGENS_DEMO.length,
      pousadasPendentes: 1,
      reservas: reservas.length,
      gmv,
      sinais,
      comissao,
      repasse,
      canceladas: reservas.filter((item) => item.status.includes("cancelada")).length,
    },
    pousadas: HOSPEDAGENS_DEMO.map((item, index) => ({
      id: item.id,
      slug: item.id,
      nome: item.nome,
      cidade: item.cidade,
      uf: item.uf,
      status: index === 0 ? "pendente" : "aprovada",
      visivel: index !== 0,
      gatewayStatus: index === 0 ? "pendente" : "ativa",
      quartos: item.quartos.length,
      createdAt: new Date().toISOString(),
    })),
    reservas,
    chamados,
  };
}

export async function carregarAdminHospedagens(): Promise<HospedagensAdminData> {
  const demoData = buildAdminDemoData();
  try {
    const tenantId = await resolveCurrentTenantId().catch(() => null);
    if (!tenantId) return demoData;

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
      console.log("HOSPEDAGENS ADMIN LOAD DEMO:", pousadasRes.error?.message || reservasRes.error?.message);
      return demoData;
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
      pousadas: pousadas.length ? pousadas : demoData.pousadas,
      reservas: reservas.length ? reservas : demoData.reservas,
      chamados: chamados.length ? chamados : demoData.chamados,
    };
  } catch (error: any) {
    console.log("HOSPEDAGENS ADMIN UNEXPECTED DEMO:", error?.message || error);
    return demoData;
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
  const demo = buildAdminDemoData().chamados;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return demo.filter((item) => item.papelAbertura === escopo || escopo === "admin");

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
      console.log("HOSPEDAGENS CHAMADOS LOAD DEMO:", error.message);
      return demo.filter((item) => item.papelAbertura === escopo || escopo === "admin");
    }
    return data?.length ? data.map(mapChamadoRow) : [];
  } catch (error: any) {
    console.log("HOSPEDAGENS CHAMADOS UNEXPECTED DEMO:", error?.message || error);
    return demo.filter((item) => item.papelAbertura === escopo || escopo === "admin");
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
    return [
      { id: "demo-1", papel: "cliente", titulo: "Bem-vindo", mensagem: "Suas reservas e avisos importantes aparecerão aqui.", tipo: "sistema", lida: false, createdAt: new Date().toISOString() },
    ] as CaminhoHospedagemNotificacao[];
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
