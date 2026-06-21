import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Tipo = "pagar" | "receber";
type Status = "aberto" | "pago" | "atrasado" | "cancelado";
type Lancamento = {
  id: string;
  tipo: Tipo;
  categoria?: string | null;
  descricao: string;
  valor: number;
  vencimento?: string | null;
  status: Status;
  pago_em?: string | null;
};

export default function PortalFornecedorFinanceiroAvancado() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo>("receber");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("fornecedor_financeiro_lancamentos")
        .select("id, tipo, categoria, descricao, valor, vencimento, status, pago_em")
        .order("created_at", { ascending: false })
        .limit(600);
      setLancamentos((data as Lancamento[]) || []);
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
    const receberAberto = lancamentos.filter((l) => l.tipo === "receber" && l.status === "aberto").reduce((a, l) => a + Number(l.valor || 0), 0);
    const pagarAberto = lancamentos.filter((l) => l.tipo === "pagar" && l.status === "aberto").reduce((a, l) => a + Number(l.valor || 0), 0);
    const pagos = lancamentos.filter((l) => l.status === "pago").reduce((a, l) => a + Number(l.valor || 0), 0);
    const resultado = receberAberto - pagarAberto;
    return { receberAberto, pagarAberto, pagos, resultado };
  }, [lancamentos]);

  async function criarLancamento() {
    if (!descricao.trim()) return Alert.alert("Atenção", "Informe a descrição.");
    const valorNum = parseCurrencyInputBR(valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0) return Alert.alert("Atenção", "Valor inválido.");

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");
      const { data: tenantId, error: tenantError } = await supabase.rpc("current_tenant_id");
      if (tenantError || !tenantId) throw new Error("Tenant ativo não encontrado.");

      const { error } = await supabase.from("fornecedor_financeiro_lancamentos").insert({
        tenant_id: tenantId,
        fornecedor_id: uid,
        tipo,
        categoria: categoria.trim() || null,
        descricao: descricao.trim(),
        valor: valorNum,
        vencimento: vencimento.trim() || null,
        status: "aberto",
      });
      if (error) throw error;
      setCategoria("");
      setDescricao("");
      setValor("");
      setVencimento("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao salvar lançamento.");
    } finally {
      setSaving(false);
    }
  }

  async function marcarPago(item: Lancamento) {
    try {
      setBusyId(item.id);
      const { error } = await supabase.from("fornecedor_financeiro_lancamentos").update({ status: "pago", pago_em: new Date().toISOString().slice(0, 10) }).eq("id", item.id);
      if (error) throw error;
      setLancamentos((prev) => prev.map((l) => (l.id === item.id ? { ...l, status: "pago", pago_em: new Date().toISOString().slice(0, 10) } : l)));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível marcar como pago.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PortalShell title="Contas a Pagar/Receber" subtitle="Gestão financeira operacional avançada">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Receber em aberto" value={formatMoney(summary.receberAberto)} color="#22c55e" />
            <Kpi label="Pagar em aberto" value={formatMoney(summary.pagarAberto)} color="#ef4444" />
            <Kpi label="Fluxo projetado" value={formatMoney(summary.resultado)} color={summary.resultado >= 0 ? "#22c55e" : "#facc15"} />
            <Kpi label="Mov. pagas" value={formatMoney(summary.pagos)} color="#38bdf8" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Novo lançamento</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.chip} onPress={() => setTipo((t) => (t === "pagar" ? "receber" : "pagar"))}>
                <Text style={styles.chipText}>{tipo}</Text>
              </TouchableOpacity>
              <TextInput style={[styles.input, { minWidth: 140 }]} placeholder="Categoria" placeholderTextColor="#64748b" value={categoria} onChangeText={setCategoria} />
              <TextInput style={[styles.input, { flex: 1, minWidth: 220 }]} placeholder="Descrição" placeholderTextColor="#64748b" value={descricao} onChangeText={setDescricao} />
              <TextInput style={[styles.input, { width: 140 }]} placeholder="Valor" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={valor} onChangeText={(t) => setValor(formatCurrencyInputBR(t))} />
              <TextInput style={[styles.input, { width: 140 }]} placeholder="Vencimento YYYY-MM-DD" placeholderTextColor="#64748b" value={vencimento} onChangeText={setVencimento} />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void criarLancamento()} disabled={saving}>
                {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Lançamentos</Text>
            {lancamentos.length === 0 ? (
              <Text style={styles.empty}>Sem lançamentos.</Text>
            ) : (
              lancamentos.map((item) => (
                <View key={item.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.descricao}</Text>
                    <Text style={styles.itemMeta}>
                      {item.tipo.toUpperCase()} • {item.categoria || "sem categoria"} • Venc: {item.vencimento || "-"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={styles.value}>{formatMoney(Number(item.valor || 0))}</Text>
                    <Text style={styles.status}>{item.status}</Text>
                    {item.status !== "pago" ? (
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => void marcarPago(item)} disabled={busyId === item.id}>
                        {busyId === item.id ? <ActivityIndicator size="small" color="#cbd5e1" /> : <Text style={styles.secondaryText}>Marcar pago</Text>}
                      </TouchableOpacity>
                    ) : null}
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
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 210, backgroundColor: "#0b1220", borderRadius: 12, borderWidth: 1, borderColor: "#1f2937", padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontSize: 18, fontWeight: "900" },
  card: { backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  title: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1, borderRadius: 10, color: "#f8fafc", fontWeight: "700", paddingHorizontal: 10, paddingVertical: 9 },
  chip: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  chipText: { color: "#e2e8f0", fontWeight: "900", textTransform: "uppercase", fontSize: 11 },
  primaryBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryText: { color: "#022c22", fontWeight: "900" },
  empty: { textAlign: "center", color: "#94a3b8", fontWeight: "700", paddingVertical: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10 },
  itemTitle: { color: "#f8fafc", fontWeight: "800" },
  itemMeta: { color: "#94a3b8", marginTop: 2, fontSize: 11, fontWeight: "700" },
  value: { color: "#22c55e", fontWeight: "900" },
  status: { color: "#facc15", fontWeight: "900", textTransform: "uppercase", fontSize: 11 },
  secondaryBtn: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  secondaryText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
});
