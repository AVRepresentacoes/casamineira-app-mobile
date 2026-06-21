import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatMoney } from "@/lib/cart";
import { buildCsv, exportCsvFile } from "@/lib/exportCsv";
import { supabase } from "@/lib/supabase";
import { ensureCurrentUserTenantContext, getCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Pagamento = {
  valor_profissional?: number | null;
  valor_comissao?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at?: string | null;
};
type PedidoItem = { subtotal: number; quantidade: number; created_at: string };
type Lead = { etapa: string; valor_potencial?: number | null };

function isAprovado(p: Pagamento) {
  const s = String(p.status_pagamento || p.status_pagamentos || "").toLowerCase();
  return s === "aprovada" || s === "pago";
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PortalFornecedorRelatorios() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;

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

      const [pagRes, itemRes, leadRes] = await Promise.all([
        tenantId
          ? supabase.from("pagamentos").select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at").eq("profissional_id", uid).eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1200)
          : supabase.from("pagamentos").select("valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at").eq("profissional_id", uid).order("created_at", { ascending: false }).limit(1200),
        tenantId
          ? supabase.from("pedido_produtos_itens").select("subtotal, quantidade, created_at").eq("fornecedor_id", uid).eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1500)
          : supabase.from("pedido_produtos_itens").select("subtotal, quantidade, created_at").eq("fornecedor_id", uid).order("created_at", { ascending: false }).limit(1500),
        tenantId
          ? supabase.from("fornecedor_crm_leads").select("etapa, valor_potencial").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(800)
          : supabase.from("fornecedor_crm_leads").select("etapa, valor_potencial").order("created_at", { ascending: false }).limit(800),
      ]);

      setPagamentos((pagRes.data as Pagamento[]) || []);
      setItens((itemRes.data as PedidoItem[]) || []);
      setLeads((leadRes.data as Lead[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const summary = useMemo(() => {
    const aprovados = pagamentos.filter(isAprovado);
    const repasse = aprovados.reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const comissao = aprovados.reduce((acc, p) => acc + Number(p.valor_comissao || 0), 0);
    const vendas = itens.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
    const volume = itens.reduce((acc, i) => acc + Number(i.quantidade || 0), 0);
    const ticket = itens.length ? vendas / Math.max(1, new Set(itens.map((i) => monthKey(i.created_at))).size) : 0;
    const pipeline = leads.filter((l) => ["novo", "contato", "proposta"].includes(String(l.etapa || "")));
    const valorPipeline = pipeline.reduce((acc, l) => acc + Number(l.valor_potencial || 0), 0);

    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d.toISOString()));
    }

    const salesMap = new Map(months.map((m) => [m, 0]));
    for (const i of itens) {
      const k = monthKey(i.created_at);
      if (salesMap.has(k)) salesMap.set(k, Number(salesMap.get(k) || 0) + Number(i.subtotal || 0));
    }
    const series = months.map((m) => ({ key: m, label: m.slice(5), valor: Number(salesMap.get(m) || 0) }));
    const max = series.reduce((acc, s) => Math.max(acc, s.valor), 0);

    return { repasse, comissao, vendas, volume, ticket, valorPipeline, series, max };
  }, [pagamentos, itens, leads]);

  async function exportar() {
    try {
      setExporting(true);
      const csv = buildCsv(
        ["indicador", "valor"],
        [
          ["vendas_total", Number(summary.vendas).toFixed(2).replace(".", ",")],
          ["volume_itens", String(summary.volume)],
          ["repasse_aprovado", Number(summary.repasse).toFixed(2).replace(".", ",")],
          ["comissao_plataforma", Number(summary.comissao).toFixed(2).replace(".", ",")],
          ["valor_pipeline", Number(summary.valorPipeline).toFixed(2).replace(".", ",")],
        ]
      );
      await exportCsvFile(`relatorio_executivo_fornecedor_${Date.now()}.csv`, csv);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao exportar relatório.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PortalShell title="Relatórios" subtitle="Inteligência de negócio e desempenho operacional">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Painel executivo mensal</Text>
            <TouchableOpacity style={styles.exportBtn} onPress={() => void exportar()} disabled={exporting}>
              {exporting ? <ActivityIndicator size="small" color="#022c22" /> : <Text style={styles.exportText}>Exportar CSV</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.kpiRow}>
            <Kpi label="Vendas totais" value={formatMoney(summary.vendas)} color="#22c55e" />
            <Kpi label="Volume de itens" value={String(summary.volume)} color="#f8fafc" />
            <Kpi label="Repasse aprovado" value={formatMoney(summary.repasse)} color="#38bdf8" />
            <Kpi label="Comissão plataforma" value={formatMoney(summary.comissao)} color="#facc15" />
            <Kpi label="Ticket mensal médio" value={formatMoney(summary.ticket)} color="#cbd5e1" />
            <Kpi label="Pipeline comercial" value={formatMoney(summary.valorPipeline)} color="#22c55e" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evolução de vendas (6 meses)</Text>
            {summary.series.map((p) => (
              <View key={p.key} style={styles.barRow}>
                <Text style={styles.barLabel}>{p.label}</Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${summary.max > 0 ? Math.max(8, Math.round((p.valor / summary.max) * 100)) : 8}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{formatMoney(p.valor)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </PortalShell>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  headerRow: { marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  headerText: { color: "#e2e8f0", fontWeight: "900", fontSize: 15 },
  exportBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  exportText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 210, backgroundColor: "#0b1220", borderRadius: 12, borderWidth: 1, borderColor: "#1f2937", padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontSize: 18, fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, borderRadius: 14, padding: 12 },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  barLabel: { width: 42, color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  track: { flex: 1, height: 10, backgroundColor: "#111827", borderRadius: 999, overflow: "hidden", marginHorizontal: 8 },
  fill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 999 },
  barValue: { width: 120, textAlign: "right", color: "#e2e8f0", fontWeight: "800", fontSize: 12 },
});
