import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatCurrencyInputBR, formatMoney, parseCurrencyInputBR } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type FiscalTipo = "nfe" | "nfse" | "recibo";
type FiscalStatus = "emitido" | "cancelado";
type Documento = {
  id: string;
  tipo: FiscalTipo;
  numero?: string | null;
  serie?: string | null;
  chave_acesso?: string | null;
  cliente_nome?: string | null;
  valor_total: number;
  emissao_em: string;
  status: FiscalStatus;
};

export default function PortalFornecedorFiscal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState<FiscalTipo>("nfe");
  const [numero, setNumero] = useState("");
  const [serie, setSerie] = useState("");
  const [chave, setChave] = useState("");
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("fornecedor_documentos_fiscais")
        .select("id, tipo, numero, serie, chave_acesso, cliente_nome, valor_total, emissao_em, status")
        .order("emissao_em", { ascending: false })
        .limit(500);
      setDocumentos((data as Documento[]) || []);
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
    const emitidos = documentos.filter((d) => d.status === "emitido");
    const cancelados = documentos.filter((d) => d.status === "cancelado");
    const totalEmitido = emitidos.reduce((a, d) => a + Number(d.valor_total || 0), 0);
    return { emitidos: emitidos.length, cancelados: cancelados.length, totalEmitido };
  }, [documentos]);

  async function salvarDocumento() {
    const valorNum = parseCurrencyInputBR(valor);
    if (!Number.isFinite(valorNum) || valorNum < 0) return Alert.alert("Atenção", "Valor inválido.");
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");
      const { data: tenantId, error: tenantError } = await supabase.rpc("current_tenant_id");
      if (tenantError || !tenantId) throw new Error("Tenant ativo não encontrado.");

      const { error } = await supabase.from("fornecedor_documentos_fiscais").insert({
        tenant_id: tenantId,
        fornecedor_id: uid,
        tipo,
        numero: numero.trim() || null,
        serie: serie.trim() || null,
        chave_acesso: chave.trim() || null,
        cliente_nome: cliente.trim() || null,
        valor_total: valorNum,
        status: "emitido",
      });
      if (error) throw error;
      setNumero("");
      setSerie("");
      setChave("");
      setCliente("");
      setValor("");
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao salvar documento fiscal.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelarDocumento(id: string) {
    try {
      const { error } = await supabase.from("fornecedor_documentos_fiscais").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
      setDocumentos((prev) => prev.map((d) => (d.id === id ? { ...d, status: "cancelado" } : d)));
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao cancelar documento.");
    }
  }

  return (
    <PortalShell title="Fiscal" subtitle="Documentos fiscais e governança tributária">
      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#22c55e" /></View>
      ) : (
        <>
          <View style={styles.kpiRow}>
            <Kpi label="Documentos emitidos" value={String(summary.emitidos)} color="#22c55e" />
            <Kpi label="Documentos cancelados" value={String(summary.cancelados)} color="#ef4444" />
            <Kpi label="Volume fiscal" value={formatMoney(summary.totalEmitido)} color="#38bdf8" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Novo documento fiscal</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.chip} onPress={() => setTipo((t) => (t === "nfe" ? "nfse" : t === "nfse" ? "recibo" : "nfe"))}>
                <Text style={styles.chipText}>{tipo}</Text>
              </TouchableOpacity>
              <TextInput style={[styles.input, { width: 120 }]} placeholder="Número" placeholderTextColor="#64748b" value={numero} onChangeText={setNumero} />
              <TextInput style={[styles.input, { width: 100 }]} placeholder="Série" placeholderTextColor="#64748b" value={serie} onChangeText={setSerie} />
              <TextInput style={[styles.input, { minWidth: 220, flex: 1 }]} placeholder="Cliente" placeholderTextColor="#64748b" value={cliente} onChangeText={setCliente} />
              <TextInput style={[styles.input, { width: 140 }]} placeholder="Valor" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={valor} onChangeText={(v) => setValor(formatCurrencyInputBR(v))} />
              <TextInput style={[styles.input, { minWidth: 240, flex: 1 }]} placeholder="Chave de acesso (opcional)" placeholderTextColor="#64748b" value={chave} onChangeText={setChave} />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => void salvarDocumento()} disabled={saving}>
                {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Documentos lançados</Text>
            {documentos.length === 0 ? (
              <Text style={styles.empty}>Sem documentos fiscais.</Text>
            ) : (
              documentos.map((doc) => (
                <View key={doc.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      {doc.tipo.toUpperCase()} {doc.numero ? `#${doc.numero}` : ""} {doc.serie ? `Série ${doc.serie}` : ""}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {doc.cliente_nome || "Cliente não informado"} • Emissão {new Date(doc.emissao_em).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={styles.value}>{formatMoney(Number(doc.valor_total || 0))}</Text>
                    <Text style={styles.status}>{doc.status}</Text>
                    {doc.status !== "cancelado" ? (
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => void cancelarDocumento(doc.id)}>
                        <Text style={styles.secondaryText}>Cancelar</Text>
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
  itemMeta: { color: "#94a3b8", fontSize: 11, marginTop: 2, fontWeight: "700" },
  value: { color: "#22c55e", fontWeight: "900" },
  status: { color: "#facc15", fontWeight: "900", textTransform: "uppercase", fontSize: 11 },
  secondaryBtn: { backgroundColor: "#3f1d1d", borderColor: "#7f1d1d", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  secondaryText: { color: "#fecaca", fontWeight: "800", fontSize: 11 },
});
