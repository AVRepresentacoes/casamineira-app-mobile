import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CopilotSnapshot = {
  receber_30: number;
  pagar_30: number;
  saldo_30: number;
  risco_medio: number;
  risco_alto_qtd: number;
  alertas_abertos: number;
  conciliacoes_pendentes: number;
  pipeline_valor: number;
};

type Benchmark = {
  vendas_30: number;
  media_mercado_30: number;
  indice_vendas: number;
  ticket_medio: number;
  ticket_medio_mercado: number;
  indice_ticket: number;
};

type Alerta = {
  id: string;
  tipo: string;
  severidade: "baixa" | "media" | "alta" | "critica";
  titulo: string;
  descricao: string;
  status: "aberto" | "resolvido" | "ignorado";
};

function severityColor(level: Alerta["severidade"]) {
  if (level === "critica") return "#ef4444";
  if (level === "alta") return "#f97316";
  if (level === "media") return "#facc15";
  return "#22c55e";
}

export default function PortalFornecedorCopilot() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<CopilotSnapshot | null>(null);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [snapRes, benchRes, alertRes] = await Promise.all([
        supabase.rpc("get_fornecedor_copilot_snapshot"),
        supabase.rpc("get_fornecedor_benchmark_snapshot"),
        supabase
          .from("fornecedor_alertas_inteligentes")
          .select("id, tipo, severidade, titulo, descricao, status")
          .eq("status", "aberto")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const snap = ((snapRes.data as CopilotSnapshot[] | null) || [])[0] || null;
      const bench = ((benchRes.data as Benchmark[] | null) || [])[0] || null;
      setSnapshot(snap);
      setBenchmark(bench);
      setAlertas((alertRes.data as Alerta[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const recomendacoes = useMemo(() => {
    const recs: string[] = [];
    if (!snapshot || !benchmark) return recs;

    if (snapshot.risco_medio >= 70 || snapshot.risco_alto_qtd > 0) {
      recs.push("Risco elevado detectado. Priorize revisão de transações e contas atrasadas.");
    }
    if (snapshot.saldo_30 < 0) {
      recs.push("Fluxo previsto negativo em 30 dias. Reduza despesas e acelere recebimentos.");
    }
    if (snapshot.conciliacoes_pendentes > 10) {
      recs.push("Muitas conciliações pendentes. Rode o autopilot e execute conciliação diária.");
    }
    if (benchmark.indice_vendas < 1) {
      recs.push("Vendas abaixo da média do mercado. Ative campanha e ajuste mix de catálogo.");
    }
    if (benchmark.indice_ticket < 1) {
      recs.push("Ticket médio abaixo do benchmark. Crie combos e política de frete mínimo.");
    }
    if (recs.length === 0) {
      recs.push("Operação saudável. Mantenha automações ativas e monitore crescimento semanal.");
    }
    return recs;
  }, [snapshot, benchmark]);

  async function gerarAlertas() {
    try {
      setBusy(true);
      const { error } = await supabase.rpc("gerar_alertas_inteligentes_fornecedor");
      if (error) throw error;
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao gerar alertas.");
    } finally {
      setBusy(false);
    }
  }

  async function rodarAutopilot() {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc("run_fornecedor_autopilot");
      if (error) throw error;
      await carregar();
      Alert.alert("Autopilot executado", JSON.stringify(data || {}, null, 2));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao executar autopilot.");
    } finally {
      setBusy(false);
    }
  }

  async function resolverAlerta(id: string) {
    try {
      const { error } = await supabase.from("fornecedor_alertas_inteligentes").update({ status: "resolvido" }).eq("id", id);
      if (error) throw error;
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao resolver alerta.");
    }
  }

  return (
    <PortalShell title="Copilot IA" subtitle="Comando inteligente da operação em tempo real">
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => void gerarAlertas()} disabled={busy}>
              <Text style={styles.actionText}>Gerar alertas inteligentes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => void rodarAutopilot()} disabled={busy}>
              <Text style={styles.actionText}>Executar Autopilot</Text>
            </TouchableOpacity>
          </View>

          {snapshot ? (
            <View style={styles.kpiRow}>
              <Kpi label="Receber 30d" value={formatMoney(snapshot.receber_30 || 0)} color="#22c55e" />
              <Kpi label="Pagar 30d" value={formatMoney(snapshot.pagar_30 || 0)} color="#ef4444" />
              <Kpi label="Saldo 30d" value={formatMoney(snapshot.saldo_30 || 0)} color={(snapshot.saldo_30 || 0) >= 0 ? "#22c55e" : "#facc15"} />
              <Kpi label="Pipeline CRM" value={formatMoney(snapshot.pipeline_valor || 0)} color="#38bdf8" />
              <Kpi label="Risco médio" value={`${Number(snapshot.risco_medio || 0).toFixed(1)} / 100`} color="#f97316" />
              <Kpi label="Alertas abertos" value={String(snapshot.alertas_abertos || 0)} color="#facc15" />
            </View>
          ) : null}

          {benchmark ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Benchmark de mercado (anonimizado)</Text>
              <Text style={styles.meta}>Vendas 30d: {formatMoney(benchmark.vendas_30 || 0)} vs média {formatMoney(benchmark.media_mercado_30 || 0)} ({((benchmark.indice_vendas || 0) * 100).toFixed(0)}%)</Text>
              <Text style={styles.meta}>Ticket médio: {formatMoney(benchmark.ticket_medio || 0)} vs mercado {formatMoney(benchmark.ticket_medio_mercado || 0)} ({((benchmark.indice_ticket || 0) * 100).toFixed(0)}%)</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recomendações automáticas</Text>
            {recomendacoes.map((rec, idx) => (
              <View key={idx} style={styles.recommendation}>
                <Text style={styles.recBullet}>•</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Command Center de alertas</Text>
            {alertas.length === 0 ? (
              <Text style={styles.empty}>Sem alertas abertos no momento.</Text>
            ) : (
              alertas.map((a) => (
                <View key={a.id} style={styles.alertRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{a.titulo}</Text>
                    <Text style={styles.alertDesc}>{a.descricao}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={[styles.level, { color: severityColor(a.severidade) }]}>{a.severidade.toUpperCase()}</Text>
                    <TouchableOpacity style={styles.resolveBtn} onPress={() => void resolverAlerta(a.id)}>
                      <Text style={styles.resolveText}>Resolver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
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
  actionsRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  actionBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 200, backgroundColor: "#0b1220", borderRadius: 12, borderWidth: 1, borderColor: "#1f2937", padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontSize: 18, fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  meta: { color: "#cbd5e1", fontWeight: "700", marginBottom: 5 },
  recommendation: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recBullet: { color: "#22c55e", fontWeight: "900" },
  recText: { color: "#cbd5e1", flex: 1, fontWeight: "700" },
  empty: { color: "#94a3b8", fontWeight: "700", textAlign: "center", paddingVertical: 10 },
  alertRow: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10 },
  alertTitle: { color: "#f8fafc", fontWeight: "900" },
  alertDesc: { color: "#94a3b8", fontWeight: "700", marginTop: 3, fontSize: 12 },
  level: { fontWeight: "900", fontSize: 11 },
  resolveBtn: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  resolveText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
});
