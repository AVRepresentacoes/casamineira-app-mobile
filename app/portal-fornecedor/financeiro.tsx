import PortalShell from "@/components/fornecedor-web/PortalShell";
import { buildCsv, exportCsvFile } from "@/lib/exportCsv";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Pagamento = {
  id?: string;
  valor_profissional?: number | null;
  valor_comissao?: number | null;
  status_pagamento?: string | null;
  status_pagamentos?: string | null;
  created_at?: string | null;
};

function status(item: Pagamento) {
  return String(item.status_pagamento || item.status_pagamentos || "").toLowerCase();
}

function isAprovado(item: Pagamento) {
  const s = status(item);
  return s === "aprovada" || s === "pago";
}

function isPendente(item: Pagamento) {
  const s = status(item);
  return s === "pendente" || s === "aguardar_pagamento";
}

function monthKey(dateIso: string) {
  const d = new Date(dateIso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PortalFornecedorFinanceiro() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return setPagamentos([]);

      const { data } = await supabase
        .from("pagamentos")
        .select("id, valor_profissional, valor_comissao, status_pagamento, status_pagamentos, created_at")
        .eq("profissional_id", uid)
        .order("created_at", { ascending: false })
        .limit(1000);
      setPagamentos((data as Pagamento[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pagamentos;
    return pagamentos.filter((p) => {
      const s = status(p);
      const id = String(p.id || "");
      return s.includes(term) || id.includes(term);
    });
  }, [pagamentos, q]);

  const data = useMemo(() => {
    const aprovado = filtered.filter(isAprovado);
    const pendente = filtered.filter(isPendente);
    const repasseAprovado = aprovado.reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const repassePendente = pendente.reduce((acc, p) => acc + Number(p.valor_profissional || 0), 0);
    const comissao = aprovado.reduce((acc, p) => acc + Number(p.valor_comissao || 0), 0);
    const aprovados = aprovado.length;
    const pendentes = pendente.length;

    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d.toISOString()));
    }
    const map = new Map(months.map((m) => [m, 0]));
    for (const p of aprovado) {
      const key = monthKey(String(p.created_at || new Date().toISOString()));
      if (map.has(key)) map.set(key, Number(map.get(key) || 0) + Number(p.valor_profissional || 0));
    }
    const series = months.map((m) => ({
      key: m,
      label: m.slice(5),
      valor: Number(map.get(m) || 0),
    }));
    const max = series.reduce((acc, s) => Math.max(acc, s.valor), 0);
    return { repasseAprovado, repassePendente, comissao, aprovados, pendentes, series, max };
  }, [filtered]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const current = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  async function exportarCsv() {
    if (!filtered.length) {
      Alert.alert("Sem dados", "Não há movimentações para exportar.");
      return;
    }
    try {
      setExporting(true);
      const csv = buildCsv(
        ["id", "status", "repasse_profissional", "comissao_plataforma", "created_at"],
        filtered.map((p) => [
          String(p.id || ""),
          status(p) || "indefinido",
          Number(p.valor_profissional || 0).toFixed(2).replace(".", ","),
          Number(p.valor_comissao || 0).toFixed(2).replace(".", ","),
          new Date(String(p.created_at || new Date().toISOString())).toLocaleString("pt-BR"),
        ])
      );
      await exportCsvFile(`financeiro_fornecedor_${Date.now()}.csv`, csv);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao exportar CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PortalShell
      title="Financeiro"
      subtitle="Controle avançado de repasse e comissão"
      headerRight={
        <TouchableOpacity style={styles.exportBtn} onPress={() => void exportarCsv()} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator size="small" color="#022c22" />
          ) : (
            <Ionicons name="download-outline" size={14} color="#022c22" />
          )}
          <Text style={styles.exportText}>Exportar CSV</Text>
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <>
          <View style={styles.filterCard}>
            <TextInput
              style={styles.input}
              placeholder="Buscar por ID ou status"
              placeholderTextColor="#64748b"
              value={q}
              onChangeText={(text) => {
                setQ(text);
                setPage(1);
              }}
            />
            <Text style={styles.countText}>{filtered.length} movimentação(ões)</Text>
          </View>

          <View style={styles.grid}>
            <Kpi label="Repasse aprovado" value={formatMoney(data.repasseAprovado)} color="#22c55e" />
            <Kpi label="Repasse pendente" value={formatMoney(data.repassePendente)} color="#facc15" />
            <Kpi label="Comissão plataforma" value={formatMoney(data.comissao)} color="#38bdf8" />
            <Kpi label="Pagamentos aprovados" value={String(data.aprovados)} color="#f8fafc" />
            <Kpi label="Pagamentos pendentes" value={String(data.pendentes)} color="#facc15" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolução mensal do repasse</Text>
            {data.series.map((s) => (
              <View key={s.key} style={styles.barRow}>
                <Text style={styles.barLabel}>{s.label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${data.max > 0 ? Math.max(8, Math.round((s.valor / data.max) * 100)) : 8}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{formatMoney(s.valor)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movimentações recentes</Text>
            {current.length === 0 ? (
              <Text style={styles.empty}>Nenhuma movimentação encontrada.</Text>
            ) : (
              current.map((p) => {
                const st = status(p);
                return (
                  <View key={String(p.id || p.created_at || Math.random())} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowId}>#{String(p.id || "").slice(0, 8) || "sem-id"}</Text>
                      <Text style={styles.rowMeta}>
                        {new Date(String(p.created_at || new Date().toISOString())).toLocaleString("pt-BR")}
                      </Text>
                    </View>
                    <View style={styles.values}>
                      <Text style={styles.repasse}>{formatMoney(Number(p.valor_profissional || 0))}</Text>
                      <Text style={styles.comissao}>Comissão {formatMoney(Number(p.valor_comissao || 0))}</Text>
                    </View>
                    <View style={[styles.badge, isAprovado(p) ? styles.badgeOk : isPendente(p) ? styles.badgeWarn : styles.badgeNeutral]}>
                      <Text style={styles.badgeText}>{st || "indefinido"}</Text>
                    </View>
                  </View>
                );
              })
            )}
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, pageSafe <= 1 ? styles.pageBtnDisabled : null]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
              >
                <Text style={styles.pageBtnText}>Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.pageLabel}>Página {pageSafe} de {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, pageSafe >= totalPages ? styles.pageBtnDisabled : null]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
              >
                <Text style={styles.pageBtnText}>Próxima</Text>
              </TouchableOpacity>
            </View>
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
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  exportText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  filterCard: {
    marginBottom: 10,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: "#f8fafc",
    fontWeight: "700",
  },
  countText: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8, justifyContent: "space-between" },
  kpi: { width: "24%", minWidth: 220, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 12, padding: 12 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { color: "#f8fafc", marginTop: 6, fontWeight: "900", fontSize: 18 },
  section: { marginTop: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 12 },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  empty: { color: "#94a3b8", fontWeight: "700", textAlign: "center", paddingVertical: 12 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  barLabel: { width: 42, color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  barTrack: { flex: 1, height: 10, backgroundColor: "#111827", borderRadius: 999, overflow: "hidden", marginHorizontal: 8 },
  barFill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 999 },
  barValue: { width: 120, textAlign: "right", color: "#e2e8f0", fontWeight: "800", fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  rowId: { color: "#f8fafc", fontWeight: "900", fontSize: 13 },
  rowMeta: { color: "#94a3b8", fontWeight: "700", fontSize: 11, marginTop: 2 },
  values: { alignItems: "flex-end" },
  repasse: { color: "#22c55e", fontWeight: "900", fontSize: 13 },
  comissao: { color: "#94a3b8", fontWeight: "700", fontSize: 11, marginTop: 2 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeOk: { backgroundColor: "rgba(34,197,94,0.14)", borderColor: "rgba(34,197,94,0.35)" },
  badgeWarn: { backgroundColor: "rgba(250,204,21,0.14)", borderColor: "rgba(250,204,21,0.35)" },
  badgeNeutral: { backgroundColor: "rgba(148,163,184,0.14)", borderColor: "rgba(148,163,184,0.35)" },
  badgeText: { color: "#e2e8f0", fontWeight: "800", fontSize: 11, textTransform: "capitalize" },
  paginationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  pageBtn: { backgroundColor: "#172036", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#334155" },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { color: "#e2e8f0", fontWeight: "800", fontSize: 12 },
  pageLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
});
