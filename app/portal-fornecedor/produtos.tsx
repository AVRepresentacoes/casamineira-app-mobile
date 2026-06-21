import PortalShell from "@/components/fornecedor-web/PortalShell";
import { formatMoney } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { resolveCurrentTenantId } from "@/lib/tenant";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Produto = {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  imagem_url?: string | null;
  preco: number;
  preco_de?: number | null;
  preco_por?: number | null;
  estoque: number;
  ativo: boolean;
  created_at?: string | null;
};

type SortField = "titulo" | "preco" | "estoque" | "created_at";

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function formatCurrencyInput(value: string) {
  const digits = onlyDigits(value);
  const cents = Number(digits || 0);
  const number = cents / 100;
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyInput(value: string) {
  const normalized = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

const PAGE_SIZE = 12;

export default function PortalFornecedorProdutos() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [precoDe, setPrecoDe] = useState("");
  const [precoPor, setPrecoPor] = useState("");
  const [estoque, setEstoque] = useState("");

  const limparForm = useCallback(() => {
    setEditingId(null);
    setTitulo("");
    setDescricao("");
    setCategoria("");
    setImagemUrl("");
    setPrecoDe("");
    setPrecoPor("");
    setEstoque("");
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = await resolveCurrentTenantId();
      let query = supabase
        .from("produtos_fornecedor")
        .select("id, titulo, descricao, categoria, imagem_url, preco, preco_de, preco_por, estoque, ativo, created_at")
        .order("created_at", { ascending: false });
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
      const { data, error } = await query;
      if (error) throw error;
      setProdutos((data as Produto[]) || []);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao carregar produtos");
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
    const term = busca.trim().toLowerCase();
    const base = produtos.filter((p) => {
      if (!term) return true;
      return (
        String(p.titulo || "").toLowerCase().includes(term) ||
        String(p.categoria || "").toLowerCase().includes(term)
      );
    });

    const sorted = [...base].sort((a, b) => {
      let av: number | string = "";
      let bv: number | string = "";
      if (sortField === "titulo") {
        av = String(a.titulo || "").toLowerCase();
        bv = String(b.titulo || "").toLowerCase();
      } else if (sortField === "preco") {
        av = Number(a.preco || 0);
        bv = Number(b.preco || 0);
      } else if (sortField === "estoque") {
        av = Number(a.estoque || 0);
        bv = Number(b.estoque || 0);
      } else {
        av = new Date(String(a.created_at || 0)).getTime();
        bv = new Date(String(b.created_at || 0)).getTime();
      }

      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      const result = String(av).localeCompare(String(bv), "pt-BR");
      return sortAsc ? result : -result;
    });

    return sorted;
  }, [busca, produtos, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  const stats = useMemo(() => {
    const total = produtos.length;
    const ativos = produtos.filter((p) => Boolean(p.ativo)).length;
    const inativos = total - ativos;
    const semEstoque = produtos.filter((p) => Boolean(p.ativo) && Number(p.estoque || 0) <= 0).length;
    const valorEstoque = produtos.reduce((acc, p) => acc + Number(p.preco || 0) * Number(p.estoque || 0), 0);
    return { total, ativos, inativos, semEstoque, valorEstoque };
  }, [produtos]);

  function fillFormFromProduto(produto: Produto) {
    setEditingId(produto.id);
    setTitulo(String(produto.titulo || ""));
    setDescricao(String(produto.descricao || ""));
    setCategoria(String(produto.categoria || ""));
    setImagemUrl(String(produto.imagem_url || ""));
    const de = Number(produto.preco_de ?? produto.preco ?? 0);
    const por = Number(produto.preco_por ?? 0);
    setPrecoDe(de.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setPrecoPor(por > 0 ? por.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "");
    setEstoque(String(Number(produto.estoque || 0)));
  }

  async function salvar() {
    if (!titulo.trim() || !precoDe.trim() || !estoque.trim()) {
      Alert.alert("Atenção", "Preencha título, preço De e estoque.");
      return;
    }
    const precoDeNumero = parseCurrencyInput(precoDe);
    const precoPorNumero = parseCurrencyInput(precoPor);
    const stock = Number(estoque);
    if (precoDeNumero <= 0 || !Number.isFinite(precoDeNumero)) return Alert.alert("Atenção", "Preço De inválido.");
    if (precoPor.trim() && (!Number.isFinite(precoPorNumero) || precoPorNumero <= 0)) {
      return Alert.alert("Atenção", "Preço Por inválido.");
    }
    if (precoPor.trim() && precoPorNumero >= precoDeNumero) {
      return Alert.alert("Atenção", "O preço Por deve ser menor que o preço De.");
    }
    if (stock < 0 || !Number.isFinite(stock)) return Alert.alert("Atenção", "Estoque inválido.");

    const precoPromocional = precoPor.trim() ? Number(precoPorNumero.toFixed(2)) : null;
    const precoEfetivo = precoPromocional && precoPromocional > 0 ? precoPromocional : Number(precoDeNumero.toFixed(2));

    try {
      setSaving(true);
      if (editingId) {
        const tenantId = await resolveCurrentTenantId();
        let query = supabase
          .from("produtos_fornecedor")
          .update({
            titulo: titulo.trim(),
            descricao: descricao.trim() || null,
            categoria: categoria.trim() || null,
            imagem_url: imagemUrl.trim() || null,
            preco: precoEfetivo,
            preco_de: Number(precoDeNumero.toFixed(2)),
            preco_por: precoPromocional,
            estoque: stock,
          })
          .eq("id", editingId);
        if (tenantId) {
          query = query.eq("tenant_id", tenantId);
        }
        const { error } = await query;
        if (error) throw error;
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Usuário não autenticado.");
        const tenantId = await resolveCurrentTenantId();
        if (!tenantId) throw new Error("Tenant ativo não encontrado.");

        const { error } = await supabase.from("produtos_fornecedor").insert({
          tenant_id: tenantId,
          fornecedor_id: session.user.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          categoria: categoria.trim() || null,
          imagem_url: imagemUrl.trim() || null,
          preco: precoEfetivo,
          preco_de: Number(precoDeNumero.toFixed(2)),
          preco_por: precoPromocional,
          estoque: stock,
          ativo: true,
        });
        if (error) throw error;
      }

      limparForm();
      await carregar();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(id: string, active: boolean) {
    try {
      setTogglingId(id);
      const tenantId = await resolveCurrentTenantId();
      let query = supabase.from("produtos_fornecedor").update({ ativo: !active }).eq("id", id);
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
      const { error } = await query;
      if (error) throw error;
      setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !active } : p)));
    } finally {
      setTogglingId(null);
    }
  }

  async function excluir(id: string) {
    try {
      setDeletingId(id);
      const tenantId = await resolveCurrentTenantId();
      let query = supabase.from("produtos_fornecedor").delete().eq("id", id);
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
      const { error } = await query;
      if (error) throw error;
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) limparForm();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao excluir produto");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PortalShell title="Produtos" subtitle="Gestão avançada de catálogo">
      <View style={styles.highlight}>
        <Text style={styles.highlightLabel}>Valor estimado em estoque</Text>
        <Text style={styles.highlightValue}>{formatMoney(stats.valorEstoque)}</Text>
        <Text style={styles.highlightMeta}>
          Total: {stats.total} • Ativos: {stats.ativos} • Inativos: {stats.inativos} • Sem estoque: {stats.semEstoque}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingId ? "Editar produto" : "Novo produto"}</Text>
        <View style={styles.formRow}>
          <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#64748b" value={titulo} onChangeText={setTitulo} />
          <TextInput style={styles.input} placeholder="Categoria" placeholderTextColor="#64748b" value={categoria} onChangeText={setCategoria} />
          <TextInput style={styles.input} placeholder="De (preço original)" placeholderTextColor="#64748b" value={precoDe} onChangeText={(t) => setPrecoDe(formatCurrencyInput(t))} />
          <TextInput style={styles.input} placeholder="Por (promoção - opcional)" placeholderTextColor="#64748b" value={precoPor} onChangeText={(t) => setPrecoPor(t ? formatCurrencyInput(t) : "")} />
          <TextInput style={styles.input} placeholder="Estoque" placeholderTextColor="#64748b" value={estoque} onChangeText={(t) => setEstoque(onlyDigits(t))} />
          <TextInput style={styles.input} placeholder="URL da imagem (opcional)" placeholderTextColor="#64748b" value={imagemUrl} onChangeText={setImagemUrl} />
          <TextInput style={styles.input} placeholder="Descrição (opcional)" placeholderTextColor="#64748b" value={descricao} onChangeText={setDescricao} />
          <TouchableOpacity style={styles.saveBtn} onPress={() => void salvar()} disabled={saving}>
            {saving ? <ActivityIndicator color="#022c22" /> : <Text style={styles.saveBtnText}>{editingId ? "Atualizar" : "Salvar"}</Text>}
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={limparForm}>
              <Text style={styles.cancelBtnText}>Cancelar edição</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Catálogo</Text>
          <TextInput
            style={[styles.input, { maxWidth: 320 }]}
            placeholder="Buscar produto ou categoria"
            placeholderTextColor="#64748b"
            value={busca}
            onChangeText={(t) => {
              setBusca(t);
              setPage(1);
            }}
          />
        </View>

        <View style={styles.toolsRow}>
          <SortButton
            label={`Ordenar: ${sortField}`}
            onPress={() => {
              setSortField((prev) =>
                prev === "created_at" ? "titulo" : prev === "titulo" ? "preco" : prev === "preco" ? "estoque" : "created_at"
              );
            }}
          />
          <SortButton label={sortAsc ? "Ascendente" : "Descendente"} onPress={() => setSortAsc((p) => !p)} />
          <Text style={styles.paginationInfo}>
            Página {Math.min(page, totalPages)} de {totalPages}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#22c55e" />
        ) : paged.length === 0 ? (
          <Text style={styles.empty}>Nenhum produto encontrado.</Text>
        ) : (
          paged.map((produto) => (
            <View key={produto.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{produto.titulo}</Text>
                <Text style={styles.meta}>{produto.categoria || "Sem categoria"}</Text>
              </View>
              <View style={{ minWidth: 120, alignItems: "flex-end" }}>
                {Number(produto.preco_por || 0) > 0 ? (
                  <Text style={styles.oldValue}>De: {formatMoney(Number(produto.preco_de || produto.preco || 0))}</Text>
                ) : null}
                <Text style={styles.value}>
                  {Number(produto.preco_por || 0) > 0
                    ? `Por: ${formatMoney(Number(produto.preco_por || produto.preco || 0))}`
                    : formatMoney(Number(produto.preco || 0))}
                </Text>
              </View>
              <Text style={styles.meta}>Estoque {produto.estoque}</Text>
              <TouchableOpacity
                style={[styles.statusBtn, produto.ativo ? styles.statusOn : styles.statusOff]}
                onPress={() => void toggleStatus(produto.id, Boolean(produto.ativo))}
                disabled={togglingId === produto.id}
              >
                {togglingId === produto.id ? (
                  <ActivityIndicator size="small" color="#e5e7eb" />
                ) : (
                  <>
                    <Ionicons name={produto.ativo ? "checkmark-circle-outline" : "close-circle-outline"} size={14} color="#e5e7eb" />
                    <Text style={styles.statusText}>{produto.ativo ? "Ativo" : "Inativo"}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => fillFormFromProduto(produto)}>
                <Ionicons name="create-outline" size={14} color="#bae6fd" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => void excluir(produto.id)}
                disabled={deletingId === produto.id}
              >
                {deletingId === produto.id ? (
                  <ActivityIndicator size="small" color="#fecaca" />
                ) : (
                  <Ionicons name="trash-outline" size={14} color="#fecaca" />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page <= 1 ? styles.pageBtnDisabled : null]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <Text style={styles.pageBtnText}>Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages ? styles.pageBtnDisabled : null]}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <Text style={styles.pageBtnText}>Próxima</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PortalShell>
  );
}

function SortButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sortBtn} onPress={onPress}>
      <Text style={styles.sortBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: "#071b13",
    borderWidth: 1,
    borderColor: "#166534",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  highlightLabel: { color: "#86efac", fontWeight: "700", fontSize: 12 },
  highlightValue: { marginTop: 3, color: "#f8fafc", fontSize: 25, fontWeight: "900" },
  highlightMeta: { marginTop: 6, color: "#bbf7d0", fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 12, marginBottom: 12 },
  cardTitle: { color: "#f8fafc", fontWeight: "900", fontSize: 15 },
  formRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  input: {
    minWidth: 160,
    flexGrow: 1,
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    color: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  saveBtn: { backgroundColor: "#22c55e", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, minWidth: 96, alignItems: "center" },
  saveBtnText: { color: "#022c22", fontWeight: "900" },
  cancelBtn: {
    backgroundColor: "#111827",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelBtnText: { color: "#cbd5e1", fontWeight: "800" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 },
  toolsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  sortBtn: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sortBtnText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  paginationInfo: { color: "#94a3b8", fontSize: 12, marginLeft: "auto" },
  empty: { color: "#94a3b8" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingVertical: 10,
  },
  title: { color: "#f8fafc", fontWeight: "800" },
  meta: { color: "#94a3b8", fontSize: 12 },
  oldValue: {
    color: "#94a3b8",
    fontSize: 11,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  value: { color: "#22c55e", fontWeight: "900", minWidth: 120, textAlign: "right" },
  statusBtn: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 4, minWidth: 100, justifyContent: "center" },
  statusOn: { backgroundColor: "#14532d", borderWidth: 1, borderColor: "#15803d" },
  statusOff: { backgroundColor: "#3f1d1d", borderWidth: 1, borderColor: "#7f1d1d" },
  statusText: { color: "#e5e7eb", fontWeight: "800", fontSize: 12 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#082f49",
    borderWidth: 1,
    borderColor: "#0e7490",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: "#3f1d1d",
    borderColor: "#7f1d1d",
  },
  paginationRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  pageBtn: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#334155", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
});
