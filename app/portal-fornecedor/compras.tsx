import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type CompraStatus = "rascunho" | "emitida" | "parcial" | "recebida" | "cancelada";

type Compra = {
  id: string;
  numero?: string | null;
  fornecedor_nome: string;
  status: CompraStatus;
  data_emissao: string;
  data_prevista?: string | null;
  valor_total: number;
};

type CompraItem = {
  id: string;
  compra_id: string;
  produto_nome: string;
  quantidade: number;
  custo_unitario: number;
  subtotal: number;
};

const STATUS_FLOW: CompraStatus[] = ["rascunho", "emitida", "parcial", "recebida", "cancelada"];

function nextStatus(status: CompraStatus): CompraStatus {
  const idx = STATUS_FLOW.indexOf(status);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return status;
  return STATUS_FLOW[idx + 1];
}

export default function PortalFornecedorCompras() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [itens, setItens] = useState<CompraItem[]>([]);
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [numero, setNumero] = useState("");
  const [itemNome, setItemNome] = useState("");
  const [qtd, setQtd] = useState("");
  const [custo, setCusto] = useState("");
  const [selectedCompraId, setSelectedCompraId] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [comprasRes, itensRes] = await Promise.all([
        supabase.from("fornecedor_compras").select("id, numero, fornecedor_nome, status, data_emissao, data_prevista, valor_total").order("created_at", { ascending: false }).limit(200),
        supabase.from("fornecedor_compras_itens").select("id, compra_id, produto_nome, quantidade, custo_unitario, subtotal").order("created_at", { ascending: false }).limit(800),
      ]);
      const comprasData = (comprasRes.data as Compra[]) || [];
      setCompras(comprasData);
      setItens((itensRes.data as CompraItem[]) || []);
      if (!selectedCompraId && comprasData.length > 0) setSelectedCompraId(String(comprasData[0].id));
    } finally {
      setLoading(false);
    }
  }, [selectedCompraId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const metrics = useMemo(() => {
    const total = compras.length;
    const abertas = compras.filter((c) => ["rascunho", "emitida", "parcial"].includes(c.status)).length;
    const recebidas = compras.filter((c) => c.status === "recebida").length;
    const totalCompras = compras.reduce((acc, c) => acc + Number(c.valor_total || 0), 0);
    return { total, abertas, recebidas, totalCompras };
  }, [compras]);

  async function criarCompra() {
    if (!fornecedorNome.trim()) return Alert.alert("Atenção", "Informe o fornecedor.");
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");
      const { data: tenantId, error: tenantError } = await supabase.rpc("current_tenant_id");
      if (tenantError || !tenantId) throw new Error("Tenant ativo não encontrado.");

      const { data, error } = await supabase
        .from("fornecedor_compras")
        .insert({
          tenant_id: tenantId,
          fornecedor_id: uid,
          numero: numero.trim() || null,
          fornecedor_nome: fornecedorNome.trim(),
          status: "rascunho",
        })
        .select("id")
        .single();
      if (error) throw error;

      setFornecedorNome("");
      setNumero("");
      setSelectedCompraId(String((data as any).id || ""));
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível criar compra.");
    } finally {
      setSaving(false);
    }
  }

  async function adicionarItem() {
    if (!selectedCompraId) return Alert.alert("Atenção", "Selecione uma compra.");
    if (!itemNome.trim()) return Alert.alert("Atenção", "Informe o item.");
    const quantidade = Number(qtd);
    const custoUnit = parseCurrencyInputBR(custo);
    if (!Number.isFinite(quantidade) || quantidade <= 0) return Alert.alert("Atenção", "Quantidade inválida.");
    if (!Number.isFinite(custoUnit) || custoUnit < 0) return Alert.alert("Atenção", "Custo inválido.");

    try {
      setSaving(true);
      const { data: tenantId, error: tenantError } = await supabase.rpc("current_tenant_id");
      if (tenantError || !tenantId) throw new Error("Tenant ativo não encontrado.");
      const subtotal = Number((quantidade * custoUnit).toFixed(2));
      const { error } = await supabase.from("fornecedor_compras_itens").insert({
        tenant_id: tenantId,
        compra_id: selectedCompraId,
        produto_nome: itemNome.trim(),
        quantidade,
        custo_unitario: custoUnit,
        subtotal,
      });
      if (error) throw error;

      setItemNome("");
      setQtd("");
      setCusto("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível adicionar item.");
    } finally {
      setSaving(false);
    }
  }

  async function avancarStatus(compra: Compra) {
    if (compra.status === "cancelada" || compra.status === "recebida") return;
    try {
      setBusyId(compra.id);
      const { error } = await supabase.from("fornecedor_compras").update({ status: nextStatus(compra.status) }).eq("id", compra.id);
      if (error) throw error;
      setCompras((prev) => prev.map((c) => (c.id === compra.id ? { ...c, status: nextStatus(c.status) } : c)));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao atualizar status.");
    } finally {
      setBusyId(null);
    }
  }

  const selectedItens = useMemo(() => itens.filter((i) => i.compra_id === selectedCompraId), [itens, selectedCompraId]);

  return (
    <PortalShell title="Compras" subtitle="Suprimentos, entrada de mercadoria e custos">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Total de compras" value={String(metrics.total)} color="#f8fafc" />
            <Kpi label="Em aberto" value={String(metrics.abertas)} color="#facc15" />
            <Kpi label="Recebidas" value={String(metrics.recebidas)} color="#22c55e" />
            <Kpi label="Valor acumulado" value={formatMoney(metrics.totalCompras)} color="#38bdf8" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nova compra</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Fornecedor" placeholderTextColor="#64748b" value={fornecedorNome} onChangeText={setFornecedorNome} />
              <TextInput style={[styles.input, { width: 160 }]} placeholder="Número (opcional)" placeholderTextColor="#64748b" value={numero} onChangeText={setNumero} />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void criarCompra()} disabled={saving}>
                {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Criar compra</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Adicionar item à compra</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="ID da compra" placeholderTextColor="#64748b" value={selectedCompraId} onChangeText={setSelectedCompraId} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nome do item" placeholderTextColor="#64748b" value={itemNome} onChangeText={setItemNome} />
              <TextInput style={[styles.input, { width: 90 }]} placeholder="Qtd" placeholderTextColor="#64748b" keyboardType="number-pad" value={qtd} onChangeText={(v) => setQtd(v.replace(/\D/g, ""))} />
              <TextInput style={[styles.input, { width: 140 }]} placeholder="Custo" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={custo} onChangeText={(v) => setCusto(formatCurrencyInputBR(v))} />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void adicionarItem()} disabled={saving}>
                {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Adicionar</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ordens de compra</Text>
            {compras.length === 0 ? (
              <Text style={styles.empty}>Sem compras lançadas.</Text>
            ) : (
              compras.map((c) => (
                <View key={c.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{c.fornecedor_nome} • #{String(c.id).slice(0, 8)}</Text>
                    <Text style={styles.itemMeta}>Emissão: {new Date(c.data_emissao).toLocaleDateString("pt-BR")} • Total: {formatMoney(Number(c.valor_total || 0))}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={styles.status}>{c.status}</Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => void avancarStatus(c)} disabled={busyId === c.id}>
                      {busyId === c.id ? <ActivityIndicator size="small" color="#cbd5e1" /> : <Text style={styles.secondaryText}>Avançar status</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Itens da compra selecionada</Text>
            {selectedItens.length === 0 ? (
              <Text style={styles.empty}>Sem itens nesta compra.</Text>
            ) : (
              selectedItens.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.produto_nome}</Text>
                    <Text style={styles.itemMeta}>{item.quantidade} x {formatMoney(Number(item.custo_unitario || 0))}</Text>
                  </View>
                  <Text style={styles.value}>{formatMoney(Number(item.subtotal || 0))}</Text>
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
  primaryBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#022c22", fontWeight: "900", fontSize: 12 },
  secondaryBtn: { backgroundColor: "#172036", borderColor: "#334155", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  secondaryText: { color: "#cbd5e1", fontWeight: "800", fontSize: 11 },
  empty: { color: "#94a3b8", textAlign: "center", fontWeight: "700", paddingVertical: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopColor: "#1f2937", borderTopWidth: 1, paddingVertical: 10 },
  itemTitle: { color: "#f8fafc", fontWeight: "800" },
  itemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 2, fontWeight: "700" },
  status: { color: "#facc15", fontWeight: "900", textTransform: "uppercase", fontSize: 11 },
  value: { color: "#22c55e", fontWeight: "900" },
});
