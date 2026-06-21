import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/cart";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ItemVenda = {
  pedido_id: string;
  cliente_id: string;
  titulo: string;
  quantidade: number;
  subtotal: number;
  created_at: string;
};

type Pedido = {
  id: string;
  status?: string | null;
  status_logistica?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Pagamento = {
  id: string;
  pedido_id?: string | null;
  valor_total?: number | null;
  valor_profissional?: number | null;
  valor_comissao?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at?: string | null;
};

type Produto = {
  id: string;
  ativo: boolean;
  estoque: number;
  preco: number;
};

type VendaResumo = {
  pedidoId: string;
  clienteId: string;
  clienteNome: string;
  total: number;
  itens: number;
  statusLogistica: string;
  statusPedido: string;
  createdAt: string;
};

type PeriodFilter = "7d" | "30d" | "90d" | "12m";

function normalizarStatusPagamento(p: Pagamento) {
  return String(p.status_pagamento || p.status_pagamentos || "").toLowerCase();
}

function isPagamentoAprovado(p: Pagamento) {
  const s = normalizarStatusPagamento(p);
  return s === "aprovada" || s === "pago";
}

function isPagamentoPendente(p: Pagamento) {
  const s = normalizarStatusPagamento(p);
  return s === "pendente" || s === "aguardar_pagamento";
}

function monthKey(dateIso: string) {
  const d = new Date(dateIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function statusLogisticaCor(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "entregue") return "#22c55e";
  if (s === "enviado") return "#38bdf8";
  if (s === "preparando") return "#facc15";
  if (s === "cancelado") return "#ef4444";
  return "#94a3b8";
}

function statusLogisticaLabel(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "entregue") return "Entregue";
  if (s === "enviado") return "Enviado";
  if (s === "preparando") return "Preparando";
  if (s === "cancelado") return "Cancelado";
  return "Novo";
}

function getStartDate(period: PeriodFilter) {
  const now = new Date();
  if (period === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (period === "90d") {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
}

function periodLabel(period: PeriodFilter) {
  if (period === "7d") return "Últimos 7 dias";
  if (period === "30d") return "Últimos 30 dias";
  if (period === "90d") return "Últimos 90 dias";
  return "Últimos 12 meses";
}

export default function FornecedorFinanceiro() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [exporting, setExporting] = useState(false);

  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [pedidosMap, setPedidosMap] = useState<Map<string, Pedido>>(new Map());
  const [clientesMap, setClientesMap] = useState<Map<string, string>>(new Map());
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uid = session?.user?.id;
      if (!uid) {
        setItens([]);
        setPagamentos([]);
        setProdutos([]);
        setPedidosMap(new Map());
        setClientesMap(new Map());
        return;
      }

      let tenantId: string | null = null;
      try {
        tenantId = await ensureCurrentUserTenantContext();
      } catch {
        try {
          tenantId = await getCurrentTenantId();
        } catch {
          tenantId = null;
        }
      }

      const [itensRes, pagamentosRes, produtosRes] = await Promise.all([
        tenantId
          ? supabase
              .from("pedido_produtos_itens")
              .select("pedido_id, cliente_id, titulo, quantidade, subtotal, created_at")
              .eq("fornecedor_id", uid)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(1500)
          : supabase
              .from("pedido_produtos_itens")
              .select("pedido_id, cliente_id, titulo, quantidade, subtotal, created_at")
              .eq("fornecedor_id", uid)
              .order("created_at", { ascending: false })
              .limit(1500),
        tenantId
          ? supabase
              .from("pagamentos")
              .select(
                "id, pedido_id, valor_total, valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at"
              )
              .eq("profissional_id", uid)
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(600)
          : supabase
              .from("pagamentos")
              .select(
                "id, pedido_id, valor_total, valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at"
              )
              .eq("profissional_id", uid)
              .order("created_at", { ascending: false })
              .limit(600),
        tenantId
          ? supabase
              .from("produtos_fornecedor")
              .select("id, ativo, estoque, preco")
              .eq("fornecedor_id", uid)
              .eq("tenant_id", tenantId)
          : supabase
              .from("produtos_fornecedor")
              .select("id, ativo, estoque, preco")
              .eq("fornecedor_id", uid),
      ]);

      const itensRows = (itensRes.data as ItemVenda[]) || [];
      const pagamentoRows = (pagamentosRes.data as Pagamento[]) || [];
      const produtoRows = (produtosRes.data as Produto[]) || [];

      setItens(itensRows);
      setPagamentos(pagamentoRows);
      setProdutos(produtoRows);

      const pedidoIds = [...new Set(itensRows.map((row) => String(row.pedido_id || "")))].filter(Boolean);
      const clienteIds = [...new Set(itensRows.map((row) => String(row.cliente_id || "")))].filter(Boolean);

      if (pedidoIds.length > 0 || clienteIds.length > 0) {
        const [pedidosRes, clientesRes] = await Promise.all([
          pedidoIds.length
            ? tenantId
              ? supabase
                  .from("pedidos")
                  .select("id, status, status_logistica, created_at, updated_at")
                  .in("id", pedidoIds)
                  .eq("tenant_id", tenantId)
              : supabase
                  .from("pedidos")
                  .select("id, status, status_logistica, created_at, updated_at")
                  .in("id", pedidoIds)
            : Promise.resolve({ data: [] as any[], error: null }),
          clienteIds.length
            ? tenantId
              ? supabase.from("profiles").select("id, name").in("id", clienteIds).eq("tenant_id", tenantId)
              : supabase.from("profiles").select("id, name").in("id", clienteIds)
            : Promise.resolve({ data: [] as any[], error: null }),
        ]);

        const nextPedidosMap = new Map<string, Pedido>();
        for (const row of (pedidosRes.data as Pedido[]) || []) {
          nextPedidosMap.set(String(row.id), row);
        }

        const nextClientesMap = new Map<string, string>();
        for (const row of (clientesRes.data as any[]) || []) {
          nextClientesMap.set(String(row.id), String(row.name || "Cliente"));
        }

        setPedidosMap(nextPedidosMap);
        setClientesMap(nextClientesMap);
      } else {
        setPedidosMap(new Map());
        setClientesMap(new Map());
      }

      setUpdatedAt(new Date().toLocaleString("pt-BR"));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const vendas = useMemo(() => {
    const grouped = new Map<string, VendaResumo>();
    for (const item of itens) {
      const pedidoId = String(item.pedido_id || "");
      if (!pedidoId) continue;
      const pedido = pedidosMap.get(pedidoId);
      const current = grouped.get(pedidoId);
      const subtotal = Number(item.subtotal || 0);
      const quantidade = Number(item.quantidade || 0);

      if (!current) {
        grouped.set(pedidoId, {
          pedidoId,
          clienteId: String(item.cliente_id || ""),
          clienteNome: clientesMap.get(String(item.cliente_id || "")) || "Cliente",
          total: subtotal,
          itens: quantidade,
          statusLogistica: String(pedido?.status_logistica || "novo"),
          statusPedido: String(pedido?.status || "aceita"),
          createdAt: String(item.created_at || pedido?.created_at || new Date().toISOString()),
        });
      } else {
        current.total += subtotal;
        current.itens += quantidade;
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [itens, pedidosMap, clientesMap]);

  const vendasFiltradas = useMemo(() => {
    const start = getStartDate(period).getTime();
    return vendas.filter((venda) => new Date(venda.createdAt).getTime() >= start);
  }, [vendas, period]);

  const pagamentosFiltrados = useMemo(() => {
    const start = getStartDate(period).getTime();
    return pagamentos.filter((pagamento) => {
      const date = pagamento.created_at ? new Date(pagamento.created_at).getTime() : 0;
      return date >= start;
    });
  }, [pagamentos, period]);

  const kpis = useMemo(() => {
    const totalPedidos = vendasFiltradas.length;
    const faturamentoBruto = vendasFiltradas.reduce((acc, venda) => acc + venda.total, 0);
    const ticketMedio = totalPedidos ? faturamentoBruto / totalPedidos : 0;
    const itensVendidos = vendasFiltradas.reduce((acc, venda) => acc + venda.itens, 0);
    const pedidosEntregues = vendasFiltradas.filter((venda) => venda.statusLogistica === "entregue").length;
    const pedidosEmAndamento = vendasFiltradas.filter((venda) =>
      ["novo", "preparando", "enviado"].includes(venda.statusLogistica)
    ).length;

    const repasseAprovado = pagamentosFiltrados
      .filter((p) => isPagamentoAprovado(p))
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const repassePendente = pagamentosFiltrados
      .filter((p) => isPagamentoPendente(p))
      .reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const comissaoPlataforma = pagamentosFiltrados
      .filter((p) => isPagamentoAprovado(p))
      .reduce((acc, p) => acc + Number(p.valor_comissao || 0), 0);

    const estimadoRepasse = faturamentoBruto * 0.8;
    const estimadoComissao = faturamentoBruto * 0.2;

    const produtosAtivos = produtos.filter((p) => Boolean(p.ativo)).length;
    const produtosInativos = produtos.length - produtosAtivos;
    const estoqueTotal = produtos.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
    const valorEstoque = produtos.reduce(
      (acc, p) => acc + Number(p.estoque || 0) * Number(p.preco || 0),
      0
    );

    return {
      totalPedidos,
      faturamentoBruto,
      ticketMedio,
      itensVendidos,
      pedidosEntregues,
      pedidosEmAndamento,
      repasseAprovado,
      repassePendente,
      comissaoPlataforma,
      estimadoRepasse,
      estimadoComissao,
      produtosAtivos,
      produtosInativos,
      estoqueTotal,
      valorEstoque,
    };
  }, [vendasFiltradas, pagamentosFiltrados, produtos]);

  const serieMensal = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d.toISOString()));
    }

    const map = new Map<string, number>();
    for (const key of months) map.set(key, 0);

    for (const venda of vendasFiltradas) {
      const key = monthKey(venda.createdAt);
      if (map.has(key)) {
        map.set(key, Number(map.get(key) || 0) + Number(venda.total || 0));
      }
    }

    const rows = months.map((key) => ({
      key,
      label: monthLabel(key),
      valor: Number(map.get(key) || 0),
    }));

    const max = rows.reduce((acc, row) => Math.max(acc, row.valor), 0);
    return rows.map((row) => ({
      ...row,
      percentual: max > 0 ? Math.max(8, Math.round((row.valor / max) * 100)) : 8,
    }));
  }, [vendasFiltradas]);

  const statusRows = useMemo(() => {
    const map = new Map<string, number>([
      ["novo", 0],
      ["preparando", 0],
      ["enviado", 0],
      ["entregue", 0],
      ["cancelado", 0],
    ]);
    for (const venda of vendasFiltradas) {
      const key = String(venda.statusLogistica || "novo");
      map.set(key, Number(map.get(key) || 0) + 1);
    }
    const total = vendasFiltradas.length || 1;
    return Array.from(map.entries()).map(([status, valor]) => ({
      status,
      valor,
      percentual: Math.round((valor / total) * 100),
    }));
  }, [vendasFiltradas]);

  async function exportarCsv() {
    if (vendasFiltradas.length === 0) {
      Alert.alert("Sem dados", "Não há vendas no período selecionado para exportar.");
      return;
    }

    try {
      setExporting(true);
      const linhas = [
        "pedido_id;cliente;itens;total;status_logistica;data",
        ...vendasFiltradas.map((venda) =>
          [
            venda.pedidoId,
            venda.clienteNome.replace(/;/g, ","),
            venda.itens,
            Number(venda.total || 0).toFixed(2).replace(".", ","),
            statusLogisticaLabel(venda.statusLogistica),
            new Date(venda.createdAt).toLocaleDateString("pt-BR"),
          ].join(";")
        ),
      ];

      const csv = linhas.join("\n");
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!baseDir) {
        throw new Error("Diretório de arquivo não disponível no dispositivo.");
      }

      const fileName = `financeiro_fornecedor_${period}_${Date.now()}.csv`;
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Share.share({
        title: fileName,
        message: `Relatório financeiro (${periodLabel(period)})`,
        url: fileUri,
      });
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível exportar CSV.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Financeiro fornecedor</Text>
          <Text style={styles.subtitle}>Gestão completa de vendas, repasses e logística</Text>
          <Text style={styles.updated}>Atualizado em {updatedAt || "agora"}</Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="stats-chart" size={24} color="#22c55e" />
        </View>
      </View>

      <View style={styles.highlightCard}>
        <Text style={styles.highlightLabel}>Faturamento bruto (marketplace)</Text>
        <Text style={styles.highlightValue}>{formatMoney(kpis.faturamentoBruto)}</Text>
        <Text style={styles.highlightPeriod}>{periodLabel(period)}</Text>
        <View style={styles.highlightRow}>
          <Text style={styles.highlightMeta}>Repasse aprovado: {formatMoney(kpis.repasseAprovado)}</Text>
          <Text style={styles.highlightMeta}>Pendente: {formatMoney(kpis.repassePendente)}</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.chipsRow}>
          {[
            { id: "7d", label: "7d" },
            { id: "30d", label: "30d" },
            { id: "90d", label: "90d" },
            { id: "12m", label: "12m" },
          ].map((chip) => {
            const active = period === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chip, active ? styles.chipActive : null]}
                onPress={() => setPeriod(chip.id as PeriodFilter)}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => void exportarCsv()}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#022c22" />
          ) : (
            <>
              <Ionicons name="download-outline" size={14} color="#022c22" />
              <Text style={styles.exportText}>CSV</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <MetricCard label="Pedidos" value={String(kpis.totalPedidos)} color="#f8fafc" icon="receipt-outline" />
        <MetricCard label="Itens vendidos" value={String(kpis.itensVendidos)} color="#f8fafc" icon="cube-outline" />
        <MetricCard label="Ticket médio" value={formatMoney(kpis.ticketMedio)} color="#38bdf8" icon="bar-chart-outline" />
        <MetricCard label="Entregues" value={String(kpis.pedidosEntregues)} color="#22c55e" icon="checkmark-done-outline" />
        <MetricCard label="Em andamento" value={String(kpis.pedidosEmAndamento)} color="#facc15" icon="time-outline" />
        <MetricCard
          label="Comissão plataforma"
          value={formatMoney(kpis.comissaoPlataforma || kpis.estimadoComissao)}
          color="#facc15"
          icon="cash-outline"
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Evolução mensal de vendas</Text>
        {serieMensal.map((row) => (
          <View key={row.key} style={styles.barRow}>
            <Text style={styles.barLabel}>{row.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${row.percentual}%` }]} />
            </View>
            <Text style={styles.barValue}>{formatMoney(row.valor)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Distribuição logística</Text>
        {statusRows.map((row) => (
          <View key={row.status} style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: statusLogisticaCor(row.status) }]} />
              <Text style={styles.statusLabel}>{statusLogisticaLabel(row.status)}</Text>
            </View>
            <Text style={styles.statusValue}>
              {row.valor} ({row.percentual}%)
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Estoque e catálogo</Text>
        <View style={styles.resumeLine}>
          <Text style={styles.resumeLabel}>Produtos ativos</Text>
          <Text style={styles.resumeValue}>{kpis.produtosAtivos}</Text>
        </View>
        <View style={styles.resumeLine}>
          <Text style={styles.resumeLabel}>Produtos inativos</Text>
          <Text style={styles.resumeValue}>{kpis.produtosInativos}</Text>
        </View>
        <View style={styles.resumeLine}>
          <Text style={styles.resumeLabel}>Unidades em estoque</Text>
          <Text style={styles.resumeValue}>{kpis.estoqueTotal}</Text>
        </View>
        <View style={styles.resumeLine}>
          <Text style={styles.resumeLabel}>Valor estimado em estoque</Text>
          <Text style={[styles.resumeValue, { color: "#38bdf8" }]}>{formatMoney(kpis.valorEstoque)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Últimas vendas</Text>
        {vendasFiltradas.length === 0 ? (
          <Text style={styles.empty}>Nenhuma venda encontrada ainda.</Text>
        ) : (
          vendasFiltradas.slice(0, 8).map((venda) => (
            <View key={venda.pedidoId} style={styles.saleItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.saleTitle}>Pedido #{venda.pedidoId.slice(0, 8)}</Text>
                <Text style={styles.saleMeta}>
                  {venda.clienteNome} • {venda.itens} item(ns)
                </Text>
                <Text style={styles.saleDate}>
                  {new Date(venda.createdAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Text style={styles.saleAmount}>{formatMoney(venda.total)}</Text>
                <View
                  style={[
                    styles.saleBadge,
                    { borderColor: statusLogisticaCor(venda.statusLogistica), backgroundColor: "#0a172a" },
                  ]}
                >
                  <Text style={[styles.saleBadgeText, { color: statusLogisticaCor(venda.statusLogistica) }]}>
                    {statusLogisticaLabel(venda.statusLogistica)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(fornecedor)/pedidos")}>
          <Ionicons name="receipt-outline" size={16} color="#022c22" />
          <Text style={styles.actionText}>Gerenciar pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => router.push("/(fornecedor)/produtos")}>
          <Ionicons name="cube-outline" size={16} color="#bae6fd" />
          <Text style={styles.actionSecondaryText}>Gerenciar produtos</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={14} color="#94a3b8" />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.metricValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#0a172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  title: {
    color: "#22c55e",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  updated: {
    color: "#64748b",
    marginTop: 6,
    fontSize: 12,
  },
  highlightCard: {
    marginTop: 12,
    backgroundColor: "#071b13",
    borderColor: "#166534",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  highlightLabel: {
    color: "#86efac",
    fontSize: 12,
    fontWeight: "700",
  },
  highlightValue: {
    color: "#f8fafc",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 3,
  },
  highlightRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  highlightMeta: {
    color: "#bbf7d0",
    fontSize: 12,
    fontWeight: "700",
  },
  highlightPeriod: {
    color: "#86efac",
    fontWeight: "800",
    marginTop: 4,
    fontSize: 12,
  },
  toolbar: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0b1220",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  chipText: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: 11,
  },
  chipTextActive: {
    color: "#022c22",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#22c55e",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  exportText: {
    color: "#022c22",
    fontWeight: "900",
    fontSize: 11,
  },
  kpiGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  metricCard: {
    width: "48.8%",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    minHeight: 82,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  sectionCard: {
    marginTop: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  barLabel: {
    width: 36,
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 12,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#111827",
    marginHorizontal: 8,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 999,
  },
  barValue: {
    width: 90,
    textAlign: "right",
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 11,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 13,
  },
  statusValue: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 12,
  },
  resumeLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resumeLabel: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  resumeValue: {
    color: "#e2e8f0",
    fontWeight: "900",
  },
  empty: {
    color: "#94a3b8",
  },
  saleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  saleTitle: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  saleMeta: {
    color: "#94a3b8",
    marginTop: 3,
    fontSize: 12,
  },
  saleDate: {
    color: "#64748b",
    marginTop: 2,
    fontSize: 11,
  },
  saleAmount: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 13,
  },
  saleBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#22c55e",
    borderRadius: 11,
    paddingVertical: 12,
  },
  actionText: {
    color: "#022c22",
    fontWeight: "900",
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#082f49",
    borderRadius: 11,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#0e7490",
  },
  actionSecondaryText: {
    color: "#bae6fd",
    fontWeight: "900",
  },
});
