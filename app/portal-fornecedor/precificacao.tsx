import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Produto = {
  id: string;
  titulo: string;
  preco: number;
  estoque: number;
  ativo: boolean;
};

type Custo = {
  produto_id: string;
  custo_produto?: number | null;
  custo_frete_medio?: number | null;
  custo_embalagem?: number | null;
  custo_fixo_rateio?: number | null;
  imposto_pct?: number | null;
  taxa_gateway_pct?: number | null;
  taxa_comissao_pct?: number | null;
  taxa_marketing_pct?: number | null;
  perda_operacional_pct?: number | null;
  margem_minima_pct?: number | null;
  margem_alvo_pct?: number | null;
  desconto_maximo_pct?: number | null;
};

type Recomendacao = {
  id: string;
  produto_id: string;
  preco_atual: number;
  preco_sugerido: number;
  custo_total_unitario?: number | null;
  preco_ponto_equilibrio?: number | null;
  preco_minimo_lucrativo?: number | null;
  margem_pct_sugerida?: number | null;
  lucro_unitario_sugerido?: number | null;
  risco_prejuizo?: boolean | null;
  observacoes?: string | null;
};

function toNumber(text: string) {
  const n = parseCurrencyInputBR(text);
  return Number.isFinite(n) ? n : 0;
}

function toText(n?: number | null, fallback = "0") {
  if (n === null || n === undefined) return fallback;
  return String(n);
}

function toCurrencyText(n?: number | null, fallback = "") {
  if (n === null || n === undefined) return fallback;
  return formatMoney(Number(n || 0));
}

export default function PortalFornecedorPrecificacao() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [recs, setRecs] = useState<Recomendacao[]>([]);
  const [selectedProdutoId, setSelectedProdutoId] = useState("");

  const [custoProduto, setCustoProduto] = useState("");
  const [custoFrete, setCustoFrete] = useState(formatMoney(0));
  const [custoEmb, setCustoEmb] = useState(formatMoney(0));
  const [custoFixo, setCustoFixo] = useState(formatMoney(0));
  const [imposto, setImposto] = useState("0");
  const [gateway, setGateway] = useState("0");
  const [comissao, setComissao] = useState("0");
  const [marketing, setMarketing] = useState("0");
  const [perda, setPerda] = useState("0");
  const [margemMin, setMargemMin] = useState("15");
  const [margemAlvo, setMargemAlvo] = useState("28");
  const [descontoMax, setDescontoMax] = useState("10");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = await resolveCurrentTenantId();
      const [prodRes, recRes] = await Promise.all([
        tenantId
          ? supabase.from("produtos_fornecedor").select("id, titulo, preco, estoque, ativo").eq("ativo", true).eq("tenant_id", tenantId).order("titulo", { ascending: true })
          : supabase.from("produtos_fornecedor").select("id, titulo, preco, estoque, ativo").eq("ativo", true).order("titulo", { ascending: true }),
        supabase
          .from("fornecedor_precificacao_recomendacoes")
          .select("id, produto_id, preco_atual, preco_sugerido, custo_total_unitario, preco_ponto_equilibrio, preco_minimo_lucrativo, margem_pct_sugerida, lucro_unitario_sugerido, risco_prejuizo, observacoes")
          .order("created_at", { ascending: false })
          .limit(60),
      ]);

      const ps = (prodRes.data as Produto[]) || [];
      setProdutos(ps);
      setRecs((recRes.data as Recomendacao[]) || []);
      if (!selectedProdutoId && ps.length) {
        setSelectedProdutoId(ps[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProdutoId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  async function carregarCustosDoProduto(produtoId: string) {
    const tenantId = await resolveCurrentTenantId();
    let query = supabase
      .from("fornecedor_precificacao_custos_produto")
      .select("produto_id, custo_produto, custo_frete_medio, custo_embalagem, custo_fixo_rateio, imposto_pct, taxa_gateway_pct, taxa_comissao_pct, taxa_marketing_pct, perda_operacional_pct, margem_minima_pct, margem_alvo_pct, desconto_maximo_pct")
      .eq("produto_id", produtoId);
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    const { data } = await query.maybeSingle();

    const c = (data as Custo | null) || null;
    setCustoProduto(toCurrencyText(c?.custo_produto, ""));
    setCustoFrete(toCurrencyText(c?.custo_frete_medio, formatMoney(0)));
    setCustoEmb(toCurrencyText(c?.custo_embalagem, formatMoney(0)));
    setCustoFixo(toCurrencyText(c?.custo_fixo_rateio, formatMoney(0)));
    setImposto(toText(c?.imposto_pct, "0"));
    setGateway(toText(c?.taxa_gateway_pct, "0"));
    setComissao(toText(c?.taxa_comissao_pct, "0"));
    setMarketing(toText(c?.taxa_marketing_pct, "0"));
    setPerda(toText(c?.perda_operacional_pct, "0"));
    setMargemMin(toText(c?.margem_minima_pct, "15"));
    setMargemAlvo(toText(c?.margem_alvo_pct, "28"));
    setDescontoMax(toText(c?.desconto_maximo_pct, "10"));
  }

  async function salvarCustos() {
    if (!selectedProdutoId) return Alert.alert("Atenção", "Selecione um produto.");
    if (!custoProduto.trim()) return Alert.alert("Atenção", "Informe o custo do produto.");
    try {
      setSaving(true);
      const { error } = await supabase.rpc("salvar_custo_precificacao_produto", {
        p_produto_id: selectedProdutoId,
        p_custo_produto: toNumber(custoProduto),
        p_custo_frete_medio: toNumber(custoFrete),
        p_custo_embalagem: toNumber(custoEmb),
        p_custo_fixo_rateio: toNumber(custoFixo),
        p_imposto_pct: toNumber(imposto),
        p_taxa_gateway_pct: toNumber(gateway),
        p_taxa_comissao_pct: toNumber(comissao),
        p_taxa_marketing_pct: toNumber(marketing),
        p_perda_operacional_pct: toNumber(perda),
        p_margem_minima_pct: toNumber(margemMin),
        p_margem_alvo_pct: toNumber(margemAlvo),
        p_desconto_maximo_pct: toNumber(descontoMax),
      });
      if (error) throw error;
      Alert.alert("Sucesso", "Custos salvos com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao salvar custos.");
    } finally {
      setSaving(false);
    }
  }

  async function gerarPrecos() {
    try {
      setRunning(true);
      const { error } = await supabase.rpc("gerar_precos_dinamicos_fornecedor");
      if (error) throw error;
      await carregar();
      Alert.alert("Concluído", "Recomendações de preço atualizadas.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao gerar preços.");
    } finally {
      setRunning(false);
    }
  }

  const selectedProduto = useMemo(() => produtos.find((p) => p.id === selectedProdutoId) || null, [produtos, selectedProdutoId]);
  const kpis = useMemo(() => {
    const risco = recs.filter((r) => Boolean(r.risco_prejuizo)).length;
    const lucro = recs.reduce((acc, r) => acc + Number(r.lucro_unitario_sugerido || 0), 0);
    return { risco, lucro, total: recs.length };
  }, [recs]);

  return (
    <PortalShell
      title="Central de Precificação Inteligente"
      subtitle="Centro profissional de formação de preços anti-prejuízo"
      headerRight={
        <TouchableOpacity style={styles.runBtn} onPress={() => void gerarPrecos()} disabled={running}>
          {running ? <ActivityIndicator size="small" color="#022c22" /> : <Text style={styles.runText}>Gerar preços</Text>}
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Recomendações" value={String(kpis.total)} color="#f8fafc" />
            <Kpi label="Risco de prejuízo" value={String(kpis.risco)} color={kpis.risco > 0 ? "#ef4444" : "#22c55e"} />
            <Kpi label="Lucro unitário agregado" value={formatMoney(kpis.lucro)} color="#22c55e" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Produto selecionado</Text>
            <View style={styles.productWrap}>
              {produtos.slice(0, 20).map((p) => {
                const active = p.id === selectedProdutoId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.productChip, active ? styles.productChipActive : null]}
                    onPress={() => {
                      setSelectedProdutoId(p.id);
                      void carregarCustosDoProduto(p.id);
                    }}
                  >
                    <Text style={[styles.productText, active ? styles.productTextActive : null]}>{p.titulo}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedProduto ? (
              <Text style={styles.productMeta}>
                Preço atual: {formatMoney(Number(selectedProduto.preco || 0))} • Estoque: {selectedProduto.estoque}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Custos e regras de margem</Text>
            <View style={styles.grid}>
              <Input label="Custo do produto" value={custoProduto} onChangeText={setCustoProduto} currency />
              <Input label="Frete médio" value={custoFrete} onChangeText={setCustoFrete} currency />
              <Input label="Embalagem" value={custoEmb} onChangeText={setCustoEmb} currency />
              <Input label="Rateio fixo" value={custoFixo} onChangeText={setCustoFixo} currency />
              <Input label="Imposto %" value={imposto} onChangeText={setImposto} />
              <Input label="Gateway %" value={gateway} onChangeText={setGateway} />
              <Input label="Comissão %" value={comissao} onChangeText={setComissao} />
              <Input label="Marketing %" value={marketing} onChangeText={setMarketing} />
              <Input label="Perdas %" value={perda} onChangeText={setPerda} />
              <Input label="Margem mínima %" value={margemMin} onChangeText={setMargemMin} />
              <Input label="Margem alvo %" value={margemAlvo} onChangeText={setMargemAlvo} />
              <Input label="Desconto máximo %" value={descontoMax} onChangeText={setDescontoMax} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={() => void salvarCustos()} disabled={saving}>
              {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.saveText}>Salvar custos</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Diagnóstico de precificação</Text>
            {recs.slice(0, 12).map((r) => (
              <View key={r.id} style={styles.recRow}>
                <Text style={styles.recTitle}>Produto {r.produto_id.slice(0, 8)} • Atual: {formatMoney(r.preco_atual)} • Sugerido: {formatMoney(r.preco_sugerido)}</Text>
                <Text style={styles.recMeta}>
                  Break-even: {formatMoney(Number(r.preco_ponto_equilibrio || 0))} • Mín. lucrativo: {formatMoney(Number(r.preco_minimo_lucrativo || 0))}
                </Text>
                <Text style={styles.recMeta}>
                  Custo total: {formatMoney(Number(r.custo_total_unitario || 0))} • Lucro un.: {formatMoney(Number(r.lucro_unitario_sugerido || 0))} • Margem: {Number(r.margem_pct_sugerida || 0).toFixed(2)}%
                </Text>
                {r.risco_prejuizo ? <Text style={styles.recRisk}>Risco: preço atual abaixo do mínimo lucrativo.</Text> : null}
                {r.observacoes ? <Text style={styles.recObs}>{r.observacoes}</Text> : null}
              </View>
            ))}
            {recs.length === 0 ? <Text style={styles.empty}>Gere os preços para visualizar o diagnóstico.</Text> : null}
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

function Input({ label, value, onChangeText, currency }: { label: string; value: string; onChangeText: (v: string) => void; currency?: boolean }) {
  return (
    <View style={{ minWidth: 180, flex: 1 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(v) => onChangeText(currency ? formatCurrencyInputBR(v) : v)}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#64748b"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  runBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  runText: { color: "#022c22", fontWeight: "900" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpi: { flex: 1, minWidth: 200, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 12, padding: 10 },
  kpiLabel: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  kpiValue: { marginTop: 6, fontWeight: "900", fontSize: 18 },
  card: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  productWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  productChip: { borderRadius: 999, borderWidth: 1, borderColor: "#334155", backgroundColor: "#111827", paddingHorizontal: 10, paddingVertical: 7 },
  productChipActive: { borderColor: "#22c55e", backgroundColor: "#22c55e" },
  productText: { color: "#cbd5e1", fontWeight: "700", fontSize: 12 },
  productTextActive: { color: "#022c22", fontWeight: "900" },
  productMeta: { marginTop: 8, color: "#94a3b8", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  inputLabel: { color: "#cbd5e1", fontWeight: "700", marginBottom: 5, fontSize: 12 },
  input: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#334155", borderRadius: 10, color: "#f8fafc", fontWeight: "700", paddingHorizontal: 10, paddingVertical: 9 },
  saveBtn: { marginTop: 10, backgroundColor: "#22c55e", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  saveText: { color: "#022c22", fontWeight: "900" },
  recRow: { borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 8, marginTop: 8 },
  recTitle: { color: "#f8fafc", fontWeight: "800", marginBottom: 2 },
  recMeta: { color: "#94a3b8", fontWeight: "700", fontSize: 12, marginBottom: 2 },
  recRisk: { color: "#ef4444", fontWeight: "900", fontSize: 12, marginTop: 2 },
  recObs: { color: "#facc15", fontWeight: "800", fontSize: 11, marginTop: 2 },
  empty: { color: "#94a3b8", fontWeight: "700", textAlign: "center", paddingVertical: 8 },
});
