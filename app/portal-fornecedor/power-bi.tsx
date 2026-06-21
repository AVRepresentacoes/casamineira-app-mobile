import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { buildCsv, exportCsvFile } from "@/lib/exportCsv";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";

type PeriodDays = 7 | 30 | 90;
type Produto = { id: string; titulo?: string | null; ativo: boolean; estoque: number; preco: number };
type Item = { pedido_id: string; titulo: string; subtotal: number; quantidade: number; created_at: string };
type Pedido = { id: string; status_logistica?: string | null };
type Pagamento = {
  valor_profissional?: number | null;
  valor_comissao?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at?: string | null;
};

type TrendPoint = { day: string; valor: number; media: number };
type ForecastPoint = { label: string; p50: number; p90: number };
type AlertLevel = "critical" | "warning" | "info";
type TeamRole = "owner" | "admin" | "manager" | "staff";
type DrilldownKey = "faturamento" | "crescimento" | "ticket" | "repasse" | "comissao" | "score";
type LayoutPreset = "padrao" | "executivo" | "operacional";
type AuditItem = {
  id: string;
  fornecedor_id: string;
  nome: string | null;
  email: string | null;
  role: TeamRole;
  evento: string;
  pagina: string;
  contexto?: Record<string, unknown> | null;
  created_at: string;
};
type TeamMemberLite = {
  user_id: string;
  name: string | null;
  email: string | null;
  role: TeamRole;
};
type MetaStatus = "aberta" | "em_risco" | "concluida" | "pausada";
type MetaItem = {
  id: string;
  titulo: string;
  kpi_chave: string;
  meta_valor: number;
  valor_atual: number;
  unidade: string;
  prazo: string | null;
  status: MetaStatus;
  progresso_pct: number;
  observacoes: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  responsavel_role: TeamRole | null;
};

type InsightAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
};

type GoalLine = {
  label: string;
  current: number;
  target: number;
  inverse?: boolean;
  suffix?: string;
};

type ExecutiveData = {
  faturamento: number;
  faturamentoAnterior: number;
  crescimentoPct: number;
  totalPedidos: number;
  ticket: number;
  entregues: number;
  pendentes: number;
  cancelados: number;
  atrasoCritico: number;
  repasseAprovado: number;
  repassePendente: number;
  comissao: number;
  margemRepassePct: number;
  taxaAprovacaoRepasse: number;
  semEstoque: number;
  baixoEstoque: number;
  riscoEstoquePct: number;
  cancelRatePct: number;
  entregaRatePct: number;
  trend: TrendPoint[];
  vendasPorProduto: { titulo: string; qtd: number; valor: number }[];
  weekPattern: { label: string; valor: number }[];
  concentracaoTop3Pct: number;
  executiveScore: number;
  goals: GoalLine[];
  alerts: InsightAlert[];
  receitaProjetada30: number;
  heatmapTurno: { label: string; valor: number }[];
  forecast: ForecastPoint[];
};

const PERIODS: { label: string; days: PeriodDays }[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const SCENARIOS = [-10, -5, 0, 5, 10, 15];
const META_STATUS_OPTIONS: MetaStatus[] = ["aberta", "em_risco", "concluida", "pausada"];

function statusPagamento(item: Pagamento) {
  return String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
}

function isAprovado(item: Pagamento) {
  const s = statusPagamento(item);
  return s === "aprovada" || s === "pago";
}

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toneForScore(score: number) {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

function levelColor(level: AlertLevel) {
  if (level === "critical") return "#ef4444";
  if (level === "warning") return "#f59e0b";
  return "#38bdf8";
}

function labelMetaStatus(status: MetaStatus) {
  if (status === "em_risco") return "Em risco";
  if (status === "concluida") return "Concluida";
  if (status === "pausada") return "Pausada";
  return "Aberta";
}

function colorMetaStatus(status: MetaStatus) {
  if (status === "concluida") return "#22c55e";
  if (status === "em_risco") return "#f59e0b";
  if (status === "pausada") return "#64748b";
  return "#38bdf8";
}

export default function PortalFornecedorPowerBI() {
  const { width } = useWindowDimensions();
  const singleColumn = width < 1100;
  const [loading, setLoading] = useState(true);
  const [simularMovimento, setSimularMovimento] = useState(false);
  const [simularDados, setSimularDados] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("padrao");
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);
  const [scenarioPct, setScenarioPct] = useState(0);
  const [targetRevenue, setTargetRevenue] = useState("");
  const [selectedKpi, setSelectedKpi] = useState<DrilldownKey>("faturamento");
  const [myRole, setMyRole] = useState<TeamRole>("staff");
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberLite[]>([]);
  const [metas, setMetas] = useState<MetaItem[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [updatingMetaId, setUpdatingMetaId] = useState<string | null>(null);

  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaKpi, setMetaKpi] = useState("faturamento");
  const [metaValor, setMetaValor] = useState("");
  const [metaPrazo, setMetaPrazo] = useState("");
  const [metaResponsavel, setMetaResponsavel] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [pedidosMap, setPedidosMap] = useState<Map<string, Pedido>>(new Map());
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const canExport = myRole === "owner" || myRole === "admin" || myRole === "manager";
  const canSeeTenantAudit = myRole === "owner" || myRole === "admin";
  const canManageMetas = myRole === "owner" || myRole === "admin" || myRole === "manager";
  const isExecutivo = layoutPreset === "executivo";

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const tenantId = await resolveCurrentTenantId();

      const [produtosRes, itensRes, pagamentosRes, teamRes, auditRes, metasRes] = await Promise.all([
        tenantId
          ? supabase.from("produtos_fornecedor").select("id, titulo, ativo, estoque, preco").eq("fornecedor_id", uid).eq("tenant_id", tenantId)
          : supabase.from("produtos_fornecedor").select("id, titulo, ativo, estoque, preco").eq("fornecedor_id", uid),
        tenantId
          ? supabase
              .from("pedido_produtos_itens")
              .select("pedido_id, titulo, subtotal, quantidade, created_at")
              .eq("fornecedor_id", uid)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(2500)
          : supabase
              .from("pedido_produtos_itens")
              .select("pedido_id, titulo, subtotal, quantidade, created_at")
              .eq("fornecedor_id", uid)
              .order("created_at", { ascending: false })
              .limit(2500),
        tenantId
          ? supabase
              .from("pagamentos")
              .select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at")
              .eq("profissional_id", uid)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(1200)
          : supabase
              .from("pagamentos")
              .select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at")
              .eq("profissional_id", uid)
              .order("created_at", { ascending: false })
              .limit(1200),
        supabase.rpc("get_tenant_team_members"),
        supabase.rpc("listar_fornecedor_bi_auditoria", { p_limit: 20 }),
        supabase.rpc("listar_fornecedor_bi_metas", { p_limit: 40 }),
      ]);

      const itensRows = (itensRes.data as Item[]) || [];
      setProdutos((produtosRes.data as Produto[]) || []);
      setItens(itensRows);
      setPagamentos((pagamentosRes.data as Pagamento[]) || []);
      setAuditRows((auditRes.data as AuditItem[]) || []);
      setMetas((metasRes.data as MetaItem[]) || []);

      const team = (teamRes.data as TeamMemberLite[]) || [];
      setTeamMembers(team);
      const found = team.find((m) => m.user_id === uid);
      setMyRole(found?.role || "staff");

      const ids = [...new Set(itensRows.map((row) => String(row.pedido_id || "")))].filter(Boolean);
      if (ids.length > 0) {
        const pedidosQuery = tenantId
          ? supabase.from("pedidos").select("id, status_logistica").in("id", ids).eq("tenant_id", tenantId)
          : supabase.from("pedidos").select("id, status_logistica").in("id", ids);
        const { data } = await pedidosQuery;
        setPedidosMap(new Map(((data as Pedido[]) || []).map((p) => [String(p.id), p])));
      } else {
        setPedidosMap(new Map());
      }

      await supabase.rpc("registrar_fornecedor_bi_evento", {
        p_evento: "view_dashboard",
        p_contexto: { period_days: periodDays },
        p_pagina: "power_bi",
      });
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const baseData = useMemo<ExecutiveData>(() => {
    const now = Date.now();
    const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
    const previousStart = now - periodDays * 2 * 24 * 60 * 60 * 1000;

    const itensPeriodo = itens.filter((i) => {
      const ms = new Date(i.created_at).getTime();
      return Number.isFinite(ms) && ms >= periodStart;
    });

    const itensAnterior = itens.filter((i) => {
      const ms = new Date(i.created_at).getTime();
      return Number.isFinite(ms) && ms >= previousStart && ms < periodStart;
    });

    const pedidosAgg = new Map<string, { subtotal: number; status: string; firstAt: number }>();
    for (const item of itensPeriodo) {
      const id = String(item.pedido_id || "");
      if (!id) continue;
      const createdAtMs = new Date(item.created_at).getTime();
      const safeAt = Number.isFinite(createdAtMs) ? createdAtMs : now;
      const current = pedidosAgg.get(id) || {
        subtotal: 0,
        status: String(pedidosMap.get(id)?.status_logistica || "novo"),
        firstAt: safeAt,
      };
      current.subtotal += Number(item.subtotal || 0);
      current.firstAt = Math.min(current.firstAt, safeAt);
      current.status = String(pedidosMap.get(id)?.status_logistica || "novo");
      pedidosAgg.set(id, current);
    }

    const pedidos = Array.from(pedidosAgg.entries()).map(([id, agg]) => ({
      id,
      subtotal: agg.subtotal,
      status: agg.status,
      firstAt: agg.firstAt,
    }));

    const faturamento = pedidos.reduce((acc, p) => acc + p.subtotal, 0);
    const faturamentoAnterior = itensAnterior.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
    const crescimentoPct =
      faturamentoAnterior > 0
        ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100
        : faturamento > 0
          ? 100
          : 0;

    const totalPedidos = pedidos.length;
    const ticket = totalPedidos > 0 ? faturamento / totalPedidos : 0;
    const entregues = pedidos.filter((p) => p.status === "entregue").length;
    const pendentes = pedidos.filter((p) => ["novo", "preparando", "enviado"].includes(p.status)).length;
    const cancelados = pedidos.filter((p) => p.status === "cancelado").length;
    const atrasoCritico = pedidos.filter((p) => ["novo", "preparando", "enviado"].includes(p.status) && now - p.firstAt >= 36 * 60 * 60 * 1000).length;

    const pagamentosPeriodo = pagamentos.filter((p) => {
      const ms = new Date(String(p.created_at || "")).getTime();
      return Number.isFinite(ms) && ms >= periodStart;
    });

    const aprovados = pagamentosPeriodo.filter((p) => isAprovado(p));
    const repasseAprovado = aprovados.reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const repassePendente = pagamentosPeriodo
      .filter((p) => !isAprovado(p))
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const comissao = aprovados.reduce((acc, p) => acc + Number(p.valor_comissao || 0), 0);

    const margemRepassePct = faturamento > 0 ? (repasseAprovado / faturamento) * 100 : 0;
    const taxaAprovacaoRepasse = pagamentosPeriodo.length > 0 ? (aprovados.length / pagamentosPeriodo.length) * 100 : 0;

    const ativos = produtos.filter((p) => p.ativo);
    const semEstoque = ativos.filter((p) => Number(p.estoque || 0) <= 0).length;
    const baixoEstoque = ativos.filter((p) => Number(p.estoque || 0) > 0 && Number(p.estoque || 0) <= 5).length;
    const riscoEstoquePct = ativos.length > 0 ? ((semEstoque + baixoEstoque) / ativos.length) * 100 : 0;

    const trendDays = periodDays === 90 ? 20 : periodDays;
    const trendMap = new Map<string, number>();
    for (let i = trendDays - 1; i >= 0; i -= 1) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const item of itensPeriodo) {
      const ms = new Date(item.created_at).getTime();
      if (!Number.isFinite(ms)) continue;
      const key = new Date(ms).toISOString().slice(0, 10);
      if (!trendMap.has(key)) continue;
      trendMap.set(key, Number(trendMap.get(key) || 0) + Number(item.subtotal || 0));
    }

    const trendRaw = Array.from(trendMap.entries()).map(([day, valor]) => ({ day, valor }));
    const trend: TrendPoint[] = trendRaw.map((p, idx, arr) => {
      const start = Math.max(0, idx - 2);
      const slice = arr.slice(start, idx + 1);
      const media = slice.reduce((acc, item) => acc + item.valor, 0) / Math.max(1, slice.length);
      return { day: p.day, valor: p.valor, media };
    });
    const baseMedia = trend.length > 0 ? trend.reduce((acc, t) => acc + t.valor, 0) / trend.length : 0;
    const growthFactor = 1 + crescimentoPct / 100;
    const forecast: ForecastPoint[] = Array.from({ length: 6 }, (_, idx) => {
      const step = idx + 1;
      const projected = Math.max(0, baseMedia * Math.pow(growthFactor, step / 4));
      return {
        label: `W+${step}`,
        p50: projected,
        p90: projected * 1.18,
      };
    });

    const vendasPorProduto = Array.from(
      itensPeriodo
        .reduce((map, item) => {
          const key = String(item.titulo || "Produto");
          const current = map.get(key) || { titulo: key, qtd: 0, valor: 0 };
          current.qtd += Number(item.quantidade || 0);
          current.valor += Number(item.subtotal || 0);
          map.set(key, current);
          return map;
        }, new Map<string, { titulo: string; qtd: number; valor: number }>())
        .values()
    )
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const totalPareto = vendasPorProduto.reduce((acc, item) => acc + item.valor, 0);
    const top3 = vendasPorProduto.slice(0, 3).reduce((acc, item) => acc + item.valor, 0);
    const concentracaoTop3Pct = totalPareto > 0 ? (top3 / totalPareto) * 100 : 0;

    const weekMap = new Map<string, number>([
      ["Dom", 0],
      ["Seg", 0],
      ["Ter", 0],
      ["Qua", 0],
      ["Qui", 0],
      ["Sex", 0],
      ["Sab", 0],
    ]);
    for (const item of itensPeriodo) {
      const dt = new Date(item.created_at);
      if (!Number.isFinite(dt.getTime())) continue;
      const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
      const key = labels[dt.getDay()];
      weekMap.set(key, Number(weekMap.get(key) || 0) + Number(item.subtotal || 0));
    }
    const weekPattern = Array.from(weekMap.entries()).map(([label, valor]) => ({ label, valor }));
    const hourBuckets = new Map<string, number>([
      ["00-06", 0],
      ["06-12", 0],
      ["12-18", 0],
      ["18-24", 0],
    ]);
    for (const item of itensPeriodo) {
      const dt = new Date(item.created_at);
      if (!Number.isFinite(dt.getTime())) continue;
      const h = dt.getHours();
      const key = h < 6 ? "00-06" : h < 12 ? "06-12" : h < 18 ? "12-18" : "18-24";
      hourBuckets.set(key, Number(hourBuckets.get(key) || 0) + Number(item.subtotal || 0));
    }
    const heatmapTurno = Array.from(hourBuckets.entries()).map(([label, valor]) => ({ label, valor }));

    const cancelRatePct = totalPedidos > 0 ? (cancelados / totalPedidos) * 100 : 0;
    const entregaRatePct = totalPedidos > 0 ? (entregues / totalPedidos) * 100 : 0;

    const revenueTarget = parseCurrencyInputBR(targetRevenue) || Math.max(faturamento * 1.12, 1);
    const goals: GoalLine[] = [
      { label: "Meta de receita", current: faturamento, target: revenueTarget },
      { label: "SLA de entregas", current: entregaRatePct, target: 95, suffix: "%" },
      { label: "Taxa de cancelamento", current: cancelRatePct, target: 3, suffix: "%", inverse: true },
      { label: "Margem de repasse", current: margemRepassePct, target: 70, suffix: "%" },
      { label: "Aprovação de repasse", current: taxaAprovacaoRepasse, target: 92, suffix: "%" },
    ];

    const goalsScore = goals.map((g) => {
      if (g.inverse) {
        const ratio = g.current <= g.target ? 1 : g.target / Math.max(1, g.current);
        return clamp(0, ratio * 100, 100);
      }
      return clamp(0, (g.current / Math.max(g.target, 1)) * 100, 100);
    });

    const executiveScore = Number((
      goalsScore[0] * 0.3 +
      goalsScore[1] * 0.2 +
      goalsScore[2] * 0.2 +
      goalsScore[3] * 0.15 +
      goalsScore[4] * 0.15
    ).toFixed(1));

    const receitaBase30 = (faturamento / Math.max(periodDays, 1)) * 30;
    const receitaProjetada30 = receitaBase30 * (1 + scenarioPct / 100);

    const alerts: InsightAlert[] = [];
    if (atrasoCritico > 0) {
      alerts.push({
        id: "atraso",
        level: "critical",
        title: "Atraso operacional crítico",
        detail: `${atrasoCritico} pedidos acima de 36h sem conclusão logística.`,
      });
    }
    if (cancelRatePct > 5) {
      alerts.push({
        id: "cancel",
        level: "warning",
        title: "Cancelamento acima do limite",
        detail: `Taxa atual ${cancelRatePct.toFixed(1)}% (limite recomendado: 3%).`,
      });
    }
    if (riscoEstoquePct >= 25) {
      alerts.push({
        id: "estoque",
        level: "warning",
        title: "Risco de ruptura de estoque",
        detail: `${riscoEstoquePct.toFixed(1)}% do catálogo com risco de indisponibilidade.`,
      });
    }
    if (crescimentoPct < -8) {
      alerts.push({
        id: "growth",
        level: "critical",
        title: "Queda de receita relevante",
        detail: `Variação de ${crescimentoPct.toFixed(1)}% versus período anterior.`,
      });
    }
    if (taxaAprovacaoRepasse < 85) {
      alerts.push({
        id: "cash",
        level: "warning",
        title: "Baixa aprovação de repasses",
        detail: `${taxaAprovacaoRepasse.toFixed(1)}% dos repasses aprovados no período.`,
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: "healthy",
        level: "info",
        title: "Operação estável",
        detail: "Nenhum desvio crítico detectado no período selecionado.",
      });
    }

    return {
      faturamento,
      faturamentoAnterior,
      crescimentoPct,
      totalPedidos,
      ticket,
      entregues,
      pendentes,
      cancelados,
      atrasoCritico,
      repasseAprovado,
      repassePendente,
      comissao,
      margemRepassePct,
      taxaAprovacaoRepasse,
      semEstoque,
      baixoEstoque,
      riscoEstoquePct,
      cancelRatePct,
      entregaRatePct,
      trend,
      vendasPorProduto,
      weekPattern,
      concentracaoTop3Pct,
      executiveScore,
      goals,
      alerts,
      receitaProjetada30,
      heatmapTurno,
      forecast,
    };
  }, [itens, pagamentos, periodDays, pedidosMap, produtos, scenarioPct, targetRevenue]);

  const dataView = useMemo<ExecutiveData>(() => {
    if (!simularDados) return baseData;
    const trendSim = baseData.trend.map((p, idx) => {
      const fator = 1 + ((idx % 5) - 2) * 0.06;
      const valor = Math.max(0, p.valor * fator * 1.18);
      const media = Math.max(0, p.media * (1 + ((idx % 3) - 1) * 0.04) * 1.12);
      return { ...p, valor, media };
    });
    const weekSim = baseData.weekPattern.map((d, idx) => ({
      ...d,
      valor: Math.max(0, d.valor * (1 + ((idx % 4) - 1.5) * 0.08) * 1.15),
    }));
    const heatSim = baseData.heatmapTurno.map((d, idx) => ({
      ...d,
      valor: Math.max(0, d.valor * (1 + ((idx % 4) - 1.5) * 0.1) * 1.12),
    }));
    const forecastSim = baseData.forecast.map((f) => ({
      ...f,
      p50: f.p50 * 1.16,
      p90: f.p90 * 1.18,
    }));
    return {
      ...baseData,
      faturamento: baseData.faturamento * 1.16,
      faturamentoAnterior: baseData.faturamentoAnterior * 1.08,
      crescimentoPct: baseData.crescimentoPct + 6.5,
      totalPedidos: Math.round(baseData.totalPedidos * 1.14),
      ticket: baseData.ticket * 1.08,
      repasseAprovado: baseData.repasseAprovado * 1.15,
      repassePendente: baseData.repassePendente * 0.82,
      comissao: baseData.comissao * 1.12,
      margemRepassePct: Math.min(100, baseData.margemRepassePct + 3.8),
      taxaAprovacaoRepasse: Math.min(100, baseData.taxaAprovacaoRepasse + 4.2),
      trend: trendSim,
      weekPattern: weekSim,
      heatmapTurno: heatSim,
      forecast: forecastSim,
      receitaProjetada30: baseData.receitaProjetada30 * 1.2,
      executiveScore: Math.min(100, baseData.executiveScore + 7.4),
    };
  }, [baseData, simularDados]);

  const data = dataView;

  const narrativaExecutiva = useMemo(() => {
    const linhas: string[] = [];
    linhas.push(
      `Receita de ${formatMoney(data.faturamento)} no periodo de ${periodDays} dias, variacao de ${data.crescimentoPct.toFixed(1)}% frente ao periodo anterior.`
    );
    if (data.crescimentoPct < 0) {
      linhas.push("A leitura sugere foco imediato em recuperacao comercial para conter a desaceleracao.");
    } else {
      linhas.push("A tracao comercial esta positiva, com oportunidade de escalar mantendo margem e SLA.");
    }

    linhas.push(
      `SLA de entrega em ${data.entregaRatePct.toFixed(1)}% e cancelamento em ${data.cancelRatePct.toFixed(1)}%.`
    );
    if (data.atrasoCritico > 0) {
      linhas.push(`Existem ${data.atrasoCritico} pedidos em atraso critico, recomendando mutirao operacional.`);
    }

    linhas.push(
      `Repasse aprovado em ${formatMoney(data.repasseAprovado)} e margem de repasse de ${data.margemRepassePct.toFixed(1)}%.`
    );
    linhas.push(
      `Score executivo consolidado em ${data.executiveScore.toFixed(1)} pontos e concentracao top 3 produtos em ${data.concentracaoTop3Pct.toFixed(1)}%.`
    );
    return linhas;
  }, [data, periodDays]);

  const drilldown = useMemo(() => {
    if (selectedKpi === "crescimento") {
      return {
        title: "Drill-down de crescimento",
        lines: [
          `Periodo atual: ${formatMoney(data.faturamento)}`,
          `Periodo anterior: ${formatMoney(data.faturamentoAnterior)}`,
          `Variacao: ${data.crescimentoPct.toFixed(1)}%`,
        ],
      };
    }
    if (selectedKpi === "ticket") {
      return {
        title: "Drill-down de ticket medio",
        lines: [
          `Ticket medio: ${formatMoney(data.ticket)}`,
          `Pedidos no periodo: ${data.totalPedidos}`,
          `Faturamento total: ${formatMoney(data.faturamento)}`,
        ],
      };
    }
    if (selectedKpi === "repasse") {
      return {
        title: "Drill-down de repasses",
        lines: [
          `Repasse aprovado: ${formatMoney(data.repasseAprovado)}`,
          `Repasse pendente: ${formatMoney(data.repassePendente)}`,
          `Aprovacao de repasse: ${data.taxaAprovacaoRepasse.toFixed(1)}%`,
        ],
      };
    }
    if (selectedKpi === "comissao") {
      return {
        title: "Drill-down de comissao",
        lines: [
          `Comissao total: ${formatMoney(data.comissao)}`,
          `Margem de repasse: ${data.margemRepassePct.toFixed(1)}%`,
          `Receita projetada 30D: ${formatMoney(data.receitaProjetada30)}`,
        ],
      };
    }
    if (selectedKpi === "score") {
      return {
        title: "Drill-down de score executivo",
        lines: [
          `Score atual: ${data.executiveScore.toFixed(1)}`,
          `Risco de estoque: ${data.riscoEstoquePct.toFixed(1)}%`,
          `Taxa de cancelamento: ${data.cancelRatePct.toFixed(1)}%`,
        ],
      };
    }
    return {
      title: "Drill-down de faturamento",
      lines: [
        `Faturamento no periodo: ${formatMoney(data.faturamento)}`,
        `Total de pedidos: ${data.totalPedidos}`,
        `Concentracao top 3: ${data.concentracaoTop3Pct.toFixed(1)}%`,
      ],
    };
  }, [data, selectedKpi]);

  const exportarCsv = useCallback(async () => {
    if (!canExport) {
      Alert.alert("Permissão insuficiente", "A exportação é permitida para perfis manager, admin ou owner.");
      return;
    }
    try {
      const csv = buildCsv(
        ["Indicador", "Valor"],
        [
          ["Periodo", `${periodDays} dias`],
          ["Faturamento", data.faturamento.toFixed(2)],
          ["Faturamento Anterior", data.faturamentoAnterior.toFixed(2)],
          ["Crescimento %", data.crescimentoPct.toFixed(2)],
          ["Pedidos", data.totalPedidos],
          ["Ticket Medio", data.ticket.toFixed(2)],
          ["Repasse Aprovado", data.repasseAprovado.toFixed(2)],
          ["Repasse Pendente", data.repassePendente.toFixed(2)],
          ["Comissao", data.comissao.toFixed(2)],
          ["Margem Repasse %", data.margemRepassePct.toFixed(2)],
          ["Taxa Aprovacao Repasse %", data.taxaAprovacaoRepasse.toFixed(2)],
          ["Risco Estoque %", data.riscoEstoquePct.toFixed(2)],
          ["Score Executivo", data.executiveScore.toFixed(1)],
          ["Receita Projetada 30D", data.receitaProjetada30.toFixed(2)],
        ]
      );
      await exportCsvFile(`power-bi-executive-${new Date().toISOString().slice(0, 10)}.csv`, csv);

      await supabase.rpc("registrar_fornecedor_bi_evento", {
        p_evento: "export_csv",
        p_contexto: {
          period_days: periodDays,
          faturamento: Number(data.faturamento.toFixed(2)),
          score: Number(data.executiveScore.toFixed(1)),
        },
        p_pagina: "power_bi",
      });
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao exportar CSV.");
    }
  }, [canExport, carregar, data, periodDays]);

  const salvarMeta = useCallback(async () => {
    if (!canManageMetas) {
      Alert.alert("Permissao insuficiente", "Somente manager, admin ou owner podem criar metas.");
      return;
    }
    const valorNum = parseCurrencyInputBR(metaValor);
    if (!metaTitulo.trim()) {
      Alert.alert("Atencao", "Titulo da meta e obrigatorio.");
      return;
    }
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      Alert.alert("Atencao", "Valor de meta invalido.");
      return;
    }

    try {
      setSavingMeta(true);
      const { error } = await supabase.rpc("salvar_fornecedor_bi_meta", {
        p_titulo: metaTitulo.trim(),
        p_kpi_chave: metaKpi,
        p_meta_valor: valorNum,
        p_unidade: metaKpi === "faturamento" || metaKpi === "ticket" ? "currency" : "percent",
        p_prazo: metaPrazo.trim() || null,
        p_responsavel_id: metaResponsavel || null,
        p_observacoes: null,
      });
      if (error) throw error;

      await supabase.rpc("registrar_fornecedor_bi_evento", {
        p_evento: "create_goal",
        p_contexto: { titulo: metaTitulo.trim(), kpi: metaKpi, meta_valor: valorNum },
        p_pagina: "power_bi",
      });

      setMetaTitulo("");
      setMetaValor("");
      setMetaPrazo("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao criar meta.");
    } finally {
      setSavingMeta(false);
    }
  }, [canManageMetas, carregar, metaKpi, metaPrazo, metaResponsavel, metaTitulo, metaValor]);

  const atualizarStatusMeta = useCallback(
    async (meta: MetaItem, status: MetaStatus) => {
      if (!canManageMetas) {
        Alert.alert("Permissao insuficiente", "Somente manager, admin ou owner podem atualizar metas.");
        return;
      }
      try {
        setUpdatingMetaId(meta.id);
        const { error } = await supabase.rpc("atualizar_fornecedor_bi_meta_status", {
          p_meta_id: meta.id,
          p_status: status,
          p_valor_atual: null,
          p_progresso_pct: null,
          p_observacoes: null,
        });
        if (error) throw error;
        await carregar();
      } catch (error: any) {
        Alert.alert("Erro", error?.message || "Falha ao atualizar status da meta.");
      } finally {
        setUpdatingMetaId(null);
      }
    },
    [canManageMetas, carregar]
  );

  return (
    <PortalShell title="Power BI Executive" subtitle="Business intelligence de alta gestão para operação transparente">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.toolbar}>
            <View style={styles.periodRow}>
              {PERIODS.map((p) => {
                const active = p.days === periodDays;
                return (
                  <TouchableOpacity key={p.days} style={[styles.periodBtn, active ? styles.periodBtnActive : null]} onPress={() => setPeriodDays(p.days)}>
                    <Text style={[styles.periodText, active ? styles.periodTextActive : null]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.toolbarActions}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{String(myRole || "staff").toUpperCase()}</Text>
              </View>
              <TouchableOpacity
                style={[styles.toolButton, simularMovimento ? styles.toolButtonWarn : null]}
                onPress={() => setSimularMovimento((v) => !v)}
              >
                <Text style={styles.toolButtonText}>{simularMovimento ? "Layout Padrão" : "Simular Movimentação"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, simularDados ? styles.toolButtonWarn : null]}
                onPress={() => setSimularDados((v) => !v)}
              >
                <Text style={styles.toolButtonText}>{simularDados ? "Dados Reais" : "Dados Fictícios"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton} onPress={() => void carregar()}>
                <Text style={styles.toolButtonText}>Atualizar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, styles.toolButtonAccent, !canExport ? styles.toolButtonDisabled : null]}
                onPress={() => void exportarCsv()}
                disabled={!canExport}
              >
                <Text style={[styles.toolButtonText, { color: "#032018" }]}>Exportar CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[styles.presetBtn, layoutPreset === "padrao" ? styles.presetBtnActive : null]}
              onPress={() => setLayoutPreset("padrao")}
            >
              <Text style={[styles.presetText, layoutPreset === "padrao" ? styles.presetTextActive : null]}>Padrão</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, layoutPreset === "executivo" ? styles.presetBtnActive : null]}
              onPress={() => setLayoutPreset("executivo")}
            >
              <Text style={[styles.presetText, layoutPreset === "executivo" ? styles.presetTextActive : null]}>Executivo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, layoutPreset === "operacional" ? styles.presetBtnActive : null]}
              onPress={() => setLayoutPreset("operacional")}
            >
              <Text style={[styles.presetText, layoutPreset === "operacional" ? styles.presetTextActive : null]}>Operacional</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.kpiRow}>
            <KpiCard
              label="Faturamento"
              value={formatMoney(data.faturamento)}
              tone="#22c55e"
              active={selectedKpi === "faturamento"}
              onPress={() => setSelectedKpi("faturamento")}
            />
            <KpiCard
              label="Crescimento"
              value={`${data.crescimentoPct.toFixed(1)}%`}
              tone={data.crescimentoPct >= 0 ? "#22c55e" : "#ef4444"}
              active={selectedKpi === "crescimento"}
              onPress={() => setSelectedKpi("crescimento")}
            />
            <KpiCard
              label="Ticket médio"
              value={formatMoney(data.ticket)}
              tone="#38bdf8"
              active={selectedKpi === "ticket"}
              onPress={() => setSelectedKpi("ticket")}
            />
            <KpiCard
              label="Repasse aprovado"
              value={formatMoney(data.repasseAprovado)}
              tone="#facc15"
              active={selectedKpi === "repasse"}
              onPress={() => setSelectedKpi("repasse")}
            />
            <KpiCard
              label="Comissão"
              value={formatMoney(data.comissao)}
              tone="#a78bfa"
              active={selectedKpi === "comissao"}
              onPress={() => setSelectedKpi("comissao")}
            />
            <KpiCard
              label="Score Executivo"
              value={`${data.executiveScore.toFixed(1)}`}
              tone={toneForScore(data.executiveScore)}
              active={selectedKpi === "score"}
              onPress={() => setSelectedKpi("score")}
            />
          </View>

          <Card title="Narrativa IA do periodo">
            {narrativaExecutiva.map((linha) => (
              <Text key={linha} style={styles.narrativeLine}>
                • {linha}
              </Text>
            ))}
          </Card>

          {!isExecutivo ? (
            <>
              <Text style={styles.sectionHeader}>Novos gráficos do Power BI</Text>
          <Text style={styles.layoutHint}>
            {simularMovimento
              ? "Simulação ativa: gráficos reordenados para validar ergonomia visual."
              : "Layout padrão do dashboard."}
            {simularDados ? " Dados fictícios ligados para teste visual com números." : ""}
          </Text>
              <View style={[styles.grid, singleColumn ? styles.gridSingle : null]}>
                {simularMovimento ? (
                  <>
                    <Card title="Gráfico de Linha (Cobrinha)" singleColumn={singleColumn}>
                      <SnakeLine data={data.trend} />
                      <View style={{ marginTop: 8 }}>
                        <MiniMetric label="Último valor" value={formatMoney(data.trend[data.trend.length - 1]?.valor || 0)} />
                      </View>
                    </Card>
                    <Card title="Linha com Eixo X e Y" singleColumn={singleColumn}>
                      <AxesLineChart data={data.trend} />
                      <View style={{ marginTop: 8 }}>
                        <MiniMetric label="Média do período" value={formatMoney(data.trend.reduce((a, b) => a + b.valor, 0) / Math.max(1, data.trend.length))} />
                      </View>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card title="Gráfico de Pizza / Rosca" singleColumn={singleColumn}>
                      <DonutPseudo
                        items={[
                          { label: "Entregues", value: data.entregues, color: "#22c55e" },
                          { label: "Pendentes", value: data.pendentes, color: "#38bdf8" },
                          { label: "Cancelados", value: data.cancelados, color: "#ef4444" },
                        ]}
                      />
                    </Card>
                    <Card title="Gráfico de Área (Montanha)" singleColumn={singleColumn}>
                      <AreaMountains data={data.trend} />
                      <View style={{ marginTop: 8 }}>
                        <MiniMetric label="Pico" value={formatMoney(Math.max(0, ...data.trend.map((t) => t.valor)))} />
                      </View>
                    </Card>
                  </>
                )}
              </View>
              <View style={[styles.grid, singleColumn ? styles.gridSingle : null]}>
                {simularMovimento ? (
                  <>
                    <Card title="Gráfico de Pizza / Rosca" singleColumn={singleColumn}>
                      <DonutPseudo
                        items={[
                          { label: "Entregues", value: data.entregues, color: "#22c55e" },
                          { label: "Pendentes", value: data.pendentes, color: "#38bdf8" },
                          { label: "Cancelados", value: data.cancelados, color: "#ef4444" },
                        ]}
                      />
                    </Card>
                <Card title="Gráfico de Área (Montanha)" singleColumn={singleColumn}>
                  <AreaMountains data={data.trend} />
                  <View style={{ marginTop: 8 }}>
                    <MiniMetric label="Pico" value={formatMoney(Math.max(0, ...data.trend.map((t) => t.valor)))} />
                  </View>
                </Card>
                  </>
                ) : (
                  <>
                <Card title="Gráfico de Linha (Cobrinha)" singleColumn={singleColumn}>
                  <SnakeLine data={data.trend} />
                  <View style={{ marginTop: 8 }}>
                    <MiniMetric label="Último valor" value={formatMoney(data.trend[data.trend.length - 1]?.valor || 0)} />
                  </View>
                </Card>
                <Card title="Linha com Eixo X e Y" singleColumn={singleColumn}>
                  <AxesLineChart data={data.trend} />
                  <View style={{ marginTop: 8 }}>
                    <MiniMetric label="Média do período" value={formatMoney(data.trend.reduce((a, b) => a + b.valor, 0) / Math.max(1, data.trend.length))} />
                  </View>
                </Card>
                  </>
                )}
              </View>
            </>
          ) : null}

          <View style={[styles.grid, singleColumn ? styles.gridSingle : null]}>
            <Card title="Cockpit de governança" singleColumn={singleColumn}>
              <View style={styles.rowBetween}>
                <Text style={styles.metaText}>Saúde operacional geral</Text>
                <Text style={[styles.bigScore, { color: toneForScore(data.executiveScore) }]}>{data.executiveScore.toFixed(1)}</Text>
              </View>
              <View style={{ gap: 8, marginTop: 8 }}>
                {data.goals.map((goal) => (
                  <GoalBar key={goal.label} item={goal} />
                ))}
              </View>
            </Card>

            <Card title="Receita x Média móvel" singleColumn={singleColumn}>
              <LineBars data={data.trend} />
            </Card>
          </View>

          <Card title="Forecast 6 semanas (P50/P90)" singleColumn={singleColumn}>
            <ForecastBands data={data.forecast} />
          </Card>

          <Card title={drilldown.title} singleColumn={singleColumn}>
            {drilldown.lines.map((line) => (
              <Text key={line} style={styles.drillLine}>
                {line}
              </Text>
            ))}
          </Card>

          {!isExecutivo ? (
          <View style={[styles.grid, singleColumn ? styles.gridSingle : null]}>
            <Card title="Planejamento de cenário 30D" singleColumn={singleColumn}>
              <Text style={styles.metaText}>Meta de receita</Text>
              <TextInput
                value={targetRevenue}
                onChangeText={(text) => setTargetRevenue(formatCurrencyInputBR(text))}
                placeholder="0,00"
                keyboardType="numeric"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
              <Text style={[styles.metaText, { marginTop: 10 }]}>Cenário de variação</Text>
              <View style={styles.scenarioRow}>
                {SCENARIOS.map((value) => {
                  const active = value === scenarioPct;
                  return (
                    <TouchableOpacity key={value} style={[styles.scenarioBtn, active ? styles.scenarioBtnActive : null]} onPress={() => setScenarioPct(value)}>
                      <Text style={[styles.scenarioText, active ? styles.scenarioTextActive : null]}>{value > 0 ? `+${value}%` : `${value}%`}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.planBox}>
                <Text style={styles.planLabel}>Receita projetada</Text>
                <Text style={styles.planValue}>{formatMoney(data.receitaProjetada30)}</Text>
              </View>
            </Card>

            <Card title="Funil logístico" singleColumn={singleColumn}>
              <FunnelBars
                items={[
                  { label: "Pendentes", value: data.pendentes, color: "#38bdf8" },
                  { label: "Entregues", value: data.entregues, color: "#22c55e" },
                  { label: "Cancelados", value: data.cancelados, color: "#ef4444" },
                ]}
              />
              <View style={{ marginTop: 10, gap: 5 }}>
                <MiniMetric label="SLA de entrega" value={`${data.entregaRatePct.toFixed(1)}%`} />
                <MiniMetric label="Taxa de cancelamento" value={`${data.cancelRatePct.toFixed(1)}%`} />
                <MiniMetric label="Atraso crítico" value={`${data.atrasoCritico}`} />
              </View>
            </Card>
          </View>
          ) : null}

          {!isExecutivo ? (
          <View style={[styles.grid, singleColumn ? styles.gridSingle : null]}>
            <Card title="Composição operacional" singleColumn={singleColumn}>
              <DonutPseudo
                items={[
                  { label: "Entregues", value: data.entregues, color: "#22c55e" },
                  { label: "Pendentes", value: data.pendentes, color: "#38bdf8" },
                  { label: "Cancelados", value: data.cancelados, color: "#ef4444" },
                ]}
              />
              <View style={{ marginTop: 10 }}>
                <MiniMetric label="Aprovação de repasse" value={`${data.taxaAprovacaoRepasse.toFixed(1)}%`} />
                <MiniMetric label="Margem de repasse" value={`${data.margemRepassePct.toFixed(1)}%`} />
              </View>
            </Card>

            <Card title="Padrão semanal de receita" singleColumn={singleColumn}>
              <WeekColumns data={data.weekPattern} />
            </Card>
          </View>
          ) : null}

          {!isExecutivo ? (
          <View style={[styles.grid, singleColumn ? styles.gridSingle : null]}>
            <Card title="Gauge de performance executiva" singleColumn={singleColumn}>
              <GaugePseudo value={data.executiveScore} />
            </Card>

            <Card title="Waterfall financeiro" singleColumn={singleColumn}>
              <WaterfallBars
                items={[
                  { label: "Receita", valor: data.faturamento, color: "#22c55e" },
                  { label: "Repasse", valor: data.repasseAprovado, color: "#38bdf8" },
                  { label: "Comissão", valor: data.comissao, color: "#f59e0b" },
                  {
                    label: "Resultado",
                    valor: Math.max(0, data.repasseAprovado - data.comissao),
                    color: "#a78bfa",
                  },
                ]}
              />
            </Card>
          </View>
          ) : null}

          {!isExecutivo ? (
            <Card title="Heatmap por turno de venda" singleColumn={singleColumn}>
              <HeatmapTurno data={data.heatmapTurno} />
            </Card>
          ) : null}

          <Card title="Pareto de produtos (80/20)" singleColumn={singleColumn}>
            <View style={{ marginBottom: 8 }}>
              <MiniMetric label="Concentração top 3" value={`${data.concentracaoTop3Pct.toFixed(1)}%`} />
            </View>
            <ParetoTable items={data.vendasPorProduto} />
          </Card>

          <Card title="Centro de alertas executivos" singleColumn={singleColumn}>
            {data.alerts.map((alert) => (
              <View key={alert.id} style={styles.alertRow}>
                <View style={[styles.alertDot, { backgroundColor: levelColor(alert.level) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDetail}>{alert.detail}</Text>
                </View>
              </View>
            ))}
          </Card>

          <Card title="Centro de metas com dono e SLA" singleColumn={singleColumn}>
            {canManageMetas ? (
              <View style={styles.metaForm}>
                <TextInput
                  value={metaTitulo}
                  onChangeText={setMetaTitulo}
                  placeholder="Titulo da meta"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
                <View style={styles.metaFormRow}>
                  <TextInput
                    value={metaKpi}
                    onChangeText={setMetaKpi}
                    placeholder="KPI (ex: faturamento)"
                    placeholderTextColor="#64748b"
                    style={[styles.input, styles.metaInputHalf]}
                  />
                  <TextInput
                    value={metaValor}
                    onChangeText={(t) => setMetaValor(formatCurrencyInputBR(t))}
                    placeholder="Valor meta"
                    keyboardType="numeric"
                    placeholderTextColor="#64748b"
                    style={[styles.input, styles.metaInputHalf]}
                  />
                </View>
                <View style={styles.metaFormRow}>
                  <TextInput
                    value={metaPrazo}
                    onChangeText={setMetaPrazo}
                    placeholder="Prazo (YYYY-MM-DD)"
                    placeholderTextColor="#64748b"
                    style={[styles.input, styles.metaInputHalf]}
                  />
                  <TextInput
                    value={metaResponsavel}
                    onChangeText={setMetaResponsavel}
                    placeholder="Responsavel (user_id)"
                    placeholderTextColor="#64748b"
                    style={[styles.input, styles.metaInputHalf]}
                  />
                </View>
                {teamMembers.length > 0 ? (
                  <Text style={styles.metaHint}>
                    Responsaveis da equipe: {teamMembers.map((m) => `${m.name || m.email} (${m.user_id.slice(0, 8)})`).join(" | ")}
                  </Text>
                ) : null}
                <TouchableOpacity style={styles.metaSaveBtn} onPress={() => void salvarMeta()} disabled={savingMeta}>
                  <Text style={styles.metaSaveText}>{savingMeta ? "Salvando..." : "Criar meta"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.metaHint}>Perfil sem permissao de edicao. Visualizacao liberada.</Text>
            )}

            {metas.length === 0 ? (
              <Text style={styles.empty}>Sem metas cadastradas.</Text>
            ) : (
              metas.map((meta) => (
                <View key={meta.id} style={styles.metaRow}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.metaTitle}>{meta.titulo}</Text>
                    <View style={[styles.metaStatusBadge, { borderColor: colorMetaStatus(meta.status) }]}>
                      <Text style={[styles.metaStatusText, { color: colorMetaStatus(meta.status) }]}>{labelMetaStatus(meta.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.metaDesc}>
                    KPI: {meta.kpi_chave} | Meta: {meta.unidade === "currency" ? formatMoney(meta.meta_valor) : `${meta.meta_valor.toFixed(2)}%`}
                  </Text>
                  <Text style={styles.metaDesc}>
                    Atual: {meta.unidade === "currency" ? formatMoney(meta.valor_atual) : `${meta.valor_atual.toFixed(2)}%`} | Progresso: {meta.progresso_pct.toFixed(1)}%
                  </Text>
                  <Text style={styles.metaDesc}>
                    Dono: {meta.responsavel_nome || meta.responsavel_email || "Nao definido"} | Prazo: {meta.prazo ? new Date(meta.prazo).toLocaleDateString("pt-BR") : "Sem prazo"}
                  </Text>
                  {canManageMetas ? (
                    <View style={styles.metaStatusRow}>
                      {META_STATUS_OPTIONS.map((status) => (
                        <TouchableOpacity
                          key={`${meta.id}-${status}`}
                          style={[styles.metaStatusBtn, meta.status === status ? styles.metaStatusBtnActive : null]}
                          onPress={() => void atualizarStatusMeta(meta, status)}
                          disabled={updatingMetaId === meta.id}
                        >
                          <Text style={styles.metaStatusBtnText}>{labelMetaStatus(status)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </Card>

          <Card title={canSeeTenantAudit ? "Trilha de auditoria do tenant" : "Minha trilha de auditoria"} singleColumn={singleColumn}>
            {auditRows.length === 0 ? (
              <Text style={styles.empty}>Sem eventos de auditoria.</Text>
            ) : (
              auditRows.map((row) => (
                <View key={row.id} style={styles.auditRow}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.auditTitle}>
                      {row.evento === "export_csv" ? "Exportação de relatório" : "Visualização do painel"}
                    </Text>
                    <Text style={styles.auditDate}>{new Date(row.created_at).toLocaleString("pt-BR")}</Text>
                  </View>
                  <Text style={styles.auditMeta}>
                    {row.nome || "Usuário"} ({row.role}) • {row.email || "sem email"}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      )}
    </PortalShell>
  );
}

function Card({
  title,
  children,
  singleColumn,
}: {
  title: string;
  children: React.ReactNode;
  singleColumn?: boolean;
}) {
  return (
    <View style={[styles.card, singleColumn ? styles.cardSingle : null]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function KpiCard({
  label,
  value,
  tone,
  active,
  onPress,
}: {
  label: string;
  value: string;
  tone: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.kpiCard, active ? styles.kpiCardActive : null]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]}>{value}</Text>
    </TouchableOpacity>
  );
}

function GoalBar({ item }: { item: GoalLine }) {
  const ratio = item.inverse
    ? item.current <= item.target
      ? 100
      : (item.target / Math.max(item.current, 1)) * 100
    : (item.current / Math.max(item.target, 1)) * 100;

  const pct = clamp(0, ratio, 100);
  const color = toneForScore(pct);
  const currentText = item.suffix ? `${item.current.toFixed(1)}${item.suffix}` : formatMoney(item.current);
  const targetText = item.suffix ? `${item.target.toFixed(1)}${item.suffix}` : formatMoney(item.target);

  return (
    <View>
      <View style={styles.rowBetween}>
        <Text style={styles.metaText}>{item.label}</Text>
        <Text style={[styles.metaText, { color }]}>{pct.toFixed(0)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.metaSubText}>Atual: {currentText} | Meta: {targetText}</Text>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.metaText}>{label}</Text>
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

function LineBars({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.valor, d.media)));
  return (
    <View style={styles.lineWrap}>
      {data.map((point) => (
        <View key={point.day} style={styles.lineCol}>
          <View style={styles.lineTrack}>
            <View style={[styles.lineBar, { height: `${Math.max(5, (point.valor / max) * 100)}%` }]} />
            <View style={[styles.avgMark, { bottom: `${Math.max(0, (point.media / max) * 100)}%` }]} />
          </View>
          <Text style={styles.axisLabel}>{point.day.slice(8, 10)}</Text>
        </View>
      ))}
    </View>
  );
}

function FunnelBars({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item.label}>
          <View style={styles.rowBetween}>
            <Text style={styles.metaText}>{item.label}</Text>
            <Text style={styles.metaText}>{item.value}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(item.value / max) * 100}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function DonutPseudo({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => {
        const pct = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <View key={item.label} style={styles.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.metaText}>{item.label}</Text>
            </View>
            <Text style={styles.metaText}>
              {item.value} ({pct.toFixed(1)}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function WeekColumns({ data }: { data: { label: string; valor: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <View style={styles.weekWrap}>
      {data.map((d) => (
        <View key={d.label} style={styles.weekCol}>
          <View style={styles.weekTrack}>
            <View style={[styles.weekBar, { height: `${Math.max(6, (d.valor / max) * 100)}%` }]} />
          </View>
          <Text style={styles.axisLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function GaugePseudo({ value }: { value: number }) {
  const pct = clamp(0, value, 100);
  return (
    <View style={styles.gaugeWrap}>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${pct}%`, backgroundColor: toneForScore(pct) }]} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.metaText}>0</Text>
        <Text style={[styles.gaugeValue, { color: toneForScore(pct) }]}>{pct.toFixed(1)}</Text>
        <Text style={styles.metaText}>100</Text>
      </View>
    </View>
  );
}

function WaterfallBars({ items }: { items: { label: string; valor: number; color: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item.label}>
          <View style={styles.rowBetween}>
            <Text style={styles.metaText}>{item.label}</Text>
            <Text style={styles.metaText}>{formatMoney(item.valor)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(item.valor / max) * 100}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function HeatmapTurno({ data }: { data: { label: string; valor: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <View style={styles.heatRow}>
      {data.map((cell) => {
        const intensity = clamp(0.12, cell.valor / max, 1);
        return (
          <View key={cell.label} style={styles.heatCol}>
            <View
              style={[
                styles.heatCell,
                { backgroundColor: `rgba(56,189,248,${intensity.toFixed(2)})` },
              ]}
            />
            <Text style={styles.axisLabel}>{cell.label}</Text>
            <Text style={styles.heatVal}>{formatMoney(cell.valor)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ForecastBands({ data }: { data: ForecastPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.p90));
  return (
    <View style={styles.forecastWrap}>
      {data.map((point) => (
        <View key={point.label} style={styles.forecastCol}>
          <View style={styles.forecastTrack}>
            <View style={[styles.forecastP90, { height: `${Math.max(8, (point.p90 / max) * 100)}%` }]} />
            <View style={[styles.forecastP50, { height: `${Math.max(6, (point.p50 / max) * 100)}%` }]} />
          </View>
          <Text style={styles.axisLabel}>{point.label}</Text>
          <Text style={styles.heatVal}>{formatMoney(point.p50)}</Text>
        </View>
      ))}
    </View>
  );
}

function AreaMountains({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <View style={styles.areaWrap}>
      {data.map((point) => (
        <View key={`area-${point.day}`} style={styles.areaCol}>
          <View style={styles.areaTrack}>
            <View style={[styles.areaFill, { height: `${Math.max(6, (point.valor / max) * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SnakeLine({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <View style={styles.snakeWrap}>
      {data.map((point) => (
        <View key={`snake-${point.day}`} style={styles.snakeCol}>
          <View style={styles.snakeTrack}>
            <View style={[styles.snakeDot, { bottom: `${Math.max(0, (point.valor / max) * 100)}%` }]} />
          </View>
          <Text style={styles.axisLabel}>{point.day.slice(8, 10)}</Text>
        </View>
      ))}
    </View>
  );
}

function AxesLineChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <View style={styles.axesChart}>
      <View style={styles.yAxis} />
      <View style={styles.xAxis} />
      <View style={styles.axesPointsRow}>
        {data.map((point) => (
          <View key={`axes-${point.day}`} style={styles.axesPointCol}>
            <View style={[styles.axesPoint, { bottom: `${Math.max(0, (point.valor / max) * 100)}%` }]} />
            <Text style={styles.axisLabel}>{point.day.slice(8, 10)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ParetoTable({ items }: { items: { titulo: string; qtd: number; valor: number }[] }) {
  const total = items.reduce((acc, i) => acc + i.valor, 0);
  let cumul = 0;
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => {
        cumul += item.valor;
        const pct = total > 0 ? (item.valor / total) * 100 : 0;
        const cumPct = total > 0 ? (cumul / total) * 100 : 0;
        return (
          <View key={item.titulo} style={styles.tableRow}>
            <Text style={styles.tableName} numberOfLines={1}>
              {item.titulo}
            </Text>
            <Text style={styles.tableVal}>{formatMoney(item.valor)}</Text>
            <Text style={styles.tablePct}>{pct.toFixed(1)}%</Text>
            <Text style={styles.tablePct}>Acum {cumPct.toFixed(1)}%</Text>
          </View>
        );
      })}
      {items.length === 0 ? <Text style={styles.empty}>Sem vendas no período.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  toolbar: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" },
  toolbarActions: { flexDirection: "row", gap: 8 },
  rolePill: {
    borderWidth: 1,
    borderColor: "#2563eb",
    backgroundColor: "#0f1f47",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    justifyContent: "center",
  },
  rolePillText: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  toolButton: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolButtonAccent: { borderColor: "#22c55e", backgroundColor: "#22c55e" },
  toolButtonWarn: { borderColor: "#38bdf8", backgroundColor: "#082f49" },
  toolButtonDisabled: { opacity: 0.45 },
  toolButtonText: { color: "#cbd5e1", fontSize: 12, fontWeight: "800" },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  periodBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  periodBtnActive: { borderColor: "#22c55e", backgroundColor: "#22c55e" },
  periodText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  periodTextActive: { color: "#022c22" },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  presetBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetBtnActive: { borderColor: "#38bdf8", backgroundColor: "#082f49" },
  presetText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  presetTextActive: { color: "#7dd3fc" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpiCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
  },
  kpiCardActive: { borderColor: "#38bdf8", backgroundColor: "#0b1a2b" },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontWeight: "900", fontSize: 18 },
  narrativeLine: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
    width: "100%",
    flexShrink: 1,
  },
  drillLine: { color: "#e2e8f0", fontWeight: "700", fontSize: 13, marginBottom: 6 },
  sectionHeader: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 2,
  },
  layoutHint: { color: "#94a3b8", fontWeight: "700", fontSize: 11, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10, alignItems: "stretch" },
  gridSingle: { flexDirection: "column", flexWrap: "nowrap" },
  card: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 360,
    minWidth: 0,
    maxWidth: "100%",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardSingle: { flexBasis: "100%", width: "100%" },
  cardTitle: { color: "#e2e8f0", fontSize: 15, fontWeight: "900", marginBottom: 10 },
  bigScore: { fontWeight: "900", fontSize: 28 },
  lineWrap: { flexDirection: "row", alignItems: "flex-end", gap: 4, minHeight: 150 },
  lineCol: { flex: 1, alignItems: "center" },
  lineTrack: {
    width: "100%",
    maxWidth: 18,
    height: 130,
    backgroundColor: "#111827",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  lineBar: { width: "100%", backgroundColor: "#38bdf8", borderRadius: 4 },
  avgMark: {
    position: "absolute",
    left: 0,
    width: "100%",
    height: 2,
    backgroundColor: "#facc15",
  },
  axisLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  metaText: { color: "#cbd5e1", fontWeight: "700", fontSize: 12 },
  metaSubText: { color: "#64748b", fontWeight: "700", fontSize: 11, marginTop: 4 },
  track: {
    marginTop: 4,
    height: 8,
    backgroundColor: "#111827",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },
  dot: { width: 9, height: 9, borderRadius: 999 },
  weekWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, minHeight: 150 },
  weekCol: { flex: 1, alignItems: "center" },
  weekTrack: {
    width: 18,
    height: 125,
    backgroundColor: "#111827",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  weekBar: { width: "100%", backgroundColor: "#a78bfa" },
  gaugeWrap: { gap: 10, paddingTop: 6 },
  gaugeTrack: {
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  gaugeFill: { height: "100%", borderRadius: 999 },
  gaugeValue: { fontWeight: "900", fontSize: 20 },
  heatRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heatCol: { flex: 1, minWidth: 120, alignItems: "center" },
  heatCell: {
    width: "100%",
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  heatVal: { color: "#cbd5e1", fontWeight: "800", fontSize: 11, marginTop: 3 },
  forecastWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, minHeight: 170 },
  forecastCol: { flex: 1, alignItems: "center" },
  forecastTrack: {
    width: "100%",
    maxWidth: 28,
    height: 130,
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 8,
    backgroundColor: "#0f172a",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  forecastP90: {
    width: "100%",
    backgroundColor: "rgba(56,189,248,0.35)",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  forecastP50: { width: "100%", backgroundColor: "#38bdf8", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  areaWrap: { flexDirection: "row", alignItems: "flex-end", gap: 4, minHeight: 120 },
  areaCol: { flex: 1 },
  areaTrack: {
    height: 90,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0f172a",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  areaFill: { width: "100%", backgroundColor: "rgba(34,197,94,0.55)" },
  snakeWrap: { flexDirection: "row", alignItems: "flex-end", gap: 5, minHeight: 135 },
  snakeCol: { flex: 1, alignItems: "center" },
  snakeTrack: {
    width: "100%",
    height: 95,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#334155",
    position: "relative",
  },
  snakeDot: {
    position: "absolute",
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#f97316",
  },
  axesChart: {
    height: 130,
    position: "relative",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    backgroundColor: "#0f172a",
    paddingLeft: 22,
    paddingBottom: 22,
  },
  yAxis: { position: "absolute", left: 18, top: 8, bottom: 18, width: 1, backgroundColor: "#64748b" },
  xAxis: { position: "absolute", left: 18, right: 8, bottom: 18, height: 1, backgroundColor: "#64748b" },
  axesPointsRow: { flexDirection: "row", alignItems: "flex-end", height: "100%", paddingTop: 6, paddingRight: 8 },
  axesPointCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", position: "relative", height: "100%" },
  axesPoint: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#38bdf8",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopColor: "#1f2937",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tableName: { flex: 1.4, color: "#e2e8f0", fontWeight: "700", fontSize: 12 },
  tableVal: { flex: 1, color: "#22c55e", fontWeight: "800", fontSize: 12, textAlign: "right" },
  tablePct: { flex: 0.9, color: "#94a3b8", fontWeight: "700", fontSize: 11, textAlign: "right" },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scenarioRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  scenarioBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scenarioBtnActive: { borderColor: "#38bdf8", backgroundColor: "#082f49" },
  scenarioText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  scenarioTextActive: { color: "#7dd3fc" },
  planBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1e3a8a",
    backgroundColor: "#0a1738",
    borderRadius: 10,
    padding: 10,
  },
  planLabel: { color: "#93c5fd", fontWeight: "700", fontSize: 12 },
  planValue: { color: "#dbeafe", fontWeight: "900", fontSize: 22, marginTop: 5 },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 10,
    marginTop: 10,
  },
  alertDot: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  alertTitle: { color: "#f8fafc", fontWeight: "800", fontSize: 13 },
  alertDetail: { color: "#94a3b8", fontWeight: "600", fontSize: 12, marginTop: 3 },
  metaForm: { marginBottom: 12, gap: 8 },
  metaFormRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaInputHalf: { flex: 1, minWidth: 180 },
  metaHint: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  metaSaveBtn: {
    borderWidth: 1,
    borderColor: "#22c55e",
    backgroundColor: "#14532d",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  metaSaveText: { color: "#dcfce7", fontWeight: "900", fontSize: 12 },
  metaRow: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 10, marginTop: 10 },
  metaTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 13, flex: 1, paddingRight: 8 },
  metaDesc: { color: "#94a3b8", fontWeight: "600", fontSize: 11, marginTop: 4 },
  metaStatusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#0f172a",
  },
  metaStatusText: { fontWeight: "900", fontSize: 10 },
  metaStatusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  metaStatusBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaStatusBtnActive: { borderColor: "#38bdf8", backgroundColor: "#0b2942" },
  metaStatusBtnText: { color: "#cbd5e1", fontWeight: "800", fontSize: 10 },
  auditRow: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 10, marginTop: 10 },
  auditTitle: { color: "#f8fafc", fontWeight: "800", fontSize: 13 },
  auditDate: { color: "#94a3b8", fontWeight: "700", fontSize: 11 },
  auditMeta: { color: "#94a3b8", fontWeight: "600", fontSize: 11, marginTop: 4 },
  empty: { color: "#94a3b8", textAlign: "center", fontWeight: "700", paddingVertical: 10 },
});
