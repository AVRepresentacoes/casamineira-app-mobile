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
  estoque: number;
  preco: number;
  ativo: boolean;
};

type Movimento = {
  id: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  motivo?: string | null;
  custo_unitario?: number | null;
  created_at: string;
  produto_id?: string | null;
  produto?: { titulo?: string | null } | null;
};

type MovimentoTipo = "entrada" | "saida" | "ajuste";

export default function PortalFornecedorEstoque() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState<MovimentoTipo>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [custo, setCusto] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = await resolveCurrentTenantId();
      const [prodRes, movRes] = await Promise.all([
        tenantId
          ? supabase.from("produtos_fornecedor").select("id, titulo, estoque, preco, ativo").eq("tenant_id", tenantId).order("titulo", { ascending: true })
          : supabase.from("produtos_fornecedor").select("id, titulo, estoque, preco, ativo").order("titulo", { ascending: true }),
        tenantId
          ? supabase
              .from("fornecedor_estoque_movimentos")
              .select("id, tipo, quantidade, motivo, custo_unitario, created_at, produto_id, produto:produto_id(titulo)")
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(150)
          : supabase
              .from("fornecedor_estoque_movimentos")
              .select("id, tipo, quantidade, motivo, custo_unitario, created_at, produto_id, produto:produto_id(titulo)")
              .order("created_at", { ascending: false })
              .limit(150),
      ]);

      setProdutos((prodRes.data as Produto[]) || []);
      setMovimentos((movRes.data as Movimento[]) || []);
      if (!produtoId && (prodRes.data as Produto[] | null)?.length) {
        setProdutoId(String((prodRes.data as Produto[])[0].id));
      }
    } finally {
      setLoading(false);
    }
  }, [produtoId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const metrics = useMemo(() => {
    const ativos = produtos.filter((p) => p.ativo);
    const valorEstoque = ativos.reduce((acc, p) => acc + Number(p.preco || 0) * Number(p.estoque || 0), 0);
    const baixoEstoque = ativos.filter((p) => Number(p.estoque || 0) <= 5).length;
    const zerados = ativos.filter((p) => Number(p.estoque || 0) <= 0).length;
    return { valorEstoque, baixoEstoque, zerados, total: ativos.length };
  }, [produtos]);

  async function registrarMovimento() {
    if (!produtoId) return Alert.alert("Atenção", "Selecione um produto.");
    const qtd = Number(quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) return Alert.alert("Atenção", "Quantidade inválida.");

    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return Alert.alert("Erro", "Produto não encontrado.");
    if (tipo === "saida" && Number(produto.estoque || 0) < qtd) return Alert.alert("Atenção", "Estoque insuficiente.");

    const custoNum = parseCurrencyInputBR(custo);
    const custoFinal = Number.isFinite(custoNum) && custoNum > 0 ? custoNum : null;
    const novoEstoque =
      tipo === "entrada"
        ? Number(produto.estoque || 0) + qtd
        : tipo === "saida"
          ? Number(produto.estoque || 0) - qtd
          : qtd;

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");

      const tenantId = await resolveCurrentTenantId();
      if (!tenantId) throw new Error("Tenant ativo não encontrado.");

      const { error: movementError } = await supabase.from("fornecedor_estoque_movimentos").insert({
        tenant_id: tenantId,
        fornecedor_id: uid,
        produto_id: produtoId,
        tipo,
        quantidade: qtd,
        motivo: motivo.trim() || null,
        custo_unitario: custoFinal,
      });
      if (movementError) throw movementError;

      const { error: updateError } = await supabase
        .from("produtos_fornecedor")
        .update({ estoque: novoEstoque })
        .eq("id", produtoId)
        .eq("tenant_id", tenantId);
      if (updateError) throw updateError;

      setQuantidade("");
      setMotivo("");
      setCusto("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao registrar movimento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalShell title="Estoque" subtitle="Controle de inventário em tempo real">
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Valor em estoque" value={formatMoney(metrics.valorEstoque)} color="#22c55e" />
            <Kpi label="Produtos ativos" value={String(metrics.total)} color="#f8fafc" />
            <Kpi label="Baixo estoque" value={String(metrics.baixoEstoque)} color="#facc15" />
            <Kpi label="Zerados" value={String(metrics.zerados)} color="#ef4444" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Registrar movimentação</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="ID do produto"
                placeholderTextColor="#64748b"
                value={produtoId}
                onChangeText={setProdutoId}
              />
              <TouchableOpacity style={styles.chip} onPress={() => setTipo((t) => (t === "entrada" ? "saida" : t === "saida" ? "ajuste" : "entrada"))}>
                <Text style={styles.chipText}>{tipo}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { width: 120 }]}
                placeholder={tipo === "ajuste" ? "Novo estoque" : "Qtd"}
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={quantidade}
                onChangeText={(v) => setQuantidade(v.replace(/\D/g, ""))}
              />
              <TextInput
                style={[styles.input, { width: 140 }]}
                placeholder="Custo unit."
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={custo}
                onChangeText={(v) => setCusto(formatCurrencyInputBR(v))}
              />
            </View>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Motivo (opcional)"
              placeholderTextColor="#64748b"
              value={motivo}
              onChangeText={setMotivo}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => void registrarMovimento()} disabled={saving}>
              {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Salvar movimento</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Movimentações recentes</Text>
            {movimentos.length === 0 ? (
              <Text style={styles.empty}>Sem movimentações registradas.</Text>
            ) : (
              movimentos.map((m) => (
                <View key={m.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{m.produto?.titulo || m.produto_id || "Produto"}</Text>
                    <Text style={styles.itemMeta}>{new Date(m.created_at).toLocaleString("pt-BR")} • {m.motivo || "Sem motivo"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.badge, m.tipo === "entrada" ? styles.ok : m.tipo === "saida" ? styles.warn : styles.info]}>
                      {m.tipo.toUpperCase()}
                    </Text>
                    <Text style={styles.itemQty}>Qtd: {m.quantidade}</Text>
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
  sectionTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1, borderRadius: 10, color: "#f8fafc", fontWeight: "700", paddingHorizontal: 10, paddingVertical: 9 },
  chip: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  chipText: { color: "#cbd5e1", fontWeight: "800", textTransform: "uppercase", fontSize: 12 },
  primaryBtn: { marginTop: 10, backgroundColor: "#22c55e", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  primaryText: { color: "#022c22", fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", paddingVertical: 10, fontWeight: "700" },
  itemRow: { flexDirection: "row", gap: 8, alignItems: "center", borderTopWidth: 1, borderTopColor: "#1f2937", paddingVertical: 10 },
  itemTitle: { color: "#f8fafc", fontWeight: "800" },
  itemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 2, fontWeight: "700" },
  badge: { borderRadius: 999, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontWeight: "900", fontSize: 10, color: "#0f172a" },
  ok: { backgroundColor: "#22c55e" },
  warn: { backgroundColor: "#facc15" },
  info: { backgroundColor: "#38bdf8" },
  itemQty: { color: "#cbd5e1", fontWeight: "800", fontSize: 11, marginTop: 4 },
});
